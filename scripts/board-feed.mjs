// 0187: the panel's event stream (/api/events), which tells every open page when the board changes, and the watch on
// the files the board is read from that tells it when to read the board again.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { sh, worktreeList } from './speck.mjs';

// A keep-alive every PANEL_PING_MS, well inside the 100 seconds a quiet connection lasts through Cloudflare, on which
// the page also redraws what it works out from the clock. The board is read again every BOARD_CHECK_PINGS keep-alives
// for what no file records. File changes are gathered for BOARD_SETTLE_MS, a build log's for BOARD_LOG_MS, and a
// browser tries again STREAM_RETRY_MS after a stream drops.
const PANEL_PING_MS = 5000, BOARD_CHECK_PINGS = 3, BOARD_SETTLE_MS = 100, BOARD_LOG_MS = 2000, STREAM_RETRY_MS = 1000;

// The open streams of the board read from `repo` (speck run's records in `runs`). read() starts a reading of the board;
// the server then gives announce() what /api/state would answer with, which tells every stream of a board that differs
// from the last, by its number, and returns that number. Changes to the files are gathered so that a burst of them,
// such as a commit changing ten tickets, starts one reading.
// 0189: each stream is first told its own name (event `stream`), by which the page opens build logs on it. `logs` (see
// logFeed) hears of each stream that opens and closes, each write to a file in `runs` and each keep-alive, and send()
// writes an event to a stream by its name.
export function boardFeed(repo, runs, read, logs = {}) {
  const streams = new Set(), untold = new Set(); // untold: streams opened before the board was known
  const named = new Map(); // a stream's name → the stream
  let version = 0, shown = null, soon = null, soonAt = 0, pings = 0;
  const changed = (slow = false) => {
    const ms = slow ? BOARD_LOG_MS : BOARD_SETTLE_MS;
    if (soon && soonAt <= Date.now() + ms) return;
    clearTimeout(soon);
    soonAt = Date.now() + ms;
    soon = setTimeout(() => { soon = null; read(); }, ms);
  };
  const files = boardWatcher(repo, runs, changed, name => logs.written?.(name));
  // The keep-alive also looks again for what to watch.
  const pingMs = Number(process.env.SPECK_PANEL_PING_MS) > 0 ? Number(process.env.SPECK_PANEL_PING_MS) : PANEL_PING_MS;
  const ping = setInterval(() => {
    files.sync();
    for (const res of streams) res.write('event: ping\ndata: 1\n\n');
    logs.ping?.();
    if (streams.size && ++pings % BOARD_CHECK_PINGS === 0) changed();
  }, pingMs);
  ping.unref();
  return {
    changed,
    watched: () => streams.size > 0,
    send(name, event, data) { const res = named.get(name); if (res) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); },
    announce(body) {
      if (body !== shown) { shown = body; version++; for (const res of streams) res.write(`data: ${version}\n\n`); }
      else for (const res of untold) res.write(`data: ${version}\n\n`);
      untold.clear();
      return version;
    },
    // A new stream is told of the latest board at once, or, while there's no up-to-date reading (`known`), of the
    // next one, which this starts, whether or not that board differs from the last. One opened while the server is stopping ends at once, so the browser tries again.
    open(res, known, stopping) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Content-Type-Options': 'nosniff', 'X-Accel-Buffering': 'no' });
      res.write(`retry: ${STREAM_RETRY_MS}\n${known ? `data: ${version}\n` : ''}\n`);
      if (stopping) return res.end();
      const name = crypto.randomBytes(16).toString('hex');
      res.write(`event: stream\ndata: ${name}\n\n`);
      streams.add(res);
      named.set(name, res);
      logs.opened?.(name);
      res.on('close', () => { streams.delete(res); untold.delete(res); named.delete(name); logs.closed?.(name); });
      if (!known) { untold.add(res); changed(); }
    },
    close() {
      clearInterval(ping);
      clearTimeout(soon);
      files.close();
      for (const res of streams) res.end();
      streams.clear();
      untold.clear();
    },
  };
}

// 0187: watches the files the board is read from and calls changed(slow) on each change: speck/ in every checkout (its
// tickets, ideas and config) and speck run's records, plus git's list of worktrees, so a build's new worktree is watched
// once it's made. A build log growing is slow (only its spend shows), the rest isn't, and is also told to `log` with the
// log's name (0189). A folder that isn't there yet is
// watched through its parent until it is. sync() looks again for what to watch, and close() stops watching.
export function boardWatcher(repo, runs, changed, log = () => {}) {
  const watching = new Map(); // folder → its fs.FSWatcher
  let common = null;
  try { const r = sh('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repo }); if (r.status === 0) common = r.stdout.trim() || null; } catch { /* not a git checkout */ }
  // Each folder to watch → { recursive, again: whether a change in it can change what to watch }.
  const wanted = () => {
    let trees = [];
    try { trees = worktreeList(repo).map(w => w.path).filter(Boolean); } catch { /* not a git checkout: this one */ }
    if (!trees.includes(repo)) trees.push(repo);
    const want = new Map();
    // A folder that isn't there yet is watched through the nearest one above it that is, up to `top`, for only the
    // name on the way to it: git rewrites its own files as it reads, so a reading would otherwise start the next.
    const add = (dir, top, recursive, again) => {
      let d = dir, only = null;
      while (!fs.existsSync(d) && d !== top && path.dirname(d) !== d) { only = path.basename(d); d = path.dirname(d); }
      if (!fs.existsSync(d)) return;
      if (only === null) want.set(d, { recursive, again, only: null });
      else if (!want.has(d)) want.set(d, { recursive: false, again: true, only });
    };
    for (const t of trees) {
      add(path.join(t, 'speck'), t, false, true);
      add(path.join(t, 'speck', 'tickets'), t, true, false);
      add(path.join(t, 'speck', 'ideas'), t, true, false);
    }
    add(runs, repo, false, false);
    if (common) add(path.join(common, 'worktrees'), common, false, true);
    return want;
  };
  // Once new watches have started, it looks again: a folder made after it looked but before a watch on its parent
  // started (a build's new worktree being checked out, say) isn't seen by that watch. One found that way is watched
  // too, and the board read again, in case something in it changed before its watch started.
  const sync = (first = false) => {
    for (let pass = 0; pass < 5; pass++) {
      const want = wanted();
      for (const [dir, w] of watching) {
        const k = want.get(dir);
        if (!k || k.recursive !== w.recursive || k.again !== w.again || k.only !== w.only) { w.close(); watching.delete(dir); }
      }
      let added = false;
      for (const [dir, { recursive, again, only }] of want) {
        if (watching.has(dir)) continue;
        let w;
        try {
          w = fs.watch(dir, { recursive, persistent: false }, (type, name) => {
            if (only !== null && name && String(name) !== only) return;
            if (again) sync();
            const isLog = dir === runs && /\.log$/.test(String(name || ''));
            if (isLog) log(String(name));
            changed(isLog);
          });
        } catch { continue; } // gone already, or out of watches: the next sync tries again, and the keep-alive's reading covers it
        Object.assign(w, { recursive, again, only });
        w.on('error', () => { w.close(); if (watching.get(dir) === w) watching.delete(dir); });
        watching.set(dir, w);
        added = true;
      }
      if (!added) return;
      if (pass > 0 && !first) changed();
    }
  };
  sync(true);
  return { sync, close: () => { for (const w of watching.values()) w.close(); watching.clear(); } };
}

// 0188: what /api/state answers with, kept in parts, so a page that has an earlier one gets only what changed since.
// The tickets (by id) and ideas (by path) are kept item by item, and everything else, such as speck run's state, whole.
// An item unchanged since `prev` keeps prev's text, so the recent boards kept for the pages share it. A list with an
// item that isn't an object with its own key, or two with the same key, is kept whole.
const KEYED = { tickets: 'id', ideas: 'path' };
export function boardSnapshot(state, prev = null) {
  const keys = [], parts = new Map(), texts = [];
  for (const [name, value] of Object.entries(state)) {
    const by = Object.hasOwn(KEYED, name) && Array.isArray(value) ? KEYED[name] : null;
    const was = prev && prev.parts.get(name);
    let part = by ? keyedPart(value, by, was && was.by === by ? was : null) : null, text;
    if (part) text = `[${part.order.map(k => part.items.get(k)).join(',')}]`;
    else {
      text = JSON.stringify(value);
      if (text === undefined) continue; // left out, as JSON.stringify leaves it out of the board
      part = { json: was && was.json === text ? was.json : text };
    }
    keys.push(name);
    parts.set(name, part);
    texts.push(`${JSON.stringify(name)}:${text}`);
  }
  return { keys, parts, body: `{${texts.join(',')}}` };
}
function keyedPart(list, by, was) {
  const order = [], items = new Map();
  for (const item of list) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return null;
    const key = item[by];
    if (!Object.hasOwn(item, by) || (typeof key !== 'string' && typeof key !== 'number')) return null;
    const k = String(key);
    if (items.has(k)) return null;
    const text = JSON.stringify(item), old = was && was.items.get(k);
    order.push(k);
    items.set(k, old === text ? old : text);
  }
  return { by, order, items };
}

// 0188: the update that turns board `from` (a snapshot, numbered `fromVersion`) into board `to`, as /api/state's
// answer: { delta: { from, to, keys, set, lists } }. keys names every part of `to` in order (a part not named is gone),
// set has each whole part that changed, and lists, for each list kept item by item on both sides, the items added or
// changed (put), the keys of those gone (drop) and the moves that turn the old order, without those gone and with those
// added at the end, into the new one: each [key, the key it now follows, or null when it's first], in the new order.
// Only the fewest items that must move are named, so a ticket moving up the list costs one move however long it is.
export function boardDelta(from, to, fromVersion, toVersion) {
  const set = [], lists = [];
  for (const name of to.keys) {
    const now = to.parts.get(name), was = from.parts.get(name);
    if (now.by && was && was.by === now.by) {
      const drop = was.order.filter(k => !now.items.has(k));
      const added = now.order.filter(k => !was.items.has(k));
      const put = now.order.filter(k => was.items.get(k) !== now.items.get(k)).map(k => now.items.get(k));
      const moves = movesFor([...was.order.filter(k => now.items.has(k)), ...added], now.order);
      if (put.length || drop.length || moves.length) lists.push(`${JSON.stringify(name)}:{"by":${JSON.stringify(now.by)},"put":[${put.join(',')}],"drop":${JSON.stringify(drop)},"moves":${JSON.stringify(moves)}}`);
    } else {
      const text = now.by ? `[${now.order.map(k => now.items.get(k)).join(',')}]` : now.json;
      if (!was || was.by || was.json !== text) set.push(`${JSON.stringify(name)}:${text}`);
    }
  }
  return `{"delta":{"from":${JSON.stringify(fromVersion)},"to":${JSON.stringify(toVersion)},"keys":${JSON.stringify(to.keys)},"set":{${set.join(',')}},"lists":{${lists.join(',')}}}}`;
}

// The moves that turn order `from` into `to` (the same keys): every key outside the longest run of keys that keep their
// order, each with the key before it in `to`.
function movesFor(from, to) {
  const at = new Map(from.map((k, i) => [k, i])), tails = [], back = new Array(to.length).fill(-1);
  to.forEach((k, i) => {
    const p = at.get(k);
    let lo = 0, hi = tails.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (at.get(to[tails[mid]]) < p) lo = mid + 1; else hi = mid; }
    if (lo > 0) back[i] = tails[lo - 1];
    tails[lo] = i;
  });
  const stay = new Set();
  for (let i = tails.length ? tails[tails.length - 1] : -1; i >= 0; i = back[i]) stay.add(i);
  return to.flatMap((k, i) => (stay.has(i) ? [] : [[k, i ? to[i - 1] : null]]));
}

// 0188: the server's recent boards, by the number boardFeed gave each. snapshot() keeps a board in parts after the last
// one kept, and keep() keeps it as `version`, with the BOARDS_KEPT before it. answer() gives what /api/state answers a
// page with: only what changed since the board the page says it has (X-Speck-Have, as this server numbered it), while
// that's one of those kept, or else the whole board, and the name of the board the page then has, for its
// X-Speck-Board header. A board is named `<epoch>:<version>`, so a page can't mistake one from an earlier server for
// one of this one's.
const BOARDS_KEPT = 16;
export function boardVersions() {
  const epoch = crypto.randomBytes(8).toString('hex'), kept = new Map(); // version → its snapshot
  let last = null;
  return {
    snapshot: state => boardSnapshot(state, last),
    keep(version, snap) {
      last = snap;
      kept.delete(version);
      kept.set(version, snap);
      for (const v of kept.keys()) if (kept.size > BOARDS_KEPT) kept.delete(v);
    },
    answer(snap, version, have) {
      const m = /^([0-9a-f]{16}):(\d{1,15})$/.exec(have || ''), from = m && m[1] === epoch ? kept.get(Number(m[2])) : undefined;
      const name = `${epoch}:${version}`;
      return { body: from ? boardDelta(from, snap, `${epoch}:${m[2]}`, name) : snap.body, name };
    },
  };
}

// 0178: the board as the panel sends it. A finished ticket outside the Shipped list's latest five, which the page shows
// only in the Shipped figures, keeps only what those use: its id and status, its times, its builder's spend and, in place
// of its review rounds, how many there were and the reviewer tokens of them all (review_total). A cancelled one, which the page doesn't show,
// keeps its id and status. The latest five, picked as the page picks them, a ticket whose ship is still running and one
// merged but not pushed (0204) stay whole. `speck status --json` is unchanged.
const SHIPPED_SHOWN = 5;
export function panelBoard(board) {
  if (!board || !Array.isArray(board.tickets)) return board;
  const time = v => { const n = typeof v === 'string' ? Date.parse(v) : NaN; return Number.isFinite(n) ? n : null; };
  const shipping = t => !!t.ship && typeof t.ship === 'object' && t.ship.running === true;
  const done = board.tickets.filter(t => t && t.status === 'done' && !shipping(t)), finished = new Set(done);
  const ended = done.filter(t => time(t.finished) !== null).sort((a, b) => time(b.finished) - time(a.finished));
  const shown = new Set([...ended, ...done.filter(t => time(t.finished) === null)].slice(0, SHIPPED_SHOWN));
  const at = v => (time(v) === null ? null : new Date(time(v)).toISOString());
  const spent = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
  const slim = t => {
    if (t && t.status === 'cancelled') return { id: t.id, status: t.status };
    if (!finished.has(t) || shown.has(t) || (t.ship && typeof t.ship === 'object' && t.ship.unpushed === true)) return t;
    const rounds = Array.isArray(t.rounds) ? t.rounds : [];
    const tokens = rounds.reduce((n, r) => n + (Number(r && r.tokens) || 0), 0);
    return { id: t.id, status: t.status, started: at(t.started), finished: at(t.finished), approved: at(t.approved),
      waited_seconds: typeof t.waited_seconds === 'number' && Number.isFinite(t.waited_seconds) ? t.waited_seconds : null,
      review_total: { rounds: rounds.length, tokens }, builder_tokens: spent(t.builder_tokens), builder_cost_usd: spent(t.builder_cost_usd) };
  };
  return { ...board, tickets: board.tickets.map(slim) };
}

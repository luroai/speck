// 0187: the panel's event stream (/api/events), which tells every open page when the board changes, and the watch on
// the files the board is read from that tells it when to read the board again.
import fs from 'node:fs';
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
export function boardFeed(repo, runs, read) {
  const streams = new Set();
  let version = 0, shown = null, soon = null, soonAt = 0, pings = 0;
  const changed = (slow = false) => {
    const ms = slow ? BOARD_LOG_MS : BOARD_SETTLE_MS;
    if (soon && soonAt <= Date.now() + ms) return;
    clearTimeout(soon);
    soonAt = Date.now() + ms;
    soon = setTimeout(() => { soon = null; read(); }, ms);
  };
  const files = boardWatcher(repo, runs, changed);
  // The keep-alive also looks again for what to watch.
  const pingMs = Number(process.env.SPECK_PANEL_PING_MS) > 0 ? Number(process.env.SPECK_PANEL_PING_MS) : PANEL_PING_MS;
  const ping = setInterval(() => {
    files.sync();
    for (const res of streams) res.write('event: ping\ndata: 1\n\n');
    if (streams.size && ++pings % BOARD_CHECK_PINGS === 0) changed();
  }, pingMs);
  ping.unref();
  return {
    changed,
    watched: () => streams.size > 0,
    announce(body) {
      if (body !== shown) { shown = body; version++; for (const res of streams) res.write(`data: ${version}\n\n`); }
      return version;
    },
    // A new stream is told of the latest board at once, or, until the board has been read (`known`), of the first
    // reading, which this starts. One opened while the server is stopping ends at once, so the browser tries again.
    open(res, known, stopping) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Content-Type-Options': 'nosniff', 'X-Accel-Buffering': 'no' });
      res.write(`retry: ${STREAM_RETRY_MS}\n${known ? `data: ${version}\n` : ''}\n`);
      if (stopping) return res.end();
      streams.add(res);
      res.on('close', () => streams.delete(res));
      if (!known) changed();
    },
    close() {
      clearInterval(ping);
      clearTimeout(soon);
      files.close();
      for (const res of streams) res.end();
      streams.clear();
    },
  };
}

// 0187: watches the files the board is read from and calls changed(slow) on each change: speck/ in every checkout (its
// tickets, ideas and config) and speck run's records, plus git's list of worktrees, so a build's new worktree is watched
// once it's made. A build log growing is slow (only its spend shows), the rest isn't. A folder that isn't there yet is
// watched through its parent until it is. sync() looks again for what to watch, and close() stops watching.
function boardWatcher(repo, runs, changed) {
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
  const sync = () => {
    const want = wanted();
    for (const [dir, w] of watching) {
      const k = want.get(dir);
      if (!k || k.recursive !== w.recursive || k.again !== w.again || k.only !== w.only) { w.close(); watching.delete(dir); }
    }
    for (const [dir, { recursive, again, only }] of want) {
      if (watching.has(dir)) continue;
      let w;
      try {
        w = fs.watch(dir, { recursive, persistent: false }, (type, name) => {
          if (only !== null && name && String(name) !== only) return;
          if (again) sync();
          changed(dir === runs && /\.log$/.test(String(name || '')));
        });
      } catch { continue; } // gone already, or out of watches: the next sync tries again, and the keep-alive's reading covers it
      Object.assign(w, { recursive, again, only });
      w.on('error', () => { w.close(); if (watching.get(dir) === w) watching.delete(dir); });
      watching.set(dir, w);
    }
  };
  sync();
  return { sync, close: () => { for (const w of watching.values()) w.close(); watching.clear(); } };
}

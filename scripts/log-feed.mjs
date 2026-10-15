// 0189: each open build log, followed as its build writes it, so the panel's event stream (see boardFeed) can send a page
// only the entries written since, without reading the whole log again.
import fs from 'node:fs';
import path from 'node:path';
import { readablePiece } from './build-log.mjs';

// A page is shown the last LOG_LINES lines, and the server keeps twice that, for blank lines at the end that aren't
// shown until something follows them. A log's first HEAD_BYTES tell one build's log from the next one's, written over
// it from the start. Writes are gathered for LOG_SETTLE_MS, so a burst of them is one update.
const LOG_LINES = 200, HEAD_BYTES = 1024, LOG_SETTLE_MS = 50;
let builds = 0; // numbers each log as it's first read, across every follower, so a page can't mistake one for another

// The logs in `runs` that the panel's streams have open, with hooks for boardFeed: opened() and closed() as each stream
// opens and closes, written() as a file in `runs` changes, and ping() at each keep-alive. answer() answers a page asking
// for a ticket's log (GET /api/tickets/<id>/log): with the name of an open stream (its X-Speck-Stream header), it opens the log on that stream and
// gives it as it is now ({ text, truncated, build, at }), after which send(stream, 'log', update) sends the stream each
// change: { id, build, at, drop, lines }, to take the last `drop` lines off the log and add `lines`, with at counting
// the updates to that build's log, or { id, build, at, reset: true, text, truncated } when a new build has started the
// log afresh. Without one, it's answered by fallback(id) and not followed. A log no stream has open isn't followed.
// The log is read as the panel showed it before 0189: each entry with its time, trailing blank lines left out. A last
// line still being written is shown as far as it has got, unless it's an event (it starts with `{`), which is shown
// once it's whole.
export function logFeed(runs, send, fallback) {
  const follows = new Map(); // ticket id → what's known of its log
  const streams = new Set(); // the names of the open streams
  const order = new Map(); // `<stream> <id>` → the X-Speck-Order of the latest request opening or closing it there

  // The lines of a piece of the log, from `last` on, as the page shows them.
  const linesOf = (buf, from, to, last) => {
    const piece = readablePiece(buf.toString('utf8', from, to), { times: true, last });
    return { lines: piece.lines.length ? piece.lines.join('\n').split('\n') : [], last: piece.last };
  };
  // Reads the whole lines in buf (read from the log at f.pos), and what's there of the line after them.
  const take = (f, buf) => {
    const end = buf.lastIndexOf(10) + 1;
    if (end) {
      if (f.head.length < HEAD_BYTES) f.head = Buffer.concat([f.head, buf.subarray(0, Math.min(HEAD_BYTES - f.head.length, end))]);
      const piece = linesOf(buf, 0, end - 1, f.last);
      f.pos += end;
      f.last = piece.last;
      f.whole += piece.lines.length;
      f.lines.push(...piece.lines);
      if (f.lines.length > 2 * LOG_LINES) f.lines.splice(0, f.lines.length - 2 * LOG_LINES);
    }
    f.partial = end < buf.length && buf[end] !== 0x7b ? linesOf(buf, end, buf.length, f.last).lines : [];
  };
  // The log as shown: its last LOG_LINES lines, without blank lines at the end, which line of the log it ends before
  // (end), and whether it has more.
  const view = f => {
    const lines = [...f.lines, ...f.partial];
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    const end = f.whole - f.lines.length + lines.length;
    return { lines: lines.slice(-LOG_LINES), end, truncated: end > LOG_LINES };
  };
  // What the streams have been shown: up to which line, and up to which line that was whole lines, which don't change.
  const shown = (f, v) => { f.shownEnd = v.end; f.stable = Math.min(v.end, f.whole); return v; };
  // Reads the log from the start.
  const start = (f, fd) => {
    Object.assign(f, { build: ++builds, at: 0, pos: 0, size: 0, head: Buffer.alloc(0), last: null, whole: 0, lines: [], partial: [] });
    if (fd !== null) { f.size = fs.fstatSync(fd).size; take(f, readAll(fd, 0, f.size)); }
    return shown(f, view(f));
  };
  const open = f => { try { return fs.openSync(f.file, 'r'); } catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return null; throw e; } };
  const tell = (f, update) => { for (const s of f.streams) send(s, 'log', { id: f.id, build: f.build, at: f.at, ...update }); };
  const reset = (f, v) => tell(f, { reset: true, text: v.lines.join('\n'), truncated: v.truncated });

  // Reads what's been written since, and tells the log's streams what changed. A log written over by a new build, or
  // emptied, is read again from the start, and they're sent all of it.
  const catchUp = f => {
    const fd = open(f);
    try {
      const size = fd === null ? 0 : fs.fstatSync(fd).size;
      if (size < f.pos || (f.head.length && !readAll(fd, 0, f.head.length).equals(f.head))) return reset(f, start(f, fd));
      if (size === f.size) return;
      f.size = size;
      take(f, fd === null ? Buffer.alloc(0) : readAll(fd, f.pos, size - f.pos));
    } finally { if (fd !== null) fs.closeSync(fd); }
    const from = f.stable, drop = f.shownEnd - from, v = view(f);
    if (v.end === f.shownEnd && f.stable === Math.min(v.end, f.whole)) return; // nothing new to show, or not yet
    f.at++;
    const first = v.end - v.lines.length;
    if (from < first || v.end < from) return reset(f, shown(f, v));
    shown(f, v);
    tell(f, { drop, lines: v.lines.slice(from - first) });
  };
  const quietly = f => { try { catchUp(f); } catch { /* unreadable for now: the next write or keep-alive tries again */ } };

  const feed = {
    opened(stream) { streams.add(stream); },
    // A stream that has closed: none of its logs are sent to it again.
    closed(stream) {
      streams.delete(stream);
      for (const id of [...follows.keys()]) feed.unsubscribe(stream, id);
      for (const k of [...order.keys()]) if (k.startsWith(`${stream} `)) order.delete(k);
    },
    // A page asking for ticket `id`'s log (padded), on the stream its headers name if that's open, or closing it there
    // (`close`). A page numbers these requests (X-Speck-Order), and one that arrives after a later one has been answered
    // opens or closes nothing, so closing and opening a log quickly leaves it open.
    answer(headers, id, close = false) {
      const stream = String(headers['x-speck-stream'] ?? ''), n = Number(/^\d{1,15}$/.test(headers['x-speck-order'] ?? '') ? headers['x-speck-order'] : NaN);
      const key = `${stream} ${id}`, late = order.has(key) && !(n > order.get(key));
      const on = streams.has(stream) && !late;
      if (on && n >= 0) order.set(key, n);
      if (close) { if (on) feed.unsubscribe(stream, id); return { ok: true }; }
      if (on) return feed.subscribe(stream, id);
      if (!follows.has(id)) return fallback(id);
      const v = view(follows.get(id));
      return { text: v.lines.join('\n'), truncated: v.truncated };
    },
    // Adds `stream` to the log of ticket `id` (padded), and returns the log as it is now.
    subscribe(stream, id) {
      let f = follows.get(id);
      if (f) catchUp(f);
      else {
        f = { id, file: path.join(runs, `${id}.log`), streams: new Set(), soon: null };
        const fd = open(f);
        try { start(f, fd); } finally { if (fd !== null) fs.closeSync(fd); }
        follows.set(id, f);
      }
      f.streams.add(stream);
      const v = view(f);
      return { text: v.lines.join('\n'), truncated: v.truncated, build: f.build, at: f.at };
    },
    unsubscribe(stream, id) {
      const f = follows.get(id);
      if (!f) return;
      f.streams.delete(stream);
      if (!f.streams.size) { clearTimeout(f.soon); follows.delete(id); }
    },
    // A file in `runs` changed: if it's a followed log, it's read once the writes have settled.
    written(name) {
      const m = /^(.+)\.log$/.exec(String(name || ''));
      const f = m && follows.get(m[1]);
      if (!f || f.soon) return;
      f.soon = setTimeout(() => { f.soon = null; quietly(f); }, LOG_SETTLE_MS);
    },
    // Looks at every followed log, for a change a watch missed.
    ping() { for (const f of follows.values()) quietly(f); },
    following: () => [...follows.keys()],
  };
  return feed;
}

function readAll(fd, from, length) {
  const buf = Buffer.alloc(length);
  for (let got = 0; got < length;) {
    const n = fs.readSync(fd, buf, got, length - got, from + got);
    if (!n) return buf.subarray(0, got);
    got += n;
  }
  return buf;
}

// 0187: helpers for the panel's event stream (/api/events): a client that reads it, a git that counts the board's
// readings, and EventSources for the page run without a browser.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';

// Opens /api/events and collects its events ({ event, data }; a nameless one is 'message'). `until(pred, ms)` resolves
// with the first event from `from` on that matches, failing after `ms`, and `ended` once the panel has closed it.
export function openStream(port, { host = `127.0.0.1:${port}`, headers = {} } = {}) {
  const events = [], waiters = new Set();
  let req, res = null, buf = '', retry = null, onEnd;
  const ended = new Promise(r => { onEnd = r; });
  const check = () => { for (const w of [...waiters]) w(); };
  const opened = new Promise((resolve, reject) => {
    req = http.get({ host: '127.0.0.1', port, path: '/api/events', headers: { Host: host, Accept: 'text/event-stream', ...headers } }, r => {
      res = r;
      r.setEncoding('utf8');
      r.on('data', d => {
        buf += d;
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, i); buf = buf.slice(i + 2);
          const e = { event: 'message', data: null, at: Date.now() };
          for (const line of block.split('\n')) {
            if (line.startsWith(':')) continue;
            const [k, ...v] = line.split(':'); const val = v.join(':').replace(/^ /, '');
            if (k === 'event') e.event = val;
            else if (k === 'data') e.data = e.data === null ? val : `${e.data}\n${val}`;
            else if (k === 'retry') retry = Number(val);
          }
          if (e.data !== null) events.push(e);
        }
        check();
      });
      r.on('end', () => { onEnd(); check(); });
      r.on('close', () => { onEnd(); check(); });
      resolve(r);
    });
    req.on('error', e => { onEnd(); reject(e); });
  });
  const until = (pred, ms = 5000, from = 0, what = 'an event') => new Promise((resolve, reject) => {
    const t = setTimeout(() => { waiters.delete(w); reject(new Error(`no ${what} on the stream within ${ms} ms: ${JSON.stringify(events)}`)); }, ms);
    const w = () => { const e = events.slice(from).find(pred); if (e) { clearTimeout(t); waiters.delete(w); resolve(e); } };
    waiters.add(w); w();
  });
  opened.catch(() => {}); // a stream that didn't open shows as no events, and in ended
  return { events, opened, ended, until, get res() { return res; }, get retry() { return retry; }, close: () => req.destroy() };
}

// A GET of /api/state as the page sends it once the stream says board `version` is ready.
export function stateFor(port, version) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/api/state', headers: { Host: `127.0.0.1:${port}`, 'X-Speck-Board': String(version) } }, r => {
      let body = ''; r.setEncoding('utf8'); r.on('data', d => { body += d; }); r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(body) }));
    }).on('error', reject);
  });
}

// A folder with a `git` that counts each `git worktree list`, then runs the real one. Every reading of the board lists
// the worktrees the same number of times, so the count tells how many readings there were.
export function countingGit() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-git-'));
  const real = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
  const log = path.join(dir, 'calls');
  fs.writeFileSync(path.join(dir, 'git'), `#!/bin/sh\nif [ "$1" = worktree ] && [ "$2" = list ]; then echo x >> '${log}'; fi\nexec '${real}' "$@"\n`, { mode: 0o755 });
  const count = () => { try { return fs.readFileSync(log, 'utf8').split('\n').filter(Boolean).length; } catch { return 0; } };
  return { env: { PATH: `${dir}${path.delimiter}${process.env.PATH}` }, count, reset: () => fs.rmSync(log, { force: true }) };
}

const wait = ms => new Promise(r => setTimeout(r, ms));
export { wait };

// An EventSource for fakePage whose server announces a new board each time the test runs its 2-second timer, as the
// page's own poll did before 0187, so a test runs "the next refresh" as it always has. The first comes once it opens.
export const tickingSource = ctx => class EventSource {
  constructor(url) {
    this.url = url; this.readyState = 0; this.listeners = {};
    let version = 0;
    const next = () => { if (this.readyState === 2) return; ctx.setTimeout(next, 2000); this.emit('message', String(++version)); };
    ctx.setTimeout(next, 2000);
    Promise.resolve().then(() => { if (this.readyState === 2) return; this.readyState = 1; this.emit('open'); this.emit('message', String(++version)); });
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  emit(type, data) { for (const fn of this.listeners[type] || []) fn({ type, data }); }
  close() { this.readyState = 2; }
};

// An EventSource that does only what the test tells it to: `sources` gets each one the page makes.
export function manualSources() {
  const sources = [];
  class EventSource {
    constructor(url) { this.url = url; this.readyState = 0; this.listeners = {}; sources.push(this); }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, data) { if (type === 'open') this.readyState = 1; for (const fn of this.listeners[type] || []) fn({ type, data }); }
    fail(closed = false) { this.readyState = closed ? 2 : 0; this.emit('error'); }
    close() { this.readyState = 2; }
  }
  return { EventSource, sources };
}

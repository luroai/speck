// 0516: switching between the speck panels running on this machine, at one address. Each panel keeps a record of
// itself in the user's home folder, ~/.config/speck/panels/<port>.json (it holds the project's folder, so never in a
// repo), while it runs. The page's project menu lists them, and choosing one sets a cookie for the panel at the
// address, which from then on passes each of the page's requests on to the chosen panel and its answers back. The
// chosen panel serves them as its own, checking its own key: the panel at the address adds nothing to them but the
// Host and Origin the chosen panel serves, and only when they're its own.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { pidAlive } from './run-switch.mjs';

const LIST_MS = 1000, WATCH_MS = 2000, GONE_RETRY_MS = 3000;
// Hop-by-hop headers, which belong to one connection and aren't passed on.
const HOP = new Set(['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-connection', 'te', 'trailer']);

// SPECK_PANELS_DIR is for the tests, so their panels don't join the menus of yours. '' when there's no home folder.
export function panelsDir() {
  if (process.env.SPECK_PANELS_DIR) return process.env.SPECK_PANELS_DIR;
  try { return path.join(os.homedir(), '.config', 'speck', 'panels'); } catch { return ''; }
}

// The running panels, as [{ port, name }] by name and then port. A record whose process has gone (a panel killed, or
// stopped by Ctrl+C before it could tidy up) is left out, and deleted.
export function runningPanels(dir = panelsDir()) {
  let names = [];
  if (!dir) return [];
  try { names = fs.readdirSync(dir).filter(n => /^\d{1,5}\.json$/.test(n)); } catch { return []; }
  const out = [];
  for (const n of names) {
    let r = null;
    try { r = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); } catch { continue; } // half-written, or gone meanwhile
    if (!r || !Number.isInteger(r.pid) || r.pid <= 0 || r.port !== Number(n.slice(0, -5)) || r.port < 1 || r.port > 65535 || typeof r.name !== 'string') continue;
    if (!pidAlive(r.pid)) { try { fs.unlinkSync(path.join(dir, n)); } catch { /* gone already */ } continue; }
    out.push({ port: r.port, name: r.name });
  }
  return out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : a.port - b.port));
}

// This panel's record, written once it's serving (by each server process, so a restart on new code keeps it), and
// deleted as it exits, unless a newer process on the port has written it since.
export function registerPanel({ port, name, repo }, dir = panelsDir()) {
  if (!dir) return () => {}; // no home folder: the panel still serves, but isn't in the menus
  const file = path.join(dir, `${port}.json`);
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify({ pid: process.pid, port, name, repo })}\n`, { mode: 0o600 });
    fs.renameSync(tmp, file);
  } catch { /* no home folder to write to: the panel still serves, but isn't in the menus */ }
  return () => {
    try { if (JSON.parse(fs.readFileSync(file, 'utf8')).pid === process.pid) fs.unlinkSync(file); } catch { /* gone already */ }
  };
}

const cookieName = port => `speck-shown-${port}`;
// The port of the panel the page at this address chose, from its cookie, or null for this one.
function chosen(req, port) {
  const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${cookieName(port)}=(\\d{1,5})(?:;|$)`));
  return m && +m[1] !== port ? +m[1] : null;
}

// The panel at `port`'s side of it: its record, the menu's part of /api/state, and route(), which answers the
// requests that are the menu's or another panel's. `origins` are the addresses this panel serves; `changed` tells
// the page's stream when the running panels change.
export function panelProjects({ port, name, repo, origins, changed }) {
  const unregister = registerPanel({ port, name, repo });
  let cached = null, cachedAt = 0;
  const list = () => { if (!cached || Date.now() - cachedAt > LIST_MS) { cached = runningPanels(); cachedAt = Date.now(); } return cached; };
  const running = to => list().some(p => p.port === to);
  let last = JSON.stringify(list());
  const watcher = setInterval(() => { cached = null; const now = JSON.stringify(list()); if (now !== last) { last = now; changed(); } }, WATCH_MS);
  watcher.unref();
  const json = (res, status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(body)); };
  const ours = req => origins.has(String(req.headers.origin || '').toLowerCase());
  const clear = `${cookieName(port)}=; Path=/; Max-Age=0; SameSite=Strict`;

  // POST /api/projects/<port>: show that panel's project at this address, or this one's own again. Only from a page
  // at this address, as its Origin says: it may be another panel's page, carrying that panel's key, not this one's.
  function choose(req, res, to) {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST' });
    if (!ours(req)) return json(res, 403, { error: 'Forbidden: only a panel page at this address can do that. Reload it.' });
    if (to === port) return json(res, 200, { ok: true }, { 'Set-Cookie': clear });
    if (!running(to)) return json(res, 404, { error: 'That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.' });
    return json(res, 200, { ok: true }, { 'Set-Cookie': `${cookieName(port)}=${to}; Path=/; Max-Age=31536000; SameSite=Strict` });
  }

  // Passes the request on to the panel on `to`, on this machine, as one made to it directly, and its answer back.
  function pass(req, res, to) {
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k)) headers[k] = v;
    headers.host = `127.0.0.1:${to}`;
    headers['x-speck-via'] = String(port); // the panel on `to` answers it itself, never passing it on again
    if (ours(req)) headers.origin = `http://127.0.0.1:${to}`;
    const up = http.request({ host: '127.0.0.1', port: to, method: req.method, path: req.url, headers }, answer => {
      const back = {};
      for (const [k, v] of Object.entries(answer.headers)) if (!HOP.has(k)) back[k] = v;
      res.writeHead(answer.statusCode, back);
      answer.pipe(res);
      answer.on('error', () => res.destroy());
    });
    up.on('error', () => { if (!res.headersSent) gone(req, res); else res.destroy(); });
    res.on('close', () => { if (!res.writableFinished) up.destroy(); });
    req.pipe(up);
  }

  // The chosen panel has stopped. The page's stream is told so, with the panels still running, and tries again every
  // few seconds, so it's back once that panel is; a reload shows this panel's own project again.
  function gone(req, res) {
    const where = req.url.split('?')[0];
    if (where === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      return res.end(`retry: ${GONE_RETRY_MS}\nevent: gone\ndata: ${JSON.stringify({ list: list() })}\n\n`);
    }
    return json(res, 502, { error: 'This project\'s panel has stopped. Pick another project, or start its panel again with speck panel.', gone: true });
  }

  return {
    // { projects: { self, list } } while two or more panels are running, for /api/state; otherwise nothing.
    part: () => { const l = list(); return l.length > 1 ? { projects: { self: port, list: l } } : {}; },
    // True when it has answered the request, or passed it on; false when this panel serves it as its own.
    route(req, res) {
      if (req.headers['x-speck-via']) return false; // passed on by another panel: its own, as asked
      const where = req.url.split('?')[0], pick = where.match(/^\/api\/projects\/(\d{1,5})$/);
      if (pick) { choose(req, res, +pick[1]); return true; }
      const to = chosen(req, port);
      if (to === null) return false;
      cached = null;
      if (running(to)) { pass(req, res, to); return true; }
      if (where === '/' && req.method === 'GET') { res.setHeader('Set-Cookie', clear); return false; }
      gone(req, res);
      return true;
    },
    stop() { clearInterval(watcher); unregister(); },
  };
}

// 0765: shared helpers for the factory floor's tests: its page on fakePage's DOM, stand-in panels that give a summary
// and a board, and speck serve's address started in this process with them.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fakePage, T } from './panel.mjs';
import { startFront } from '../../scripts/serve-front.mjs';

// A browser's localStorage, kept in `m`. Two pages given the same one share it, as two loads in one browser do.
export const storage = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, m };
};

// The floor page (templates/floor.html) with its scripts run on fakePage's DOM, its requests answered with `responses`
// in turn, and its own localStorage unless `globals` gives one.
export const floorPage = (responses, globals = {}) => fakePage(responses, { localStorage: storage(), ...globals }, { page: 'floor.html' });

// A summary as a panel gives it (0595's projectSummary), with `o` over it.
export const summary = (o = {}) => ({ status: 'Idle', tone: 'idle', mood: 'watching', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0,
  spent_week_usd: null, spent_week_unknown: false, build_minutes: [], ...o });

// A board as a panel's /api/state gives it, with `o` over it.
export const board = (o = {}) => ({ tickets: [T('0001', 'ready')], ideas: [], run: { on: true, pid: 1 }, foreman: { word: 'Idle', tone: 'idle', name: 'speck' }, ...o });

// A stand-in for a project's panel on a free port of 127.0.0.1, with a record in `dir` as a running panel has. It
// answers /api/projects/own, asked by another speck, with its `summary`, and /api/state with its `board`, each as it is
// when asked, so a test can change them; null gives a 500 instead. While `hold` is a promise, /api/state answers once
// it has settled, as a panel slow to read its board does. The headers of each request for it are kept in `seen`.
export async function floorPanel(dir, name, { summary: s = summary(), board: b = board() } = {}) {
  const me = { name, summary: s, board: b, hold: null, seen: [] };
  const send = (res, body) => {
    if (body === null) { res.writeHead(500, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'The board reader stopped.' })); }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  };
  const server = http.createServer((req, res) => {
    const where = req.url.split('?')[0];
    if (where === '/api/projects/own' && req.headers['x-speck-via']) return send(res, me.summary);
    if (where === '/api/state') {
      me.seen.push(req.headers);
      const body = me.board;
      return me.hold ? void me.hold.then(() => send(res, body)) : send(res, body);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found.\n');
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  me.port = server.address().port;
  const record = path.join(dir, `${me.port}.json`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(record, `${JSON.stringify({ pid: process.pid, port: me.port, name, repo: `/stand-in/${name}` })}\n`);
  me.stop = () => new Promise(r => { fs.rmSync(record, { force: true }); server.close(() => r()); server.closeAllConnections(); });
  return me;
}

// speck serve's address, started in this process on a free port, with the panels' records in `dir` and `list()` as
// its list of projects (each { folder, name, port }); closed once the test `t` ends.
export async function floorFront(t, dir, list) {
  const f = await startFront({ port: 0, env: { ...process.env, SPECK_PANELS_DIR: dir }, projects: () => list() });
  t.after(() => f.close());
  return { ...f, origin: `http://127.0.0.1:${f.port}` };
}

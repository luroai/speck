// Shared helpers for 0757's tests of speck serve's one address (scripts/serve-front.mjs): stand-in panels that keep
// what reaches them, and requests made as a browser at the address makes them.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

// A folder of the test's own for the records of running panels, as SPECK_PANELS_DIR is.
export const panelsHere = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-front-panels-')));

// A stand-in for a project's panel on a free port of 127.0.0.1, with a record in `dir` as a running panel has. It
// answers /api/projects/own, asked by another speck, with `summary`, or never with `hang`; / with a page naming it;
// /api/events with a stream that sends `data: 1` at once and each of send()'s texts after; and anything else with JSON
// of what reached it, which it also keeps in `seen`, after `delay` ms. Every answer says it's its (X-Speck-Panel).
export async function standInPanel(dir, name, { summary = { status: 'Idle', mood: 'watching', building: 0, needs_you: 0, needs: [] }, hang = false, delay = 0 } = {}) {
  const seen = [], streams = new Set(), id = `${name}-panel`.padEnd(16, '0').slice(0, 16);
  const server = http.createServer((req, res) => {
    const parts = [];
    req.on('data', d => parts.push(d));
    req.on('end', () => {
      const where = req.url.split('?')[0];
      res.setHeader('X-Speck-Panel', id);
      if (where === '/api/projects/own' && req.headers['x-speck-via']) {
        if (hang) return; // never answers
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(summary));
      }
      const got = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(parts).toString('utf8') };
      seen.push(got);
      if (where === '/api/events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' });
        res.write('data: 1\n\n');
        streams.add(res);
        res.on('close', () => streams.delete(res));
        return;
      }
      if (where === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`<!doctype html><title>${name}</title><p>The panel of ${name}.</p>`);
      }
      setTimeout(() => {
        res.writeHead(201, { 'Content-Type': 'application/json', 'X-Stand-In': name });
        res.end(JSON.stringify({ from: name, ...got }));
      }, delay);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port, record = path.join(dir, `${port}.json`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(record, `${JSON.stringify({ pid: process.pid, port, name, repo: `/stand-in/${name}` })}\n`);
  return {
    port, id, seen, name,
    send: text => { for (const s of streams) s.write(text); },
    stop: () => new Promise(r => { fs.rmSync(record, { force: true }); for (const s of streams) s.destroy(); server.close(() => r()); server.closeAllConnections(); }),
  };
}

// A request to 127.0.0.1:<port> with the headers a browser at the address would send: its Host, and an Origin, cookie
// and key when given, and `body`. With `firstChunk`, it resolves with the first part of an event stream that has come.
export function ask(port, { method = 'GET', pathName = '/', host = `127.0.0.1:${port}`, origin, token, cookie, body, headers = {}, firstChunk = false } = {}) {
  return new Promise((resolve, reject) => {
    const h = { Host: host, ...headers };
    if (origin) h.Origin = origin;
    if (token) h['X-Speck-Token'] = token;
    if (cookie) h.Cookie = cookie;
    const req = http.request({ host: '127.0.0.1', port, method, path: pathName, headers: h }, res => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', d => { text += d; if (firstChunk && /\n\n/.test(text)) { resolve({ status: res.statusCode, headers: res.headers, body: text, res, req }); } });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text }));
      res.on('error', () => {});
    });
    req.setTimeout(15000, () => req.destroy(new Error(`no answer to ${method} ${pathName}`)));
    req.on('error', e => (firstChunk && e.code === 'ECONNRESET' ? null : reject(e)));
    req.end(body);
  });
}
// The cookie an answer sets, as a browser sends it back: name=value.
export const cookieOf = res => String([].concat(res.headers['set-cookie'] || [])[0] || '').split(';')[0];
// The whole Set-Cookie an answer has, or ''.
export const setCookieOf = res => String([].concat(res.headers['set-cookie'] || [])[0] || '');

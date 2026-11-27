// Shared by 0771's tests of speck serve's switch to new code: speck serve run from a copy of the CLI, edits to that
// copy's code that say which code gave an answer, a stand-in project whose panel answers slowly and keeps an event
// stream open, and requests made each on a connection of its own, as a page's new requests are.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { cliCopy } from './panel.mjs';
import { standInProject, freePortNow, argsOf } from './serve.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
export const URL_HOST = 'speck.example.ts.net', URL_ORIGIN = `https://${URL_HOST}`;

// A copy of the CLI, its scripts and templates, for speck serve to run from while a test changes its code: the path of
// its speck.mjs.
export const serveCopy = () => cliCopy().cli;
const fileOf = (cli, name) => path.join(path.dirname(cli), name);
export const readCode = (cli, name) => fs.readFileSync(fileOf(cli, name), 'utf8');
// Writes one file of the copy's code, failing if `text` leaves it as it was, so each edit is a change.
export function writeCode(cli, name, text) {
  assert.notEqual(text, readCode(cli, name), `${name} is changed`);
  fs.writeFileSync(fileOf(cli, name), text);
}

const MARK_AT = "res.setHeader('X-Speck-Serve', '1');";
// serve-front.mjs's text `src`, with every answer at the address saying which version of the code gave it (X-Speck-Test).
export function marked(src, version) {
  assert.ok(src.includes(MARK_AT), 'serve-front.mjs sets X-Speck-Serve on every answer');
  return src.replace(MARK_AT, `${MARK_AT} res.setHeader('X-Speck-Test', '${version}');`);
}
const FLOOR_AT = 'if (floorFile(where, res)) return; // 0765\n';
// The same, without the factory floor, as speck serve's code was before 0765: /floor is then not found.
export function withoutFloor(src) {
  assert.ok(src.includes(FLOOR_AT), 'serve-front.mjs serves the factory floor');
  return src.replace(FLOOR_AT, '');
}
// A module's text `src` that takes `ms` to load, or that throws as it loads.
export const slowToLoad = (src, ms) => `{ const t0 = Date.now(); while (Date.now() - t0 < ${ms}); }\n${src}`;
export const throwsOnLoad = (src, message) => `throw new Error(${JSON.stringify(message)});\n${src}`;

// speck serve run from the copy `cli`, in the foreground, on a free port unless `args` give one, with all it prints:
// { child, port, out() }. `extra` is added to its environment.
export function serveFrom(cli, m, args = [], extra = {}) {
  const given = args.findIndex(a => a === '--port');
  const port = given >= 0 ? Number(args[given + 1]) : freePortNow();
  const child = spawn(process.execPath, [cli, 'serve', ...(given >= 0 ? args : [...args, '--port', String(port)])], { cwd: os.tmpdir(), env: { ...m.env, ...extra } });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  return { child, port, out: () => out };
}
// speck serve --background from the copy `cli`, run to its end, with what it printed.
export const backgroundFrom = (cli, m, port, extra = {}) => spawnSync(process.execPath, [cli, 'serve', '--background', '--port', String(port)],
  { cwd: os.tmpdir(), env: { ...m.env, ...extra }, encoding: 'utf8', timeout: 60000 });

// The processes `pid` started that are still running.
export const childrenOf = pid => spawnSync('ps', ['-o', 'pid=', '--ppid', String(pid)], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).map(Number);
// The workers on new code the process you started, `host`, runs speck serve in from its first switch on: [pid]. Its
// other processes are the panels it started.
export const workersOf = host => childrenOf(host).filter(pid => argsOf(pid).includes('SPECK_SERVE_CODE_URL'));

// A stand-in project (support/stand-in-panel.mjs) whose panel also answers GET /api/slow?ms=<n> after n ms, and GET
// /api/events with an event stream that it keeps open, as a real panel's is.
export function slowProject(name) {
  const dir = standInProject(name), own = path.join(dir, '.speck', 'scripts', 'speck.mjs');
  const at = "if (where === '/api/panel') return res.end(JSON.stringify({ repo, url: null }));", src = fs.readFileSync(own, 'utf8');
  assert.ok(src.includes(at), 'the stand-in panel answers /api/panel');
  fs.writeFileSync(own, src.replace(at, `${at}
    if (where === '/api/slow') return void setTimeout(() => res.end(JSON.stringify({ slow: true, pid: process.pid })), Number(new URLSearchParams(req.url.split('?')[1] || '').get('ms')) || 3000);
    if (where === '/api/events') { res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' }); return void res.write('data: 1\\n\\n'); }`));
  return dir;
}

// One request to the address on 127.0.0.1:<port>, on a connection of its own, as a browser at the address makes it:
// { status, headers, body, version }, version being which code gave it (X-Speck-Test), or { error } when no answer
// came. It never rejects.
export function askFresh(port, { method = 'GET', pathName = '/', host = `127.0.0.1:${port}`, origin, cookie, timeout = 15000 } = {}) {
  return new Promise(resolve => {
    const headers = { Host: host, ...(origin ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}) };
    const req = http.request({ host: '127.0.0.1', port, method, path: pathName, headers, agent: false }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body, version: res.headers['x-speck-test'], host }));
      res.on('error', e => resolve({ error: e.code || e.message, host }));
    });
    req.setTimeout(timeout, () => req.destroy(new Error('no answer in time')));
    req.on('error', e => resolve({ error: e.code || e.message, host }));
    req.end();
  });
}

// GET / at the address every few ms, each time on a connection of its own and as each of `hosts` in turn, until
// stopped. got holds each answer, as askFresh gives it.
export function keepAsking(port, hosts) {
  const got = [];
  let on = true, i = 0;
  const done = (async () => { while (on) { got.push(await askFresh(port, { host: hosts[i++ % hosts.length], timeout: 5000 })); await sleep(15); } })();
  return { got, stop: async () => { on = false; await done; return got; } };
}

// The page's event stream at the address, with `cookie` choosing the project it's passed on to, once its first event
// has come: { version, ended, close() }, ended resolving once the stream has ended, with nothing else ending it.
export function openStream(port, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/api/events', headers: { Host: `127.0.0.1:${port}`, Cookie: cookie }, agent: false }, res => {
      const ended = new Promise(r => { res.on('end', r); res.on('close', r); res.on('error', r); });
      res.setEncoding('utf8');
      let text = '', told = false;
      res.on('data', d => {
        text += d;
        if (told || !text.includes('\n\n')) return;
        told = true;
        req.setTimeout(0); // from now on only the address, or close(), ends it
        resolve({ status: res.statusCode, version: res.headers['x-speck-test'], ended, close: () => req.destroy() });
      });
      res.on('end', () => { if (!told) reject(new Error(`the stream ended before its first event: ${res.statusCode} ${text}`)); });
    });
    req.setTimeout(15000, () => req.destroy(new Error('no event in time')));
    req.on('error', e => reject(e));
    req.end();
  });
}

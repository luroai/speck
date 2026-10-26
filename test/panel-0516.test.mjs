import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0516: switching to another project's panel from the header, at the one address.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { CLI, env, fakePage, panelRepo, freePort, request, startPanel, stop, tokenOf, T } from './support/panel.mjs';
import { manualSources } from './support/stream.mjs';
import { runningPanels, registerPanel, panelProjects } from '../scripts/panel-projects.mjs';

const projects = (self, ...list) => ({ self, list: list.map(([port, name]) => ({ port, name })) });
const board = extra => ({ tickets: [T('0001', 'ready')], ideas: [], ...extra });
const optionsOf = p => p.byId('project').children.map(o => ({ value: o.value, text: o.textContent, selected: o.selected, disabled: !!o.disabled }));
const until = async (check, ms = 10000) => { for (const end = Date.now() + ms; Date.now() < end; await new Promise(r => setTimeout(r, 100))) if (await check()) return true; return false; };
const deadPid = () => { const c = spawn(process.execPath, ['-e', '']); return new Promise(r => c.on('exit', () => r(c.pid))); };

// A request with the headers a browser at the address would send: its Host, and an Origin, cookie and key when given.
function ask(port, { method = 'GET', pathName = '/', host = `127.0.0.1:${port}`, origin, token, cookie, headers = {}, firstChunk = false } = {}) {
  return new Promise((resolve, reject) => {
    const h = { Host: host, ...headers };
    if (origin) h.Origin = origin;
    if (token) h['X-Speck-Token'] = token;
    if (cookie) h.Cookie = cookie;
    const req = http.request({ host: '127.0.0.1', port, method, path: pathName, headers: h }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; if (firstChunk && /\n\n/.test(body)) { req.destroy(); resolve({ status: res.statusCode, headers: res.headers, body }); } });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.setTimeout(15000, () => req.destroy(new Error(`no answer to ${method} ${pathName}`)));
    req.on('error', e => (firstChunk && e.code === 'ECONNRESET' ? null : reject(e)));
    req.end();
  });
}
const cookieOf = res => String([].concat(res.headers['set-cookie'] || [])[0] || '').split(';')[0];
const stateOf = async (port, cookie) => JSON.parse((await ask(port, { pathName: '/api/state', cookie })).body);

// ---------- the record of running panels, and the menu's part of the board (quick, in this process) ----------

test('0516 AC1: the running panels are those whose process is alive, by folder name, and a stopped one\'s record goes', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'panels-'));
  registerPanel({ port: 4801, name: 'speck', repo: '/x/speck' }, dir);
  registerPanel({ port: 4802, name: 'carbon', repo: '/x/carbon' }, dir);
  fs.writeFileSync(path.join(dir, '4803.json'), JSON.stringify({ pid: await deadPid(), port: 4803, name: 'gone', repo: '/x/gone' }));
  fs.writeFileSync(path.join(dir, '4804.json'), 'not json');
  fs.writeFileSync(path.join(dir, '4805.json'), JSON.stringify({ pid: process.pid, port: 4806, name: 'wrong port' }));
  assert.deepEqual(runningPanels(dir), [{ port: 4802, name: 'carbon' }, { port: 4801, name: 'speck' }]);
  assert.equal(fs.existsSync(path.join(dir, '4803.json')), false, 'a dead panel\'s record is deleted');
  assert.deepEqual(runningPanels(path.join(dir, 'missing')), [], 'no folder: no panels');
});

test('0516 AC1: a panel\'s record is deleted as it stops, unless a newer process on its port has written it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'panels-'));
  const unregister = registerPanel({ port: 4811, name: 'speck', repo: '/x' }, dir);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, '4811.json'), 'utf8')).pid, process.pid);
  unregister();
  assert.equal(fs.existsSync(path.join(dir, '4811.json')), false);
  const again = registerPanel({ port: 4812, name: 'speck', repo: '/x' }, dir);
  fs.writeFileSync(path.join(dir, '4812.json'), JSON.stringify({ pid: process.pid + 1, port: 4812, name: 'speck' }));
  again();
  assert.equal(fs.existsSync(path.join(dir, '4812.json')), true, 'the newer process\'s record stays');
});

// ---------- the header's menu, on the fake page ----------

test('0516 AC1: with two or more panels running, the header has a menu of their projects, the one shown chosen', async () => {
  const p = fakePage([board({ projects: projects(4777, [4778, 'carbon'], [4777, 'speck'], [4779, 'speck-site']) })]);
  await p.settle();
  assert.equal(p.byId('project-pick').hidden, false, 'the menu shows');
  assert.deepEqual(optionsOf(p), [
    { value: '4778', text: 'carbon', selected: false, disabled: false },
    { value: '4777', text: 'speck', selected: true, disabled: false },
    { value: '4779', text: 'speck-site', selected: false, disabled: false },
  ]);
});

test('0516 AC1: with no other panel running, the header shows no menu', async () => {
  for (const extra of [{}, { projects: projects(4777, [4777, 'speck']) }]) {
    const p = fakePage([board(extra)]);
    await p.settle();
    assert.equal(p.byId('project-pick').hidden, true);
  }
});

test('0516 AC1: two projects with the same folder name are told apart by their ports', async () => {
  const p = fakePage([board({ projects: projects(4777, [4777, 'speck'], [4790, 'speck']) })]);
  await p.settle();
  assert.deepEqual(optionsOf(p).map(o => o.text), ['speck · 4777', 'speck · 4790']);
});

test('0516 AC2: choosing another project asks the panel at the address to show it, then reloads the page there', async () => {
  let reloaded = 0;
  const p = fakePage([board({ projects: projects(4777, [4777, 'speck'], [4778, 'carbon']) }), { ok: true }], { location: { reload: () => { reloaded++; } } });
  await p.settle();
  p.byId('project').value = '4778';
  p.byId('project').listeners.change();
  await p.settle();
  const call = p.calls.find(c => c.url === '/api/projects/4778');
  assert.ok(call, 'it asks for that project');
  assert.equal(call.opts.method, 'POST');
  assert.equal(reloaded, 1, 'and the page reloads at the same address');
});

test('0516 AC2: a choice the panel refuses says why and leaves the project shown chosen', async () => {
  let reloaded = 0;
  const p = fakePage([board({ projects: projects(4777, [4777, 'speck'], [4778, 'carbon']) }), { status: 404, body: { error: 'That project\'s panel isn\'t running any more.' } }], { location: { reload: () => { reloaded++; } } });
  await p.settle();
  p.byId('project').value = '4778';
  p.byId('project').listeners.change();
  await p.settle();
  assert.equal(reloaded, 0);
  assert.equal(p.byId('offline').hidden, false);
  assert.match(p.byId('offline').textContent, /isn't running any more/);
  assert.equal(optionsOf(p).find(o => o.selected).value, '4777');
});

test('0516 AC3: the menu follows the panels running without a reload, and says so when the project shown has stopped', async () => {
  const { EventSource, sources } = manualSources();
  const p = fakePage([board({ projects: projects(4778, [4777, 'speck'], [4778, 'carbon']) }), board({ projects: projects(4778, [4777, 'speck'], [4778, 'carbon'], [4779, 'site']) }), board({ projects: projects(4778, [4777, 'speck'], [4778, 'carbon']) })], { EventSource });
  const s = sources[0];
  s.emit('open'); s.emit('message', '1'); await p.settle();
  assert.deepEqual(optionsOf(p).map(o => o.text), ['speck', 'carbon']);
  s.emit('message', '2'); await p.settle();
  assert.deepEqual(optionsOf(p).map(o => o.text), ['speck', 'carbon', 'site'], 'a panel that starts joins the menu');
  // carbon's panel stops: the panel at the address says so on the page's stream, with the panels still running.
  s.emit('gone', JSON.stringify({ list: [{ port: 4777, name: 'speck' }, { port: 4779, name: 'site' }] }));
  await p.settle();
  assert.equal(p.byId('offline').hidden, false);
  assert.match(p.byId('offline').textContent, /^carbon's panel has stopped/);
  assert.equal(p.byId('project-pick').hidden, false, 'the menu still shows');
  assert.deepEqual(optionsOf(p), [
    { value: '', text: 'carbon (stopped)', selected: true, disabled: true },
    { value: '4777', text: 'speck', selected: false, disabled: false },
    { value: '4779', text: 'site', selected: false, disabled: false },
  ]);
  s.emit('gone', JSON.stringify({ list: [{ port: 4777, name: 'speck' }] }));
  await p.settle();
  assert.deepEqual(optionsOf(p).map(o => o.text), ['carbon (stopped)', 'speck'], 'and it still follows them, down to one');
  // Its panel is back: the next board shows, without the notice.
  s.emit('open'); s.emit('message', '3'); await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  assert.deepEqual(optionsOf(p).map(o => o.text), ['speck', 'carbon']);
});

// ---------- the real panels ----------

const URL_HOST = 'speck.example.ts.net';
// Their repos are speck-keep-* folders, so they last while the file's tests run, as the panels do.
let a, b, ra, rb, tokenA, tokenB;
before(async () => {
  ra = panelRepo({ prefix: 'speck-keep-alpha-' });
  rb = panelRepo({ prefix: 'speck-keep-bravo-' });
  a = await startPanel(ra.dir, ['--port', String(await freePort()), '--url', `https://${URL_HOST}`]);
  tokenA = tokenOf((await request(a.port)).body);
  b = await startPanel(rb.dir, ['--port', String(await freePort())]);
  tokenB = tokenOf((await request(b.port)).body);
});
after(async () => { for (const p of [a, b]) if (p) await stop(p); });
const originA = () => `http://127.0.0.1:${a.port}`;
const nameOf = r => path.basename(r.dir);
const showB = async (host, origin) => cookieOf(await ask(a.port, { method: 'POST', pathName: `/api/projects/${b.port}`, host, origin }));

test('0516 AC1: each running panel\'s board lists every running panel\'s project, itself as the one shown', async () => {
  assert.ok(await until(async () => (await stateOf(a.port)).projects?.list.length === 2), 'both panels are listed');
  const sa = await stateOf(a.port), sb = await stateOf(b.port);
  assert.deepEqual(new Set(sa.projects.list.map(p => `${p.port} ${p.name}`)), new Set([`${a.port} ${nameOf(ra)}`, `${b.port} ${nameOf(rb)}`]));
  assert.equal(sa.projects.self, a.port);
  assert.equal(sb.projects.self, b.port);
  assert.ok(!JSON.stringify(sa.projects).includes(ra.dir), 'only folder names, never their paths');
});

test('0516 AC2: another project shown at the address is served by its own panel: page, board, stream, pack, settings and writes', async () => {
  const cookie = await showB(`127.0.0.1:${a.port}`, originA());
  assert.match(cookie, new RegExp(`^speck-shown-${a.port}=${b.port}$`));
  const page = await ask(a.port, { cookie });
  assert.equal(page.status, 200);
  assert.ok(page.body.includes(nameOf(rb)), 'its page is the other project\'s');
  assert.equal(tokenOf(page.body), tokenB, 'with its own panel\'s key');
  const st = await stateOf(a.port, cookie);
  assert.equal(st.projects.self, b.port, 'its board');
  assert.equal((await ask(a.port, { pathName: '/api/tickets/1/pack', cookie })).status, 200, 'its review packs');
  assert.equal((await ask(a.port, { pathName: '/api/settings?quick=1', cookie })).status, 200, 'its settings');
  const events = await ask(a.port, { pathName: '/api/events', cookie, firstChunk: true });
  assert.equal(events.status, 200);
  assert.match(events.headers['content-type'], /^text\/event-stream/, 'its live updates');
  // Back to Plan, with its own key: only that project changes.
  const back = await ask(a.port, { method: 'POST', pathName: '/api/tickets/1/draft', origin: originA(), token: tokenB, cookie });
  assert.equal(back.status, 200, back.body);
  assert.match(fs.readFileSync(rb.file, 'utf8'), /^status: draft/m, 'the other project\'s ticket changed');
  assert.match(fs.readFileSync(ra.file, 'utf8'), /^status: ready/m, 'this one\'s didn\'t');
  // Its header's menu switches back.
  const home = await ask(a.port, { method: 'POST', pathName: `/api/projects/${a.port}`, origin: originA(), cookie });
  assert.equal(home.status, 200);
  assert.match(String(home.headers['set-cookie']), new RegExp(`speck-shown-${a.port}=;.*Max-Age=0`));
  assert.ok((await ask(a.port)).body.includes(nameOf(ra)), 'without the cookie, the address shows its own project');
});

test('0516 AC2: through the --url address, where the other panel has no --url of its own', async () => {
  const origin = `https://${URL_HOST}`;
  const cookie = await showB(URL_HOST, origin);
  assert.ok(cookie, 'the menu works there');
  const page = await ask(a.port, { host: URL_HOST, cookie });
  assert.equal(tokenOf(page.body), tokenB);
  assert.equal((await ask(b.port, { host: URL_HOST })).status, 403, 'the other panel doesn\'t serve that address itself');
  const pri = await ask(a.port, { method: 'POST', pathName: '/api/settings/save?', host: URL_HOST, origin, token: tokenB, cookie });
  assert.notEqual(pri.status, 403, `a write through it is the other panel's to answer: ${pri.body}`);
});

test('0516 AC4: a request through a panel needs the other panel\'s own key, and a foreign page can\'t choose a project', async () => {
  const cookie = await showB(`127.0.0.1:${a.port}`, originA());
  const path1 = '/api/tickets/1/ready';
  assert.equal((await ask(a.port, { method: 'POST', pathName: path1, origin: originA(), cookie })).status, 403, 'no key');
  assert.equal((await ask(a.port, { method: 'POST', pathName: path1, origin: originA(), token: tokenA, cookie })).status, 403, 'this panel\'s key, not its');
  assert.equal((await ask(a.port, { method: 'POST', pathName: path1, origin: 'https://evil.example', token: tokenB, cookie })).status, 403, 'another site\'s page');
  assert.equal((await ask(a.port, { method: 'POST', pathName: `/api/projects/${b.port}`, origin: 'https://evil.example' })).status, 403);
  assert.equal((await ask(a.port, { method: 'POST', pathName: `/api/projects/${b.port}` })).status, 403, 'no Origin');
  assert.equal((await ask(a.port, { pathName: `/api/projects/${b.port}` })).status, 405);
  assert.equal((await ask(a.port, { pathName: '/api/state', host: `evil.example:${a.port}`, cookie })).status, 403, 'another Host gets nothing, as before');
});

test('0516 AC4: only a running panel in the menu can be reached: any other port is refused, and nothing reaches it', async () => {
  let reached = 0;
  const other = http.createServer((req, res) => { reached++; res.end('{}'); });
  await new Promise(r => other.listen(0, '127.0.0.1', r));
  try {
    const port = other.address().port;
    const choose = await ask(a.port, { method: 'POST', pathName: `/api/projects/${port}`, origin: originA() });
    assert.equal(choose.status, 404, 'it can\'t be chosen');
    assert.equal(choose.headers['set-cookie'], undefined);
    const cookie = `speck-shown-${a.port}=${port}`; // as if set by hand
    const st = await ask(a.port, { pathName: '/api/state', cookie });
    assert.equal(st.status, 502);
    assert.equal(JSON.parse(st.body).gone, true);
    assert.equal((await ask(a.port, { method: 'POST', pathName: '/api/tickets/1/ready', origin: originA(), token: tokenA, cookie })).status, 502);
    const page = await ask(a.port, { cookie });
    assert.ok(page.body.includes(nameOf(ra)), 'a reload shows the address\'s own project');
    assert.match(String(page.headers['set-cookie']), /Max-Age=0/, 'and forgets the choice');
    assert.equal(reached, 0, 'nothing reached the other port');
  } finally { other.close(); }
});

test('0516 AC4: a request passed on by a panel is never passed on again', async () => {
  const dir = process.env.SPECK_PANELS_DIR;
  const sent = [];
  const fake = { headers: { 'x-speck-via': '4777', cookie: 'speck-shown-4900=4901' }, url: '/api/state', method: 'GET' };
  const pp = panelProjects({ port: 4900, name: 'x', repo: '/x', origins: new Set(), changed: () => {} });
  try { assert.equal(pp.route(fake, { writeHead: (...w) => sent.push(w), end() {} }), false, 'served as its own'); }
  finally { pp.stop(); }
  assert.deepEqual(sent, []);
  assert.equal(fs.existsSync(path.join(dir, '4900.json')), false, 'and its record went as it stopped');
});

test('0516 AC3: a panel that starts joins the menu, and one killed or stopped with Ctrl+C leaves it, within 10 seconds', async () => {
  const listed = async () => ((await stateOf(a.port)).projects?.list || []).map(p => p.port);
  for (const how of ['SIGKILL', 'SIGINT']) {
    const rc = panelRepo({ prefix: 'charlie-' });
    const c = await startPanel(rc.dir, ['--port', String(await freePort())]);
    try {
      assert.ok(await until(async () => (await listed()).includes(c.port)), 'it joins');
      const cookie = `speck-shown-${a.port}=${c.port}`;
      assert.equal(JSON.parse((await ask(a.port, { pathName: '/api/state', cookie })).body).projects.self, c.port);
      // SIGKILL: the server process itself, as its record names it. SIGINT: `speck panel`, as Ctrl+C reaches it.
      const pid = JSON.parse(fs.readFileSync(path.join(process.env.SPECK_PANELS_DIR, `${c.port}.json`), 'utf8')).pid;
      if (how === 'SIGKILL') process.kill(pid, 'SIGKILL'); else c.child.kill('SIGINT');
      assert.ok(await until(async () => !(await listed()).includes(c.port)), `it leaves after ${how}`);
      // The page showing it is told so on its stream, with the panels still running, and its board says so too.
      const events = await ask(a.port, { pathName: '/api/events', cookie, firstChunk: true });
      assert.match(events.body, /^retry: \d+\nevent: gone\ndata: /m);
      const gone = JSON.parse(events.body.match(/^data: (.*)$/m)[1]);
      assert.ok(gone.list.some(p => p.port === a.port) && !gone.list.some(p => p.port === c.port));
      const st = await ask(a.port, { pathName: '/api/state', cookie });
      assert.equal(st.status, 502);
      assert.match(JSON.parse(st.body).error, /stopped/);
    } finally { await stop(c); }
  }
});

test('0516 AC1 self-check: with no home folder to keep the records in, a panel still serves, alone', () => {
  const was = process.env.SPECK_PANELS_DIR;
  process.env.SPECK_PANELS_DIR = '';
  const home = os.homedir;
  os.homedir = () => { throw new Error('no home'); };
  try {
    const pp = panelProjects({ port: 4910, name: 'x', repo: '/x', origins: new Set(), changed: () => {} });
    assert.deepEqual(pp.part(), {});
    pp.stop();
  } finally { os.homedir = home; process.env.SPECK_PANELS_DIR = was; }
});

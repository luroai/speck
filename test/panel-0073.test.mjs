import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, T, fakePage, queueRows, click, exitOf, panelRepo, freePort, startPanel, stop, request, post, tokenOf } from './support/panel.mjs';

// ---------- 0073: stop a build from its open queue row ----------

const state = () => ({
  tickets: [
    T('0001', 'building', { build_running: true, paused: false, started: new Date(Date.now() - 60000).toISOString() }),
    T('0002', 'reviewing', { build_running: true, paused: true, started: new Date(Date.now() - 60000).toISOString() }),
    T('0003', 'building', { build_running: false, paused: false }), // built by hand, with no run record
    T('0004', 'approved', { build_running: true, paused: false }),
    T('0005', 'blocked', { build_running: false, paused: false, blocked_question: 'A or B?' }),
    T('0006', 'building', { build_running: false, paused: false, ...exitOf('Stopped.') }),
    T('0007', 'ready', { build_running: false, paused: false }),
  ],
  ideas: [],
});
// A page whose server answers each stop with `answer(url)`, /api/state with `s`, and whose confirm question gets `yes()`.
function page({ s = state(), answer = () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }), yes = () => true, asked = [] } = {}) {
  return fakePage([], {
    fetch: async (url, opts) => (/\/stop$/.test(url) ? answer(url, opts)
      : { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(s))) }),
    confirm: q => { asked.push(q); return yes(); },
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const stopOf = row => row.children.find(n => n.className === 'stop-build') || null;
const shape = row => row.children.map(n => n.className);
async function opened(p, id) { click(topOf(rowOf(p, id))); await p.settle(); return rowOf(p, id); }

test('0073 AC1: an open running or paused build launched by speck run has a Stop build button among its open details', async () => {
  const p = page();
  await p.settle();
  for (const id of ['0001', '0002']) {
    assert.equal(stopOf(rowOf(p, id)), null, `${id}: none while closed`);
    const row = await opened(p, id);
    const b = stopOf(row);
    assert.ok(b, `${id}: a Stop build button once open`);
    assert.equal(b.textContent, 'Stop build');
    assert.ok(shape(row).indexOf('stop-build') > shape(row).indexOf('full-open'), 'beside Full ticket');
    assert.ok(shape(row).indexOf('stop-build') < shape(row).indexOf('log'), 'above the log');
  }
});

test('0073 AC1: any other ticket has none, open or closed', async () => {
  const p = page();
  await p.settle();
  for (const id of ['0003', '0004', '0005', '0006', '0007']) {
    const row = rowOf(p, id);
    if (!row) continue; // not in the queue at all
    assert.equal(stopOf(row), null, `${id}: closed`);
    assert.equal(stopOf(await opened(p, id)), null, `${id}: open`);
  }
});

test('0073 AC2: clicking asks first; confirming sends the stop with the token and opens or closes nothing', async () => {
  const sent = [], asked = [];
  const p = page({ answer: (url, opts) => { sent.push([url, opts]); return { ok: true, status: 200, json: async () => ({ ok: true }) }; }, asked });
  await p.settle();
  const row = await opened(p, '0001');
  const before = shape(row);
  p.press(stopOf(row));
  await p.settle();
  assert.equal(asked.length, 1, 'asked once');
  assert.match(asked[0], /Stop 0001's build\?/);
  assert.deepEqual(sent.map(([u, o]) => [u, o.method, o.headers['X-Speck-Token']]), [['/api/tickets/0001/stop', 'POST', '{{token}}']]);
  assert.deepEqual(shape(rowOf(p, '0001')), before, 'the row stays open as it was');
});

test('0073 AC2: cancelling the question sends nothing and changes nothing', async () => {
  let n = 0;
  const asked = [];
  const p = page({ answer: () => { n++; return { ok: true, status: 200, json: async () => ({ ok: true }) }; }, yes: () => false, asked });
  await p.settle();
  const row = await opened(p, '0002');
  const before = shape(row), calls = p.calls.length;
  p.press(stopOf(row));
  await p.settle();
  assert.equal(asked.length, 1);
  assert.equal(n, 0, 'no stop sent');
  assert.equal(p.calls.length, calls, 'no request at all');
  assert.deepEqual(shape(rowOf(p, '0002')), before, 'still open');
  assert.equal(stopOf(rowOf(p, '0002')).textContent, 'Stop build');
});

test('0073 AC2: a second click while the first is unanswered sends nothing more', async () => {
  let n = 0, release;
  const p = page({ answer: () => { n++; return new Promise(r => { release = () => r({ ok: true, status: 200, json: async () => ({ ok: true }) }); }); } });
  await p.settle();
  const row = await opened(p, '0001');
  p.press(stopOf(row));
  await p.settle();
  assert.equal(stopOf(rowOf(p, '0001')).disabled, true);
  p.press(stopOf(rowOf(p, '0001')));
  await p.settle();
  assert.equal(n, 1);
  release();
  await p.settle();
  assert.equal(stopOf(rowOf(p, '0001')).disabled, false);
});

test('0073 AC3: a refusal shows its reason under the button until the next click on it', async () => {
  let answer = { ok: false, status: 409, json: async () => ({ error: "0001 has no running or paused build launched by speck run, so there's nothing to stop." }) };
  const p = page({ answer: () => answer });
  await p.settle();
  let row = await opened(p, '0001');
  p.press(stopOf(row));
  await p.settle();
  const reason = r => r.children[r.children.indexOf(stopOf(r)) + 1];
  row = rowOf(p, '0001');
  assert.equal(reason(row).className, 'stop-refused', 'right under the button');
  assert.equal(reason(row).textContent, "0001 has no running or paused build launched by speck run, so there's nothing to stop.");
  p.timers.shift()(); // the next poll: the reason stays
  await p.settle();
  assert.match(reason(rowOf(p, '0001')).textContent, /nothing to stop/);
  answer = { ok: false, status: 403, json: async () => { throw new Error('not JSON'); } };
  p.press(stopOf(rowOf(p, '0001')));
  await p.settle();
  assert.equal(reason(rowOf(p, '0001')).textContent, 'The server refused (403).', 'the next click replaces it');
  answer = { ok: true, status: 200, json: async () => ({ ok: true }) };
  p.press(stopOf(rowOf(p, '0001')));
  await p.settle();
  assert.ok(!shape(rowOf(p, '0001')).includes('stop-refused'), 'a click that works clears it');
});

test('0073 AC3: a refusal\'s reason goes once the build has ended, so a later build of the ticket doesn\'t show it', async () => {
  const s = state();
  const p = page({ s, answer: () => ({ ok: false, status: 409, json: async () => ({ error: 'Refused.' }) }) });
  await p.settle();
  p.press(stopOf(await opened(p, '0001')));
  await p.settle();
  assert.ok(shape(rowOf(p, '0001')).includes('stop-refused'));
  const poll = () => { for (const f of p.timers.splice(0)) f(); }; // the state poll, and the open log's
  s.tickets[0].build_running = false; // the build ended
  poll();
  await p.settle();
  s.tickets[0].build_running = true; // built again
  poll();
  await p.settle();
  assert.ok(stopOf(rowOf(p, '0001')), 'the button is back');
  assert.ok(!shape(rowOf(p, '0001')).includes('stop-refused'), 'without the old reason');
});

test('0073 AC3: no answer from the server says so under the button', async () => {
  const p = page({ answer: () => { throw new Error('offline'); } });
  await p.settle();
  p.press(stopOf(await opened(p, '0002')));
  await p.settle();
  const row = rowOf(p, '0002');
  assert.match(row.children[row.children.indexOf(stopOf(row)) + 1].textContent, /Couldn't reach the panel server/);
});

// ---------- the server ----------

const runs = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
const alive = pid => { const s = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim(); return s !== '' && !s.startsWith('Z'); };
const cli = (dir, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// A panel repo whose 0001 is building, committed, with a stand-in build launched as speck run does (leading its own
// process group, with a child of its own) and its run record; 0002 is building by hand, with no record.
async function buildPanel() {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: building'));
  r.write('0002-two.md', `id: "0002"\ntitle: Two\nstatus: building\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex`);
  r.g('add', '-A'); r.g('commit', '-qm', 'building');
  const build = spawn(process.execPath, ['-e', `const c = require('child_process').spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' }); console.log(c.pid); setInterval(() => {}, 1000)`], { detached: true, stdio: ['ignore', 'pipe', 'ignore'] });
  const child = await new Promise(res => build.stdout.once('data', d => res(Number(String(d).trim()))));
  build.unref();
  fs.mkdirSync(runs(r.dir, ''), { recursive: true });
  fs.writeFileSync(runs(r.dir, '0001.json'), JSON.stringify({ session: 's-0073', pid: build.pid, cwd: r.dir }));
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  const token = tokenOf((await request(port)).body);
  const done = async () => { for (const q of [build.pid, child]) try { process.kill(q, 'SIGKILL'); } catch {} await stop(p); };
  return { r, port, token, pid: build.pid, child, done };
}

test('0073 AC2: the stop request stops the build exactly as speck stop does', async () => {
  const b = await buildPanel();
  try {
    const head = b.r.g('rev-parse', 'HEAD');
    const res = await post(b.port, '/api/tickets/0001/stop', { token: b.token });
    assert.equal(res.status, 200, res.body);
    assert.match(JSON.parse(res.body).message, /0001[^\n]*stopped/);
    assert.ok(!alive(b.pid), 'the build is no longer running');
    assert.ok(!alive(b.child), 'nor is the process it started');
    const mark = JSON.parse(fs.readFileSync(runs(b.r.dir, '0001.stopped'), 'utf8'));
    assert.equal(mark.session, 's-0073');
    assert.equal(mark.pid, b.pid);
    const ticket = fs.readFileSync(b.r.file, 'utf8');
    assert.match(ticket, /^status: blocked/m);
    assert.match(ticket, new RegExp(`## Blocked question\\n(?:<!--[\\s\\S]*?-->\\n)?Stopped by you on ${today()}\\.`));
    assert.equal(b.r.g('rev-parse', 'HEAD~1'), head, 'one commit on top');
    assert.equal(b.r.g('log', '-1', '--format=%s'), 'speck(0001): stopped');
    // Stopped from the panel, the CLI has nothing left to stop.
    assert.match(cli(b.r.dir, 'stop', '0001').stderr, /nothing to stop/);
  } finally { await b.done(); }
});

test('0073 AC2: a paused build stops from the panel too', async () => {
  const b = await buildPanel();
  try {
    assert.equal(cli(b.r.dir, 'pause', '0001').status, 0);
    const res = await post(b.port, '/api/tickets/0001/stop', { token: b.token });
    assert.equal(res.status, 200, res.body);
    assert.ok(!alive(b.pid) && !alive(b.child));
    assert.ok(!fs.existsSync(runs(b.r.dir, '0001.paused')), 'no longer marked paused');
  } finally { await b.done(); }
});

test('0073 AC3: a refusal gives the same reason as speck stop and changes nothing', async () => {
  const b = await buildPanel();
  try {
    const head = b.r.g('rev-parse', 'HEAD');
    for (const id of ['0002', '0099']) {
      const res = await post(b.port, `/api/tickets/${id}/stop`, { token: b.token });
      assert.ok(res.status >= 400 && res.status < 500, `${id}: ${res.status}`);
      assert.equal(JSON.parse(res.body).error, cli(b.r.dir, 'stop', id).stderr.trim(), id);
    }
    assert.ok(alive(b.pid), 'the running build is untouched');
    assert.equal(b.r.g('rev-parse', 'HEAD'), head, 'nothing committed');
    assert.ok(!fs.existsSync(runs(b.r.dir, '0002.stopped')));
  } finally { await b.done(); }
});

test('0073 AC3: stop needs the panel page\'s Origin and token, or gets 403 and changes nothing', async () => {
  const b = await buildPanel();
  try {
    const head = b.r.g('rev-parse', 'HEAD'), ticket = fs.readFileSync(b.r.file, 'utf8');
    for (const opts of [{}, { token: 'nope' }, { token: b.token, origin: 'http://evil.example' }, { token: b.token, origin: null }]) {
      const res = await post(b.port, '/api/tickets/0001/stop', opts);
      assert.equal(res.status, 403, JSON.stringify(opts));
    }
    assert.ok(alive(b.pid) && alive(b.child), 'still running');
    assert.ok(!fs.existsSync(runs(b.r.dir, '0001.stopped')), 'no stop mark');
    assert.equal(fs.readFileSync(b.r.file, 'utf8'), ticket, 'ticket unchanged');
    assert.equal(b.r.g('rev-parse', 'HEAD'), head, 'nothing committed');
    const ok = await post(b.port, '/api/tickets/0001/stop', { token: b.token, origin: `http://localhost:${b.port}`, host: `localhost:${b.port}` });
    assert.equal(ok.status, 200, 'localhost works too, as for Set ready');
  } finally { await b.done(); }
});

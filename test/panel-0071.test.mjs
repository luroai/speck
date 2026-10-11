import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, T, fakePage, queueRows, click, exitOf, nowStep, panelRepo, freePort, startPanel, stop, request, post, tokenOf } from './support/panel.mjs';

// ---------- 0071: toggle a build between paused and playing from its queue row ----------

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
// A page whose server answers each pause or play with `answer(url)`, and /api/state with `s`.
function page(s = state(), answer = () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })) {
  return fakePage([], {
    fetch: async (url, opts) => (/\/(pause|play)$/.test(url) ? answer(url, opts)
      : { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(s))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const iconOf = row => topOf(row).children[0];
const toggle = row => iconOf(row).children.find(n => n.tagName === 'button') || null;
const shape = row => row.children.map(n => n.className);

test('0071 AC1: a running build shows a pause icon, a paused one a play icon, each with its hover text; others show none', async () => {
  const p = page();
  await p.settle();
  const a = toggle(rowOf(p, '0001')), b = toggle(rowOf(p, '0002'));
  assert.ok(a && /\bpause\b/.test(a.className), 'running: a pause icon');
  assert.equal(a.title, 'Pause build');
  assert.ok(b && /\bplay\b/.test(b.className), 'paused: a play icon');
  assert.equal(b.title, 'Play build');
  assert.equal(iconOf(rowOf(p, '0001')).className, 'rank', 'in the space on the left of the top row');
  for (const id of ['0003', '0004', '0005', '0006', '0007']) {
    assert.equal(toggle(rowOf(p, id)), null, `${id}: no icon`);
    assert.equal(iconOf(rowOf(p, id)).children.length, 0, `${id}: the space stays empty`);
  }
});

test('0071 AC2: clicking the icons sends pause and play with the token, and opens or closes nothing', async () => {
  const sent = [];
  const p = page(state(), (url, opts) => { sent.push([url, opts]); return { ok: true, status: 200, json: async () => ({ ok: true }) }; });
  await p.settle();
  const before = shape(rowOf(p, '0001'));
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  p.press(toggle(rowOf(p, '0002')));
  await p.settle();
  assert.deepEqual(sent.map(([u, o]) => [u, o.method, o.headers['X-Speck-Token']]), [['/api/tickets/0001/pause', 'POST', '{{token}}'], ['/api/tickets/0002/play', 'POST', '{{token}}']]);
  assert.deepEqual(shape(rowOf(p, '0001')), before, 'the row stays closed');
  assert.deepEqual(shape(rowOf(p, '0002')), before, 'the row stays closed');
  assert.ok(!p.calls.some(c => /\/log$/.test(c.url)), 'no log asked for: nothing opened');
});

test('0071 AC2: a second click while the first is unanswered sends nothing more', async () => {
  let n = 0, release;
  const p = page(state(), () => { n++; return new Promise(r => { release = () => r({ ok: true, status: 200, json: async () => ({ ok: true }) }); }); });
  await p.settle();
  p.press(toggle(rowOf(p, '0001')));
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  assert.equal(n, 1);
  release();
  await p.settle();
  assert.equal(toggle(rowOf(p, '0001')).title, 'Play build');
});

test('0071 AC2: an open row stays open after a click on its icon', async () => {
  const p = page();
  await p.settle();
  click(topOf(rowOf(p, '0001')));
  await p.settle();
  const before = shape(rowOf(p, '0001'));
  assert.ok(before.includes('log'));
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  assert.deepEqual(shape(rowOf(p, '0001')), before);
});

test('0071 AC2: once the server has paused it, the icon turns to play; once played, back to pause', async () => {
  const p = page();
  await p.settle();
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  assert.equal(toggle(rowOf(p, '0001')).title, 'Play build');
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  assert.equal(toggle(rowOf(p, '0001')).title, 'Pause build');
});

test('0071 AC3: a refusal shows its reason under the top row until the next click on the icon', async () => {
  let answer = { ok: false, status: 409, json: async () => ({ error: "0001 has no running build launched by speck run, so there's nothing to pause." }) };
  const p = page(state(), () => answer);
  await p.settle();
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  let row = rowOf(p, '0001');
  assert.equal(row.children[1].className, 'stages', 'under the progress bar (0081)');
  assert.equal(row.children[2].textContent, "0001 has no running build launched by speck run, so there's nothing to pause.");
  assert.equal(toggle(row).title, 'Pause build', 'still shown as running');
  p.timers.shift()(); // the next poll: the reason stays
  await p.settle();
  row = rowOf(p, '0001');
  assert.match(row.children[2].textContent, /nothing to pause/);
  click(topOf(row)); // opening the row leaves it too
  await p.settle();
  assert.match(rowOf(p, '0001').children[2].textContent, /nothing to pause/);
  answer = { ok: false, status: 403, json: async () => { throw new Error('not JSON'); } };
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  assert.equal(rowOf(p, '0001').children[2].textContent, 'The server refused (403).', 'the next click replaces it');
  answer = { ok: true, status: 200, json: async () => ({ ok: true }) };
  p.press(toggle(rowOf(p, '0001')));
  await p.settle();
  assert.ok(!rowOf(p, '0001').children.some(n => n.className === 'toggle-refused'), 'a click that works clears it');
});

test('0071 AC3: no answer from the server says so under the top row', async () => {
  const p = page(state(), () => { throw new Error('offline'); });
  await p.settle();
  p.press(toggle(rowOf(p, '0002')));
  await p.settle();
  assert.match(rowOf(p, '0002').children[2].textContent, /Couldn't reach the panel server/);
});

test('0071 AC4: a paused build has no moving dot and says "Paused" beside its counter', async () => {
  const p = page();
  await p.settle();
  const paused = rowOf(p, '0002'), running = rowOf(p, '0001');
  assert.ok(!/\bmoving\b/.test(nowStep(paused).className), 'paused: the dot stops');
  assert.ok(/\bmoving\b/.test(nowStep(running).className), 'running: the dot moves');
  const sub = topOf(paused).children.find(n => n.className === 'sub');
  assert.match(sub.textContent, /^Paused · 01:0\d$/);
  assert.match(topOf(running).children.find(n => n.className === 'sub').textContent, /^01:0\d$/);
  // The counter's own timer keeps "Paused" in place.
  for (const { fn } of p.intervals.values()) fn();
  assert.match(sub.textContent, /^Paused · 01:0\d$/);
});

test('0071 AC4: played again, the dot moves and "Paused" goes', async () => {
  const s = state();
  const p = page(s);
  await p.settle();
  s.tickets[1].paused = false;
  p.timers.shift()();
  await p.settle();
  const row = rowOf(p, '0002');
  assert.ok(/\bmoving\b/.test(nowStep(row).className));
  assert.match(topOf(row).children.find(n => n.className === 'sub').textContent, /^01:0\d$/);
});

// ---------- the server ----------

const runs = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
const psState = pid => spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim();
const json = dir => JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: dir, encoding: 'utf8', env }).stdout);
const of = (dir, id) => json(dir).tickets.find(t => t.id === id);

// A panel repo whose 0001 is building, with a stand-in build launched as speck run does (leading its own process group)
// and its run record; 0002 is building by hand, with no record.
async function buildPanel() {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: building'));
  r.write('0002-two.md', `id: "0002"\ntitle: Two\nstatus: building\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex`);
  const build = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
  build.unref();
  fs.mkdirSync(runs(r.dir, ''), { recursive: true });
  fs.writeFileSync(runs(r.dir, '0001.json'), JSON.stringify({ session: 's-0071', pid: build.pid, cwd: r.dir }));
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = p;
  const token = tokenOf((await request(port)).body);
  const done = async () => { try { process.kill(build.pid, 'SIGKILL'); } catch {} await stop(p); };
  return { r, port, token, pid: build.pid, done };
}
const cli = (dir, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });

test('0071 AC1: speck status --json says which builds speck run launched are running', async () => {
  const b = await buildPanel();
  try {
    assert.equal(of(b.r.dir, '0001').build_running, true);
    assert.equal(of(b.r.dir, '0002').build_running, false, 'no run record');
    fs.writeFileSync(runs(b.r.dir, '0002.json'), JSON.stringify({ session: 's-2', pid: b.pid, cwd: b.r.dir, exited: '2026-10-09T10:00:00Z', exit_code: 0 }));
    assert.equal(of(b.r.dir, '0002').build_running, false, 'exited');
  } finally { await b.done(); }
});

test('0071 AC2: the pause and play requests pause and play the build as speck pause and speck play do', async () => {
  const b = await buildPanel();
  try {
    const paused = await post(b.port, '/api/tickets/0001/pause', { token: b.token });
    assert.equal(paused.status, 200, paused.body);
    assert.match(psState(b.pid), /T/, 'the build is stopped');
    const mark = JSON.parse(fs.readFileSync(runs(b.r.dir, '0001.paused'), 'utf8'));
    assert.equal(mark.session, 's-0071');
    assert.equal(mark.pid, b.pid);
    assert.equal(of(b.r.dir, '0001').paused, true);
    assert.equal(of(b.r.dir, '0001').status, 'building', 'the status stays');
    // Paused from the panel, the CLI sees it paused, and plays it.
    assert.match(cli(b.r.dir, 'pause', '0001').stderr, /already paused/);
    const played = await post(b.port, '/api/tickets/0001/play', { token: b.token });
    assert.equal(played.status, 200, played.body);
    assert.doesNotMatch(psState(b.pid), /T/, 'the build carries on');
    assert.ok(!fs.existsSync(runs(b.r.dir, '0001.paused')));
    assert.equal(of(b.r.dir, '0001').paused, false);
    // Paused from the CLI, the panel plays it.
    assert.equal(cli(b.r.dir, 'pause', '0001').status, 0);
    assert.equal((await post(b.port, '/api/tickets/0001/play', { token: b.token })).status, 200);
    assert.doesNotMatch(psState(b.pid), /T/);
  } finally { await b.done(); }
});

test('0071 AC2: a refusal gives the same reason as the CLI and changes nothing', async () => {
  const b = await buildPanel();
  try {
    for (const [what, id] of [['pause', '0002'], ['play', '0002'], ['play', '0001'], ['pause', '0099']]) {
      const res = await post(b.port, `/api/tickets/${id}/${what}`, { token: b.token });
      assert.ok(res.status >= 400 && res.status < 500, `${what} ${id}: ${res.status}`);
      assert.equal(JSON.parse(res.body).error, cli(b.r.dir, what, id).stderr.trim(), `${what} ${id}`);
    }
    assert.doesNotMatch(psState(b.pid), /T/);
    assert.ok(!fs.existsSync(runs(b.r.dir, '0001.paused')));
  } finally { await b.done(); }
});

test('0071 AC3: pause and play need the panel page\'s Origin and token, or get 403 and change nothing', async () => {
  const b = await buildPanel();
  try {
    for (const what of ['pause', 'play']) {
      if (what === 'play') assert.equal(cli(b.r.dir, 'pause', '0001').status, 0);
      const before = psState(b.pid);
      for (const opts of [{}, { token: 'nope' }, { token: b.token, origin: 'http://evil.example' }, { token: b.token, origin: null }]) {
        const res = await post(b.port, `/api/tickets/0001/${what}`, opts);
        assert.equal(res.status, 403, `${what} ${JSON.stringify(opts)}`);
      }
      assert.equal(psState(b.pid), before, `${what}: unchanged`);
      assert.equal(fs.existsSync(runs(b.r.dir, '0001.paused')), what === 'play', `${what}: mark unchanged`);
    }
    const ok = await post(b.port, '/api/tickets/0001/play', { token: b.token, origin: `http://localhost:${b.port}`, host: `localhost:${b.port}` });
    assert.equal(ok.status, 200, 'localhost works too, as for Set ready');
  } finally { await b.done(); }
});

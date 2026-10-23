import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fakePage, page, T, click, panelRepo, startPanel, stop, request, cliCopy, freePort } from './support/panel.mjs';
import { runRepo, startRun, stopRun, until, killAll, env as runEnv, CLI } from './support/run.mjs';
import { shipRepo } from './support/ship.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { foremanView, foremanLines, readForeman, saveForeman } from '../scripts/foreman.mjs';

// ---------- 0285: show the Foreman's status in the panel's header ----------

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] }, ...o });
const view = (o, tickets = [], run = ON) => foremanView({ run, record: rec(o), tickets });
const state = (foreman, o = {}) => ({ tickets: [], ideas: [], resume_command: '', run: ON, foreman, ...o });
const header = p => p.byId('run');
const label = p => header(p).attrs['aria-label'].replace(/^The Foreman: /, '').replace(/, fixing on$/, ''); // 0413: the word on speck's screen, in its name
const detail = p => p.byId('foreman');

test('0285 AC1: the status is one or two words: Off, Idle, Building <n>, Shipping <id>, Waiting with its reason, or Needs you <n>', () => {
  assert.equal(foremanView({ run: { on: false, pid: null }, record: rec({ building: ['0001'] }), tickets: [] }).word, 'Off');
  assert.equal(view({}).word, 'Idle');
  assert.equal(view({ building: ['0001', '0002'] }).word, 'Building 2');
  assert.equal(view({ building: ['0001'], ship: { running: '0003', hold: null, refused: [] } }).word, 'Shipping 0003');
  assert.equal(view({ ship: { running: null, hold: { message: 'on hold until main has a new commit' }, refused: [] } }).word, 'Waiting: on hold');
  assert.equal(view({ switching: { builds: [], ship: null } }).word, 'Waiting: new code');
  assert.equal(view({ ready: [{ id: '0004', kind: 'after', why: 'waiting for 0003' }] }, [T('0004', 'ready')]).word, 'Waiting: other tickets');
  assert.equal(view({ ship: { running: null, hold: null, refused: [{ id: '0005', message: 'waiting for a new commit' }] } }).word, 'Waiting: new commit');
  assert.equal(view({ building: ['0001'] }, [T('0006', 'blocked'), T('0007', 'blocked')]).word, 'Needs you 2');
  for (const [o, tone] of [[{}, 'idle'], [{ building: ['0001'] }, 'ok'], [{ switching: {} }, 'warn']]) assert.equal(view(o).tone, tone);
  assert.equal(view({}, [T('0006', 'blocked')]).tone, 'bad');
});

test('0285 AC1: a record left by an earlier speck run, or none, isn\'t read as this one\'s', () => {
  assert.equal(foremanView({ run: ON, record: rec({ lock: 1, building: ['0001'] }), tickets: [] }).word, 'Idle');
  assert.equal(foremanView({ run: ON, record: null, tickets: [T('0001', 'ready')] }).ready[0].why, 'speck run hasn\'t checked it yet');
});

test('0285 AC1: the header shows the Foreman\'s status and colour in place of the speck run switch', async () => {
  const p = fakePage([state(view({ building: ['0001', '0002'] }))]);
  await p.settle();
  assert.equal(label(p), 'Building 2'); // 0413: the word alone, on speck's screen, whose frame shows only "Needs you" in colour
  assert.equal(p.byId('bezel').className, 'bezel');
  assert.doesNotMatch(header(p).attrs['aria-label'], /Auto-build/);
  click(header(p));
  await p.settle();
  assert.ok(!p.calls.some(c => /\/api\/run\//.test(c.url)), 'pressing it doesn\'t turn speck run on or off');
  assert.match(page().match(/<header>([\s\S]*?)<\/header>/)[1], /<button class="glass" id="run" type="button" aria-label="The Foreman" aria-expanded="false" aria-controls="foreman"/);
});

test('0285 AC2: pressing the status opens its detail: ready tickets with why, shipping\'s state and blocked tickets with their questions', async () => {
  const f = view({ building: ['0001'], ready: [{ id: '0004', kind: 'after', why: 'waiting for 0003' }, { id: '0005', kind: 'slots', why: 'all 2 build slots in use' }],
    ship: { running: null, hold: { message: 'on hold until main has a new commit: 0002\'s ship found main\'s own tests failing.' }, refused: [{ id: '0008', message: 'waiting for a new commit on main or its branch. Its last try: tests failed' }] } },
  [T('0001', 'ready'), T('0004', 'ready'), T('0005', 'ready'), T('0006', 'blocked', { blocked_question: 'Which one?' })]);
  const p = fakePage([state(f)]);
  await p.settle();
  assert.equal(detail(p).hidden, true);
  click(header(p));
  await p.settle();
  assert.equal(detail(p).hidden, false);
  assert.equal(header(p).attrs['aria-expanded'], 'true');
  const t = detail(p).textContent;
  assert.match(t, /0004 waiting for 0003/);
  assert.match(t, /0005 all 2 build slots in use/);
  assert.doesNotMatch(t, /0001 speck run/, 'a ticket building isn\'t listed as waiting');
  assert.match(t, /Shipping is on hold until main has a new commit/);
  assert.match(t, /0008 waiting for a new commit on main or its branch\. Its last try: tests failed/);
  assert.match(t, /Blocked0006 Ticket 0006Which one\?/);
  click(header(p));
  await p.settle();
  assert.equal(detail(p).hidden, true, 'pressing it again closes it');
});

test('0285 AC2: with speck run off, each ready ticket says speck run is off', async () => {
  const f = foremanView({ run: { on: false, pid: null }, record: null, tickets: [T('0004', 'ready')] });
  assert.deepEqual(f.ready, [{ id: '0004', why: 'speck run is off' }]);
  const p = fakePage([state(f, { run: undefined })]);
  await p.settle();
  click(header(p));
  await p.settle();
  assert.match(detail(p).textContent, /0004 speck run is off/);
  assert.match(detail(p).textContent, /speck run is off, so nothing ships by itself/);
});

test('0285 AC2: the ship queue records its hold and each refusal waiting for a new commit, with its message', () => {
  const r = shipRepo();
  const launches = [];
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: () => {}, launch: (repo, id, log, done) => launches.push({ id, done }) });
  const A = (id, o = {}) => ({ id, status: 'approved', auto_ship: true, type: '', approved: '2026-10-15T10:00:00.000Z', build_running: false, ...o });
  q.check([A('0001')]);
  assert.deepEqual(q.state([A('0001')]), { running: '0001', hold: null, refused: [], waiting: [] });
  fs.writeFileSync(path.join(r.dir, 'ship.log'), '');
  launches[0].done(1);
  q.check([A('0001')]);
  const s = q.state([A('0001')]);
  assert.equal(s.running, null);
  assert.equal(s.refused.length, 1);
  assert.match(s.refused[0].message, /^waiting for a new commit on main or its branch\. Its last try: /);
  q.check([A('0002')]);
  launches[1].done(14);
  assert.match(q.state([A('0003')]).hold.message, /^on hold until main has a new commit: 0002's ship found main's own tests failing\./);
});

test('0285 AC1, AC2: a ship started outside speck run\'s queue, from the panel\'s Ship button or speck ship, shows as shipping', async () => {
  const r = shipRepo();
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: () => {}, launch: () => {} });
  // A live `speck ship 0002` process, and its ship record naming it, as a ship started outside speck run leaves them.
  const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', 'speck', 'ship', '0002'], { detached: true, stdio: 'ignore' });
  p.unref();
  try {
    const runs = path.join(r.dir, 'speck', '.cache', 'runs');
    fs.mkdirSync(runs, { recursive: true });
    fs.writeFileSync(path.join(runs, '0002.ship.json'), JSON.stringify({ pid: p.pid, started: new Date().toISOString(), auto: false }));
    const s = q.state([]);
    assert.equal(s.running, '0002');
    const v = view({ ship: s });
    assert.equal(v.word, 'Shipping 0002');
    const page = fakePage([state(v)]);
    await page.settle();
    click(header(page));
    await page.settle();
    assert.match(detail(page).textContent, /0002 is shipping\./);
  } finally { killAll([p.pid]); }
});

// 0396: the Foreman group shows once the settings have loaded.
test('0285 AC3: Settings has a Foreman group, first, with the speck run switch, which turns speck run on and off as the header\'s did', async () => {
  const p = fakePage([state(view({}), { run: undefined }), { groups: [{ title: 'Foreman', settings: [] }] }, { ok: true, run: { on: true, pid: 7 } }, { ok: true, run: { on: false, pid: null } }]);
  await p.settle();
  click(p.byId('settings-open'));
  await p.settle();
  const groups = p.byId('settings').children.filter(n => n.className === 'sgroup');
  assert.equal(groups[0].textContent.startsWith('Foreman'), true, 'the Foreman group comes first');
  // 0396: the switch is Auto-build's, in the box above the groups.
  const box = p.byId('settings').children.find(n => n.className === 'switches');
  assert.ok(p.byId('settings').children.indexOf(box) < p.byId('settings').children.indexOf(groups[0]), 'Auto-build above it');
  const sw = p.all(box).find(n => n.id === 'run-switch');
  assert.equal(sw.textContent, 'Off');
  assert.equal(sw.attrs['aria-checked'], 'false');
  assert.equal(sw.title, 'Start Auto-build: build ready tickets');
  click(sw);
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.equal(sw.textContent, 'On');
  assert.equal(sw.title, 'Pause Auto-build: ready tickets wait');
  click(sw);
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(sw.textContent, 'Off');
});

test('0285 AC3: a refused switch shows speck run\'s own message, as before', async () => {
  const p = fakePage([state(view({}), { run: undefined }), { groups: [] }, { status: 409, body: { error: 'speck run won\'t start: no build_command.' } }]);
  await p.settle();
  click(p.byId('settings-open'));
  await p.settle();
  click(p.all(p.byId('settings')).find(n => n.id === 'run-switch'));
  await p.settle();
  assert.equal(p.byId('run-error').hidden, false);
  assert.equal(p.byId('run-error').textContent, 'speck run won\'t start: no build_command.');
});

test('0285 AC4: when the server\'s code is newer than the page\'s, the status says so and offers to reload the page', async () => {
  let reloaded = 0;
  const p = fakePage([state(view({}), { page: 'newer' })], { location: { reload: () => { reloaded++; } } });
  await p.settle();
  assert.equal(label(p), 'Reload page');
  click(header(p));
  await p.settle();
  assert.match(detail(p).textContent, /The panel is running newer code than this page shows\./);
  click(p.all(detail(p)).find(n => n.id === 'foreman-reload'));
  assert.equal(reloaded, 1);
});

test('0285 AC4: a page sent with the code the server runs isn\'t out of date', async () => {
  const p = fakePage([state(view({}), { page: '{{page}}' })]); // the fake page isn't filled in, so its stamp is the placeholder
  await p.settle();
  assert.equal(label(p), 'Idle');
});

test('0285 AC4: the panel stamps the page it sends, and /api/state gives the stamp of its code now', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    const sent = (await request(p.port, { pathName: '/' })).body.match(/const PAGE = '([0-9a-f]{16})';/);
    assert.ok(sent, 'the page has a stamp');
    const now = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).page;
    assert.equal(await now(), sent[1]);
    fs.appendFileSync(copy.page, '\n<!-- changed -->\n');
    assert.notEqual(await now(), sent[1]);
  } finally { await stop(p); }
});

test('0285 AC5: speck run records why each ready ticket isn\'t building, which the Foreman shows as it is', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', { after: '["0009"]' }], ['0003', {}]], max: 1 });
  const run = startRun(r.dir, { FAKE_MS: '60000' });
  const file = path.join(r.dir, 'speck', '.cache', 'runs', 'run.foreman.json');
  try {
    assert.ok(await until(() => { const f = readForeman(path.dirname(file)); return f && f.building.length === 1 && f.ready.length === 2; }), `a record: ${run.out()}`);
    const f = readForeman(path.dirname(file));
    assert.equal(f.lock, run.child.pid);
    assert.deepEqual(f.building, ['0001']);
    assert.deepEqual(f.ready, [{ id: '0002', kind: 'after', why: 'waiting for 0009' }, { id: '0003', kind: 'slots', why: 'all 1 build slot in use' }]);
    const v = foremanView({ run: { on: true, pid: run.child.pid }, record: f, tickets: [T('0001', 'ready'), T('0002', 'ready'), T('0003', 'ready')] });
    assert.equal(v.word, 'Building 1');
    assert.deepEqual(v.ready, [{ id: '0002', why: 'waiting for 0009' }, { id: '0003', why: 'all 1 build slot in use' }]);
  } finally {
    await stopRun(run);
    killAll(r.calls().map(c => c.pid));
  }
});

test('0285 AC5: speck status shows the same as the panel, from speck run\'s record', () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', { status: 'blocked' }]] });
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, 'run.lock'), String(process.pid)); // this process, alive, holds the lock
  const record = rec({ lock: process.pid, ready: [{ id: '0001', kind: 'slots', why: 'all 2 build slots in use' }],
    ship: { running: null, hold: { message: 'on hold until main has a new commit: x.' }, refused: [{ id: '0005', message: 'waiting for a new commit' }] } });
  saveForeman(runs, record);
  const out = spawnSync(process.execPath, [CLI, 'status'], { cwd: r.dir, encoding: 'utf8', env: runEnv }).stdout;
  const v = foremanView({ run: { on: true, pid: process.pid }, record, tickets: [T('0001', 'ready'), T('0002', 'blocked')] });
  assert.equal(v.word, 'Needs you 1');
  for (const line of foremanLines(v)) assert.ok(out.includes(line), `speck status has "${line}":\n${out}`);
  assert.match(out, /^FOREMAN: Needs you 1\n {2}Shipping is on hold until main.*\n {2}0001 ready, not building: all 2 build slots in use\n/m); // 0299: the hold once, first
});

test('0285 AC5: the record is saved only when it changes, and isn\'t taken for a build\'s run record', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-foreman-'));
  saveForeman(runs, rec());
  const file = path.join(runs, 'run.foreman.json'), old = Math.floor(Date.now() / 1000) - 60;
  fs.utimesSync(file, old, old);
  saveForeman(runs, rec());
  assert.equal(Math.round(fs.statSync(file).mtimeMs / 1000), old, 'unchanged, so not written again');
  saveForeman(runs, rec({ building: ['0001'] }));
  assert.deepEqual(readForeman(runs).building, ['0001']);
  assert.doesNotMatch('run.foreman.json', /^[^.]+\.json$/, 'not a name speck run adopts a build from');
  assert.deepEqual(fs.readdirSync(runs), ['run.foreman.json'], 'no temporary file left');
});

test('0285 AC5: the brief names the file speck run records the Foreman in', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.ok(brief.includes('speck/.cache/runs/run.foreman.json'));
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-foreman-'));
  saveForeman(runs, rec());
  assert.deepEqual(fs.readdirSync(runs), ['run.foreman.json']);
});

// 0658: with watch fix or decide, speck run raises and readies a fix ticket itself when the full suite fails on the base
// branch, and the failure waits on that ticket rather than under Needs you.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { T, boardPage, gitEnv } from './support/panel.mjs';
import { fullSuiteQueue, fullDir } from '../scripts/full-suite.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { loadConfig, listTickets, parseTicket } from '../scripts/core.mjs';

Object.assign(process.env, gitEnv); // speck new and speck set commit in the test repo
const TESTS = ['test/widgets.test.mjs', 'test/gadgets.test.mjs'];

function repo(watch = 'fix') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0658-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' }).stdout.trim();
  g('init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\n${watch ? `watch: ${watch}\n` : ''}commands:\n  test: "true"\n  test_full: "exit 1"\n`);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  const said = [];
  const q = fullSuiteQueue({ repo: dir, readConfig: () => loadConfig(dir), say: s => said.push(s), launch: () => null });
  const fail = (commit = g('rev-parse', 'HEAD'), tests = TESTS, status = 1) => fs.writeFileSync(path.join(fullDir(dir), 'latest.json'), JSON.stringify({ cmd: 'exit 1', commit, status, tests, at: '2026-11-11T09:30:00.000Z' }));
  const pass = () => fs.writeFileSync(path.join(fullDir(dir), 'latest.json'), JSON.stringify({ cmd: 'exit 1', commit: g('rev-parse', 'HEAD'), status: 0, tests: [], at: '2026-11-11T10:30:00.000Z' }));
  const fixes = () => listTickets(dir).filter(t => t.fm.type === 'fix');
  return { dir, g, q, said, fail, pass, fixes };
}

// A ticket committed on main, as the user or a build would have it.
function ticket(r, id, fields, body) {
  const file = path.join(r.dir, 'speck', 'tickets', `${id}-a-ticket.md`);
  fs.writeFileSync(file, `---\nid: "${id}"\ntitle: "A ticket"\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${body}\n`);
  r.g('add', '-A'); r.g('commit', '-qm', `ticket ${id}`);
  return file;
}
const setStatus = (r, t, status) => {
  const to = ['done', 'cancelled'].includes(status) ? path.join(r.dir, 'speck', 'tickets', 'done', path.basename(t.file)) : t.file;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, t.raw.replace(/^status: \S+/m, `status: ${status}`));
  if (to !== t.file) fs.rmSync(t.file);
  r.g('add', '-A'); r.g('commit', '-qm', `${status}`);
};

// ---------- AC1: speck makes, readies and commits one fix ticket ----------

test('0658 AC1: with watch fix, a failing full run gets one priority-0 fix ticket naming the failing tests and the commit, set ready and committed', () => {
  const r = repo('fix'), head = r.g('rev-parse', 'HEAD');
  r.fail();
  r.q.check();
  const [t, ...more] = r.fixes();
  assert.ok(t, 'a fix ticket');
  assert.equal(more.length, 0);
  assert.equal(t.fm.status, 'ready');
  assert.equal(String(t.fm.priority), '0');
  for (const n of TESTS) assert.ok(t.raw.includes(n), `names ${n}`);
  assert.ok(t.raw.includes(head.slice(0, 7)), 'names the commit');
  assert.equal(r.g('status', '--porcelain', '--', 'speck/tickets'), '', 'committed');
  assert.match(r.g('log', '-1', '--format=%s'), /\): ready$/);
  assert.equal(r.q.view().full.fixing, String(t.fm.id).padStart(4, '0'));
  assert.ok(r.said.some(s => s.includes(`fix ticket ${String(t.fm.id).padStart(4, '0')}`) && /set it ready/.test(s)), 'says so in the log');
  r.q.check(); r.q.check();
  assert.equal(r.fixes().length, 1, 'only one, however many checks');
});

test('0658 AC1: with watch decide too, and an open fix ticket that names the failing tests already is used rather than another made', () => {
  const r = repo('decide');
  r.fail();
  r.q.check();
  assert.equal(r.fixes().length, 1);

  const s = repo('fix');
  ticket(s, '0001', { status: 'building', priority: 0, type: 'fix', size: 'S', risk: 'low' }, `## Problem\n${TESTS[0]} fails.\n`);
  s.fail();
  s.q.check();
  assert.deepEqual(s.fixes().map(t => t.fm.id), ['0001']);
  assert.equal(s.q.view().full.fixing, '0001');
});

test('0658 AC1: when it can\'t make one, here because the main checkout isn\'t on the base branch, it says why once and the failure counts under Needs you', () => {
  const r = repo('fix');
  r.g('checkout', '-q', '-b', 'elsewhere');
  r.fail(r.g('rev-parse', 'main'));
  r.q.check(); r.q.check();
  assert.equal(r.fixes().length, 0);
  assert.equal(r.q.view().full.fixing, undefined);
  assert.equal(r.said.filter(s => /couldn't make a fix ticket/.test(s)).length, 1);
});

// ---------- AC2: out of Needs you, in plain words ----------

const FULL = { base: 'main', commit: 'abcdef1234567890abcdef1234567890abcdef12', status: 1, tests: TESTS, at: '2026-11-11T09:30:00.000Z', log: 'speck/.cache/full/run.log' };
const board = (full, tickets = []) => ({ run: { on: true }, ideas: [], tickets, foreman: { word: 'Building 1', tone: 'ok', base: 'main', full } });
const fullRow = p => p.byId('queue').children.find(n => /\bfull-suite-row\b/.test(n.className || '')) || null;
const listed = p => p.byId('queue').children.map(n => (/\bfull-suite-row\b/.test(n.className || '') ? 'full' : /\bq\b/.test(n.className || '') ? p.all(n).find(c => c.className === 'id')._text : n.textContent));
const find = (p, n, re) => p.all(n).find(c => re.test(c.className || '')) || null;

test('0658 AC2: foremanView leaves a full run with its fix ticket on its way out of Needs you, and speck status says speck is fixing it', () => {
  const v = foremanView({ run: { on: true, pid: 7 }, record: { lock: 7, full: { ...FULL, fixing: '0700' } }, tickets: [] });
  assert.doesNotMatch(v.word, /Needs you/);
  assert.equal(v.full.fixing, '0700');
  assert.ok(foremanLines(v).some(l => /speck is fixing it in fix ticket 0700/.test(l)));
});

test('0658 AC2: Build\'s row says in plain words that speck is fixing it in the fix ticket, under Building, without the Needs you dot', async () => {
  const p = boardPage([board({ ...FULL, fixing: '0700' }, [T('0700', 'ready', { type: 'fix' })])], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) });
  await p.settle();
  const l = listed(p);
  assert.ok(!l.some(x => /^Needs you/.test(x)), 'no Needs you group');
  assert.ok(l.indexOf('full') > l.findIndex(x => /^Building/.test(x)), 'under Building');
  const row = fullRow(p);
  assert.equal(find(p, row, /^title$/).textContent, 'Some of the tests broke on main');
  const where = find(p, row, /^where\b/);
  assert.equal(where.textContent, 'I\'m fixing it in 0700 · abcdef1 · 2 tests fail');
  assert.doesNotMatch(where.className, /\bneeds\b/);
});

// ---------- AC3: back under Needs you ----------

const fixed = r => { r.fail(); r.q.check(); return r.fixes()[0]; };

test('0658 AC3: once the fix ticket is blocked, or cancelled, the failure counts under Needs you again, and no other fix ticket is made', () => {
  for (const status of ['blocked', 'cancelled']) {
    const r = repo('fix'), t = fixed(r);
    setStatus(r, t, status);
    r.q.check();
    assert.equal(r.q.view().full.fixing, undefined, status);
    assert.equal(r.fixes().length, 1, `${status}: no second fix ticket`);
    assert.match(foremanView({ run: { on: true, pid: 7 }, record: { lock: 7, full: r.q.view().full }, tickets: [] }).word, /^Needs you 1$/);
  }
});

test('0658 AC3: once the fix ticket is done, it waits for the next full run, and counts under Needs you again if that still fails', () => {
  const r = repo('fix'), t = fixed(r), id = String(t.fm.id).padStart(4, '0');
  setStatus(r, t, 'done');
  r.q.check();
  assert.equal(r.q.view().full.fixing, id, 'the failing run was on code without the fix');
  r.fail(r.g('rev-parse', 'HEAD'));
  r.q.check();
  assert.equal(r.q.view().full.fixing, undefined, 'a run on code with the fix still fails');
  assert.equal(r.fixes().length, 1);
});

test('0658 AC3: once a full run passes, a later failure gets a fix ticket of its own', () => {
  const r = repo('fix'), t = fixed(r);
  setStatus(r, t, 'done');
  r.pass(); r.q.check();
  assert.equal(r.q.view().full, undefined);
  r.fail(r.g('rev-parse', 'HEAD'), ['test/other.test.mjs']);
  r.q.check();
  assert.equal(r.fixes().filter(x => x.fm.status === 'ready').length, 1);
  assert.equal(r.fixes().length, 2);
});

// ---------- AC4: watch tell or off ----------

test('0658 AC4: with watch tell, off or unset, no fix ticket is made and it counts under Needs you as before', () => {
  for (const watch of ['tell', 'off', '']) {
    const r = repo(watch);
    r.fail();
    r.q.check();
    assert.equal(r.fixes().length, 0, watch || 'unset');
    assert.equal(r.q.view().full.fixing, undefined);
    assert.equal(r.said.filter(s => /fix ticket/.test(s)).length, 0);
  }
});

test('0658 AC1: the fix ticket passes the ready check, with its outcome and acceptance criteria filled in', () => {
  const r = repo('fix'), t = fixed(r);
  const { sections } = parseTicket(t.raw);
  assert.ok(sections.outcome.join('').trim());
  assert.match(sections['acceptance criteria'].join('\n'), /1\. /);
});

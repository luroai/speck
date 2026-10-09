import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo } from './support/run.mjs';
import { T, fakePage, queueRows, panelModel, page, ROOT } from './support/panel.mjs';

// ---------- 0044: show how to resume a blocked build's session ----------

const runsPath = (dir, name) => path.join(dir, 'speck', '.cache', 'runs', name);
const statusJson = dir => {
  const res = spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: dir, encoding: 'utf8', env });
  assert.equal(res.status, 0, res.stderr);
  return JSON.parse(res.stdout);
};
const ticket = (dir, id) => statusJson(dir).tickets.find(t => t.id === id);
const writeRecord = (dir, id, rec) => {
  fs.mkdirSync(runsPath(dir, ''), { recursive: true });
  fs.writeFileSync(runsPath(dir, `${id}.json`), typeof rec === 'string' ? rec : JSON.stringify(rec));
};
const SESSION = '0b6f7c1e-2a4d-4c3e-9f10-5d6e7f8a9b0c';

test('0044 AC1: status --json adds session {id, cwd} from the run record, and every existing field is unchanged', () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]] });
  const before = ticket(r.dir, '0001');
  assert.ok('session' in before, 'every ticket has session');
  assert.equal(before.session, null, 'no run file');
  writeRecord(r.dir, '0001', { id: '0001', session: SESSION, cwd: '/home/me/repo', started: '2026-10-09T10:00:00.000Z', pid: 5, command: ['claude'] });
  const t = ticket(r.dir, '0001');
  assert.deepEqual(t.session, { id: SESSION, cwd: '/home/me/repo' });
  const { session: _a, ...rest } = t, { session: _b, ...restBefore } = before;
  assert.deepEqual(rest, restBefore);
  assert.equal(ticket(r.dir, '0002').session, null);
});

test('0044 AC1: session is null when the run record is missing, not JSON, not an object, unreadable or has no session or folder', () => {
  const r = runRepo({ tickets: [['0001', {}]] });
  writeRecord(r.dir, '0001', '{not json');
  assert.equal(ticket(r.dir, '0001').session, null, 'not JSON');
  writeRecord(r.dir, '0001', 'null');
  assert.equal(ticket(r.dir, '0001').session, null, 'JSON but not an object');
  writeRecord(r.dir, '0001', { id: '0001', cwd: '/x' });
  assert.equal(ticket(r.dir, '0001').session, null, 'no session');
  writeRecord(r.dir, '0001', { id: '0001', session: SESSION });
  assert.equal(ticket(r.dir, '0001').session, null, 'no folder');
  fs.rmSync(runsPath(r.dir, '0001.json'));
  fs.mkdirSync(runsPath(r.dir, '0001.json'));
  assert.equal(ticket(r.dir, '0001').session, null, 'unreadable');
});

test('0044 AC1: session comes from the main checkout\'s run records, even when status runs in a ticket\'s worktree', () => {
  const r = runRepo({ tickets: [['0001', {}]], worktrees: 'true' });
  writeRecord(r.dir, '0001', { id: '0001', session: SESSION, cwd: r.dir });
  const started = spawnSync(process.execPath, [CLI, 'start', '0001'], { cwd: r.dir, encoding: 'utf8', env });
  assert.equal(started.status, 0, started.stderr);
  const wt = started.stdout.trim().split('\n').pop();
  assert.deepEqual(ticket(wt, '0001').session, { id: SESSION, cwd: r.dir });
});

test('0044 AC3: resume_command is in the config template and in status --json; blank or empty stays blank, missing uses the default', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8'), /^resume_command: ['"]?claude --resume \{session\}['"]?(\s+#.*)?$/m);
  const r = runRepo({ tickets: [['0001', {}]] });
  assert.equal(statusJson(r.dir).resume_command, 'claude --resume {session}', 'from the template');
  const cfg = fs.readFileSync(r.cfgFile, 'utf8');
  const set = line => fs.writeFileSync(r.cfgFile, cfg.replace(/^resume_command:.*$/m, line));
  set('resume_command: "my-agent resume {session} --here"');
  assert.equal(statusJson(r.dir).resume_command, 'my-agent resume {session} --here');
  set('resume_command: "  my-agent {session}  "');
  assert.equal(statusJson(r.dir).resume_command, 'my-agent {session}', 'trimmed');
  set('resume_command: ""');
  assert.equal(statusJson(r.dir).resume_command, '');
  set('resume_command:');
  assert.equal(statusJson(r.dir).resume_command, '');
  set('');
  assert.equal(statusJson(r.dir).resume_command, 'claude --resume {session}', 'an older config without the setting');
  const s = statusJson(r.dir);
  assert.deepEqual(Object.keys(s).sort(), ['ideas', 'resume_command', 'tickets']);
});

// ---------- the panel ----------

const blocked = (o = {}) => T('0007', 'blocked', { blocked_question: 'Which format?', session: { id: SESSION, cwd: '/home/me/repo' }, ...o });
const state = (o = {}, extra = {}) => ({ tickets: [blocked(o)], ideas: [], resume_command: 'claude --resume {session}', ...extra });
const resumeOf = s => panelModel()(s).queue[0].resume;
const byClass = (p, row, cls) => p.all(row).filter(n => new RegExp(`\\b${cls}\\b`).test(n.className || ''));
// A page with a clipboard that records what it's given, and timers that record their delay.
async function clipPage(s, { fail = false } = {}) {
  const copied = [], timers = [];
  const navigator = { clipboard: { writeText: async text => { if (fail) throw new Error('denied'); copied.push(text); } } };
  const p = fakePage([s], { navigator, setTimeout: (fn, ms) => timers.push({ fn, ms }) });
  await p.settle();
  return { p, copied, timers };
}

test('0044 AC2: a blocked ticket with a session shows cd <cwd> && <resume_command> under its question, with {session} replaced', async () => {
  assert.deepEqual(resumeOf(state()), { text: `cd /home/me/repo && claude --resume ${SESSION}`, command: true });
  assert.equal(resumeOf(state({}, { resume_command: 'x {session} y {session}' })).text, `cd /home/me/repo && x ${SESSION} y ${SESSION}`);
  const { p } = await clipPage(state());
  const row = queueRows(p)[0];
  const kids = row.children.map(n => n.className);
  const qi = kids.indexOf('question'), ri = kids.findIndex(c => /\bresume\b/.test(c));
  assert.ok(qi >= 0 && ri === qi + 1, `the command comes right under the question: ${kids}`);
  assert.equal(byClass(p, row, 'cmd')[0].textContent, `cd /home/me/repo && claude --resume ${SESSION}`);
});

test('0044 AC2: the folder is quoted for a POSIX shell only when it has anything other than letters, digits, /, ., _ and -', () => {
  const cd = cwd => resumeOf(state({ session: { id: SESSION, cwd } })).text.split(' && ')[0];
  assert.equal(cd('/home/me/my_repo-2.0'), 'cd /home/me/my_repo-2.0');
  assert.equal(cd('/home/me/my repo'), "cd '/home/me/my repo'");
  assert.equal(cd("/home/me/it's"), "cd '/home/me/it'\\''s'");
  assert.equal(cd('/tmp/$(rm -rf ~)'), "cd '/tmp/$(rm -rf ~)'");
  assert.equal(cd('/tmp/a;b'), "cd '/tmp/a;b'");
  assert.equal(cd('/tmp/café'), "cd '/tmp/café'");
  // The session id is put in the same way: a UUID as it is, anything odd quoted.
  assert.equal(resumeOf(state({ session: { id: 'a b;c', cwd: '/x' } })).text, "cd /x && claude --resume 'a b;c'");
});

test('0044 AC3: with resume_command blank, the panel shows only "session <id>", with no Copy button', async () => {
  for (const resume_command of ['', '   ', undefined, null, 5]) {
    const s = state({}, { resume_command });
    if (resume_command === undefined) delete s.resume_command;
    assert.deepEqual(resumeOf(s), { text: `session ${SESSION}`, command: false }, String(resume_command));
  }
  const { p } = await clipPage(state({}, { resume_command: '' }));
  const row = queueRows(p)[0];
  assert.equal(byClass(p, row, 'resume')[0].textContent, `session ${SESSION}`);
  assert.equal(p.all(row).filter(n => n.tagName === 'button').length, 0);
});

test('0044 AC4: Copy copies the command\'s exact text and says "Copied" for 2 seconds', async () => {
  const s = state({ session: { id: SESSION, cwd: '/home/me/my repo' } });
  const { p, copied, timers } = await clipPage(s);
  const btn = () => p.all(queueRows(p)[0]).find(n => n.tagName === 'button');
  assert.equal(btn().textContent, 'Copy');
  const before = timers.length;
  btn().listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.deepEqual(copied, [`cd '/home/me/my repo' && claude --resume ${SESSION}`]);
  assert.equal(copied[0], byClass(p, queueRows(p)[0], 'cmd')[0].textContent, 'exactly the text shown');
  assert.equal(btn().textContent, 'Copied');
  const reset = timers.slice(before).filter(t => t.ms === 2000 && t.fn !== timers[0].fn);
  assert.equal(reset.length, 1, 'one 2-second timer puts it back');
  reset[0].fn();
  assert.equal(btn().textContent, 'Copy');
});

test('0044 AC4: a second copy within 2 seconds keeps "Copied" until 2 seconds after the second', async () => {
  const { p, timers } = await clipPage(state());
  const btn = () => p.all(queueRows(p)[0]).find(n => n.tagName === 'button');
  const before = timers.length;
  btn().listeners.click({ stopPropagation() {} });
  await p.settle();
  btn().listeners.click({ stopPropagation() {} });
  await p.settle();
  const resets = timers.slice(before).filter(t => t.ms === 2000 && t.fn !== timers[0].fn);
  assert.equal(resets.length, 2);
  resets[0].fn();
  assert.equal(btn().textContent, 'Copied', 'the first timer doesn\'t cut the second short');
  resets[1].fn();
  assert.equal(btn().textContent, 'Copy');
});

test('0044 AC4: when the clipboard refuses, the button says so instead of "Copied", and the command stays on show to copy by hand', async () => {
  const { p } = await clipPage(state(), { fail: true });
  const btn = () => p.all(queueRows(p)[0]).find(n => n.tagName === 'button');
  btn().listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.notEqual(btn().textContent, 'Copied');
  assert.match(btn().textContent, /couldn't copy/i);
  assert.equal(byClass(p, queueRows(p)[0], 'cmd')[0].textContent, `cd /home/me/repo && claude --resume ${SESSION}`);
});

test('0044 AC5: a blocked ticket with no session, and tickets that aren\'t blocked, show nothing extra', async () => {
  assert.equal(resumeOf(state({ session: null })), null);
  assert.equal(resumeOf(state({ session: undefined })), null);
  assert.equal(resumeOf(state({ session: { id: SESSION } })), null, 'no folder');
  assert.equal(resumeOf(state({ session: { id: 5, cwd: '/x' } })), null, 'id not text');
  for (const status of ['building', 'reviewing', 'approved', 'ready'])
    assert.equal(resumeOf(state({ status })), null, status);
  const s = { tickets: [blocked({ session: null }), T('0008', 'building', { session: { id: SESSION, cwd: '/x' } })], ideas: [], resume_command: 'claude --resume {session}' };
  const { p } = await clipPage(s);
  for (const row of queueRows(p)) {
    assert.equal(byClass(p, row, 'resume').length, 0);
    assert.equal(p.all(row).filter(n => n.tagName === 'button').length, 0);
  }
});

test('0044: the page uses the Clipboard API and builds the command with textContent only', () => {
  assert.match(page(), /navigator\.clipboard\.writeText\(/);
  assert.doesNotMatch(page(), /innerHTML/);
});

test('0050: the Copy label changes on the kept row, so text selected in it stays through the label reset and the next refresh', async () => {
  const { p, timers } = await clipPage(state(), { fail: true });
  const row = queueRows(p)[0];
  const cmd = byClass(p, row, 'cmd')[0], btn = p.all(row).find(n => n.tagName === 'button');
  const kept = () => queueRows(p)[0] === row && p.all(row).includes(cmd) && p.all(row).includes(btn);
  const before = timers.length;
  btn.listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.match(btn.textContent, /couldn't copy/i);
  assert.ok(kept(), 'the row is kept when the label changes');
  timers.slice(before).find(t => t.ms === 2000 && t.fn !== timers[0].fn).fn();
  assert.equal(btn.textContent, 'Copy');
  assert.ok(kept(), 'and when it resets');
  timers[0].fn();
  await p.settle();
  assert.ok(kept(), 'and through the next refresh');
  assert.equal(p.all(queueRows(p)[0]).find(n => n.tagName === 'button').textContent, 'Copy');
});

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, T, fakePage, queueRows, startPanel, stop, freePort, request, post, tokenOf, gitEnv } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';
import { OPTION, ENDED, blockedRepo } from './support/blocked.mjs';
import { goWith, goWithMessage, goWithQueue } from '../scripts/go-with.mjs';

Object.assign(process.env, gitEnv); // goWith commits in this process

// ---------- 0284: go with a blocked ticket's recommendation from the panel ----------

const recordOf = r => JSON.parse(fs.readFileSync(r.record, 'utf8'));
const shown = r => statusData(r.dir).tickets.find(t => t.id === '0001');

// The panel's page with these tickets on the board, and every POST it sends, answered by `answer`.
function page(tickets, { answer = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }), yes = () => true, asked = [] } = {}) {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (opts?.method === 'POST') { sent.push([url, opts]); return answer(url, opts); }
      return { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : { tickets: JSON.parse(JSON.stringify(tickets)), ideas: [] }) };
    },
    confirm: q => { asked.push(q); return yes(); },
  });
  p.sent = sent;
  return p;
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const goButton = (p, id) => p.all(rowOf(p, id)).find(n => n.tagName === 'button' && n.textContent === 'Go with the recommendation') || null;
const BLOCKED = (id, o = {}) => T(id, 'blocked', { blocked_question: 'A or B?', blocked_recommendation: OPTION, blocked_noticeable: false, blocked_clear: true, blocked_resumable: true,
  session: { id: 'sess-1', cwd: '/repo' }, ...o });

test('0284 AC1: a blocked ticket with a recommendation shows a Go with the recommendation button on its question; one without shows none', async () => {
  const p = page([BLOCKED('0001'), BLOCKED('0002', { blocked_recommendation: null })]);
  await p.settle();
  const b = goButton(p, '0001');
  assert.ok(b, 'a button');
  const q = p.all(rowOf(p, '0001')).find(n => n.className === 'question');
  assert.ok(p.all(q).includes(b), 'beside the question, on it');
  assert.equal(goButton(p, '0002'), null, 'none without a recommendation');
});

test('0284 AC1: speck status --json says whether a blocked ticket\'s build can be resumed', () => {
  const r = blockedRepo();
  assert.equal(shown(r).blocked_recommendation, OPTION);
  assert.equal(shown(r).blocked_resumable, true);
});

test('0284 AC2: pressing it asks first, then sends the choice with the token, and a refusal shows under it', async () => {
  const asked = [];
  const p = page([BLOCKED('0001')], { asked, answer: async () => ({ ok: false, status: 409, json: async () => ({ error: 'Its build is running.' }) }) });
  await p.settle();
  p.press(goButton(p, '0001'));
  await p.settle();
  assert.equal(asked.length, 1);
  assert.ok(asked[0].includes(OPTION), 'the question names the option');
  assert.deepEqual(p.sent.map(([u, o]) => [u, o.method, o.headers['X-Speck-Token']]), [['/api/tickets/0001/recommendation', 'POST', '{{token}}']]);
  assert.match(rowOf(p, '0001').textContent, /Its build is running\./);
  const no = page([BLOCKED('0001')], { yes: () => false });
  await no.settle();
  no.press(goButton(no, '0001'));
  await no.settle();
  assert.equal(no.sent.length, 0, 'cancelling sends nothing');
});

test('0284 AC2: the message tells the build the user chose the recommended option, names it, and to carry on', () => {
  const m = goWithMessage('0001', OPTION);
  assert.ok(m.includes(OPTION));
  assert.match(m, /chose the recommended option/);
  assert.match(m, /carry on with \/speck-build 0001 from where you left off/i);
  assert.match(goWithMessage('0001', OPTION, '$speck-build'), /\$speck-build 0001/);
});

test('0284 AC2 AC3: going with it records the choice in the Notes, sets the ticket building and commits it; speck run then resumes the build\'s own session', () => {
  const r = blockedRepo();
  const before = r.head();
  const out = goWith(r.dir, '1', new Date('2026-10-18T14:05:00Z'));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.notEqual(r.head(), before, 'committed');
  assert.equal(r.g('status', '--porcelain', '--', r.file), '', 'nothing left uncommitted');
  const text = r.ticket();
  assert.match(text, /^status: building/m);
  const notes = text.split('## Notes')[1].split('## ')[0];
  assert.ok(notes.includes('- A note.'), 'the Notes already there are kept');
  const line = notes.split('\n').find(l => l.includes(OPTION));
  assert.ok(line, 'the option is in the Notes');
  assert.match(line, /recommendation/i);
  assert.match(line, /2026-10-18 14:05 UTC/, 'with the time');
  const t = shown(r);
  assert.equal(t.status, 'building', 'shows as building');
  assert.equal(t.build_exit, null, 'not as a build that stopped before finishing');
  assert.equal(recordOf(r).go_with.option, OPTION, 'kept for speck run');

  const started = [], running = new Set();
  const q = goWithQueue({ repo: r.dir, cfg: { base_branch: 'main', branch_prefix: 'speck/' }, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 1, running,
    startBuild: (id, argv, cwd, session, flags, record) => { started.push({ id, argv, cwd, session, flags, rec: JSON.parse(record(4242)) }); running.add(id); },
    saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => '', runs: () => r.runs });
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1);
  const s = started[0];
  assert.deepEqual(s.argv, ['claude', '-p', goWithMessage('0001', OPTION), '--resume', 'sess-1'], 'its own session, with the message in place of the prompt');
  assert.equal(s.flags, 'a', 'logging to the end of its log');
  assert.equal(s.cwd, r.dir);
  assert.equal(Object.hasOwn(s.rec, 'exited'), false, 'its record shows it running');
  assert.equal(Object.hasOwn(s.rec, 'go_with'), false);
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1, 'resumed once');
});

test('0284 AC2: speck run waits for a free build slot before resuming it', () => {
  const r = blockedRepo();
  assert.equal(goWith(r.dir, '0001').status, 200);
  const started = [], running = new Set(['0009']);
  const q = goWithQueue({ repo: r.dir, cfg: { base_branch: 'main', branch_prefix: 'speck/' }, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 1, running,
    startBuild: id => { started.push(id); running.add(id); }, saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => '', runs: () => r.runs });
  q.check(statusData(r.dir).tickets);
  assert.deepEqual(started, []);
  assert.equal(shown(r).build_exit, null, 'still shown as building meanwhile');
  running.delete('0009');
  q.check(statusData(r.dir).tickets);
  assert.deepEqual(started, ['0001']);
});

test('0284 AC2: a choice whose build was carried on by hand since is dropped, not resumed', () => {
  const r = blockedRepo();
  assert.equal(goWith(r.dir, '0001').status, 200);
  fs.writeFileSync(path.join(r.dir, 'work.txt'), 'by hand\n');
  r.g('add', 'work.txt'); r.g('commit', '-qm', 'carried on by hand');
  const started = [];
  const q = goWithQueue({ repo: r.dir, cfg: { base_branch: 'main', branch_prefix: 'speck/' }, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 1, running: new Set(),
    startBuild: id => started.push(id), saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => '', runs: () => r.runs });
  q.check(statusData(r.dir).tickets);
  assert.deepEqual(started, []);
  assert.equal(Object.hasOwn(recordOf(r), 'go_with'), false, 'dropped');
  assert.ok(Object.hasOwn(recordOf(r), 'exited'), 'its exit kept');
});

test('0284 AC4: with no run record, or one with no session, there is no button and the question says how to resume it by hand', async () => {
  assert.equal(shown(blockedRepo({ record: null })).blocked_resumable, false);
  assert.equal(shown(blockedRepo({ record: { ...ENDED, session: null } })).blocked_resumable, false);
  assert.equal(shown(blockedRepo({ buildCommand: 'claude -p hello' })).blocked_resumable, false, 'nor with a build_command speck run can\'t resume a session with');
  const p = page([BLOCKED('0001', { blocked_resumable: false, session: null })]);
  await p.settle();
  assert.equal(goButton(p, '0001'), null);
  assert.match(rowOf(p, '0001').textContent, /Answer the question, then run \/speck-build 0001/);
});

test('0284 AC4: going with it is refused, changing nothing, when the build can\'t be resumed or the ticket isn\'t waiting on its answer', () => {
  const cases = [
    [{ record: null }, /no run record/],
    [{ record: { ...ENDED, session: '' } }, /no session/],
    [{ buildCommand: 'claude -p hello' }, /build_command needs --session-id \{session\}/],
    [{ record: { ...ENDED, exited: undefined, pid: process.pid } }, /still running/],
    [{ question: 'A or B?' }, /no recommendation/],
    [{ status: 'reviewing' }, /not blocked/],
  ];
  for (const [opts, why] of cases) {
    const r = blockedRepo(opts);
    const ticket = r.ticket(), head = r.head(), rec = fs.existsSync(r.record) ? fs.readFileSync(r.record, 'utf8') : null;
    const out = goWith(r.dir, '0001');
    assert.equal(out.status, 409, JSON.stringify(opts));
    assert.match(out.body.error, why);
    assert.equal(r.ticket(), ticket, 'the ticket is unchanged');
    assert.equal(r.head(), head, 'nothing committed');
    assert.equal(fs.existsSync(r.record) ? fs.readFileSync(r.record, 'utf8') : null, rec, 'the run record is unchanged');
  }
  assert.equal(goWith(blockedRepo().dir, '0042').status, 404);
});

test('0284 AC2: the panel server takes the choice at POST /api/tickets/<id>/recommendation', async () => {
  const r = blockedRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    assert.equal((await post(p.port, '/api/tickets/1/recommendation', { token: 'wrong' })).status, 403);
    const res = await post(p.port, '/api/tickets/1/recommendation', { token });
    assert.equal(res.status, 200, res.body);
    assert.match(r.ticket(), /^status: building/m);
  } finally { await stop(p); }
});

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fakePage, T, gitEnv, CLI, click, startPanel, stop, freePort, request, post, tokenOf } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { loadConfig } from '../scripts/speck.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { foremanAgentQueue, foremanAction, agentView } from '../scripts/foreman-agent.mjs';
import { foremanReply, panelForemanReply } from '../scripts/foreman-answer.mjs';

Object.assign(process.env, gitEnv); // speck foreman commits in this process

// ---------- 0318: answer or dismiss a question the Foreman asked ----------

const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const ON = { on: true, pid: process.pid };
const QUESTION = 'Should it keep the old test?';
const NOW = new Date('2026-10-19T09:30:00Z');

// The Foreman agent's queue, as 0287's tests have it: starts and resumed builds are kept, and an agent runs until end().
function agents(r) {
  const starts = [], resumed = [], said = [], again = [], running = new Set(), live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), foreman_fixing: 'fix' }),
    words: WORDS, cfg: CFG, max: 1, running, ships: { again: id => again.push(id) }, say: m => said.push(m),
    startBuild: (id, argv) => { resumed.push({ id, argv }); running.add(id); },
    start: (argv, cwd, log, env) => { const pid = 90000 + starts.length; starts.push({ token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [] });
  return { q, starts, resumed, said, again, running, end: s => live.delete(s.pid) };
}

// A repo whose ticket 0001 (at `status`) the Foreman agent has asked you about, with the agent ended.
function asked(status = 'building') {
  const r = blockedRepo({ status }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.q.check([T('0001', status)]);
  foremanAction(r.dir, ['ask', '0001', QUESTION, '--why=the build stopped on a choice'], { token: a.starts[0].token, now: new Date('2026-10-18T14:00:00Z') });
  a.end(a.starts[0]);
  a.q.check([T('0001', status)]);
  return { r, a, check: (s = status) => a.q.check([T('0001', s)]) };
}
const reply = (r, action, text, o = {}) => foremanReply(r.dir, action, '0001', text, { now: NOW, env: {}, ...o });
const asks = (r, status = 'building') => agentView(r.runs, [T('0001', status)]).asks;

// The page with the Foreman's question about 0001 on the board, as the panel sends it.
function pageWith(r, more = [], globals = {}) {
  const v = agentView(r.runs, [T('0001', 'building')]);
  const f = foremanView({ run: ON, record: { lock: process.pid }, tickets: [T('0001', 'building')], agent: v });
  const board = { tickets: [T('0001', 'building')], ideas: [], resume_command: '', run: ON, foreman: f };
  return fakePage([board, ...more], { confirm: () => true, ...globals });
}
const find = (p, root, pred) => p.all(root).find(pred);
const askIn = (p, root) => find(p, root, n => /\bforeman-ask\b/.test(n.className || ''));
const buttonIn = (p, root, text) => find(p, root, n => n.tagName === 'button' && n.textContent === text);

test('0318 AC1: the Foreman\'s question shows on the ticket\'s card with an Answer box and a Dismiss button', async () => {
  const { r } = asked();
  const p = pageWith(r);
  await p.settle();
  const card = askIn(p, p.byId('queue'));
  assert.ok(card, 'the card has the question');
  assert.match(card.textContent, /speck asks you: Should it keep the old test\?/);
  assert.ok(find(p, card, n => n.tagName === 'textarea'), 'an Answer box');
  assert.ok(buttonIn(p, card, 'Answer'));
  assert.ok(buttonIn(p, card, 'Dismiss'));
});

test('0318 AC1, 0458: the Foreman\'s question shows on its card, and no longer in its detail, which shows only the log', async () => {
  const { r } = asked();
  const p = pageWith(r);
  await p.settle();
  click(p.byId('run'));
  await p.settle();
  assert.equal(askIn(p, p.byId('foreman')), undefined, 'not in the detail');
  assert.ok(askIn(p, p.byId('queue')), 'on the card');
});

test('0318 AC1: a ticket the Foreman hasn\'t asked about has no Answer box', async () => {
  const r = blockedRepo({ status: 'building' });
  const p = pageWith(r);
  await p.settle();
  assert.equal(askIn(p, p.byId('queue')), undefined);
});

test('0318 AC2: answering records it in the Notes, clears the question and has speck run resume the build with it', () => {
  const { r, a, check } = asked();
  const before = r.head();
  const out = reply(r, 'answer', 'Keep it,\nand fix it.');
  assert.match(out, /resumes its build with your answer/);
  assert.match(r.ticket(), /^- You answered speck \(2026-10-19 09:30 UTC\): Keep it, and fix it\. Its question: Should it keep the old test\?$/m);
  assert.notEqual(r.head(), before, 'committed');
  assert.match(r.g('log', '-1', '--format=%s'), /^speck\(0001\): watch: answer$/);
  assert.match(r.ticket(), /^status: building$/m, 'the status is left for the build');
  assert.deepEqual(asks(r), [], 'the question is cleared');
  check();
  assert.equal(a.resumed.length, 1, 'speck run resumes the build');
  assert.ok(a.resumed[0].argv.includes('--resume') && a.resumed[0].argv.includes('sess-1'));
  const message = a.resumed[0].argv.find(w => w.includes('Keep it, and fix it.'));
  assert.ok(message, 'with your answer');
  assert.match(message, /Should it keep the old test\?/);
  assert.match(message, /\/speck-build 0001/);
  a.running.clear();
  check();
  assert.equal(a.resumed.length, 1, 'once');
});

test('0318 AC2: answering a question about an approved ticket auto_ship covers has speck run ship it again, once', () => {
  const { r, a, check } = asked('approved');
  reply(r, 'answer', 'The network is back, ship it.', { tickets: [{ id: '0001', auto_ship: true }] });
  assert.match(r.ticket(), /You answered speck .*: The network is back, ship it\./);
  check('approved');
  assert.deepEqual(a.again, ['0001']);
  assert.equal(a.resumed.length, 0);
  check('approved');
  assert.deepEqual(a.again, ['0001'], 'once');
});

test('0318 AC2: an answer speck run can\'t carry out is refused, changing nothing', () => {
  const { r } = asked();
  fs.rmSync(path.join(r.runs, '0001.json')); // no run record: speck run can't resume it
  const before = r.head();
  assert.throws(() => reply(r, 'answer', 'Keep it.'), /can't resume ticket 0001's build.*Dismiss/s);
  assert.equal(r.head(), before);
  assert.equal(asks(r).length, 1, 'still waiting');
  assert.throws(() => reply(r, 'answer', '   '), /needs your answer/);
});

test('0318 AC2: an answer whose ticket has moved on before speck run gets to it isn\'t carried out', () => {
  const { r, a, check } = asked();
  reply(r, 'answer', 'Keep it.');
  check('blocked');
  assert.equal(a.resumed.length, 0);
  assert.ok(a.said.some(m => /moved on/.test(m)));
});

test('0318 AC2: an answer waiting for a build slot isn\'t carried out once its ticket has moved on', () => {
  const { r, a } = asked();
  reply(r, 'answer', 'Keep it.');
  a.running.add('0002'); // the only build slot is in use
  a.q.check([T('0001', 'building'), T('0002', 'building')]);
  assert.equal(a.resumed.length, 0, 'waits for a slot');
  a.running.clear();
  a.q.check([T('0001', 'approved'), T('0002', 'done')]);
  assert.equal(a.resumed.length, 0, 'not once the ticket has moved on');
  assert.ok(a.said.some(m => /moved on/.test(m)));
  a.q.check([T('0001', 'building')]);
  assert.equal(a.resumed.length, 0, 'dropped, not kept for later');
});

test('0318 AC3: dismissing clears the question, records it and leaves the ticket as it is', () => {
  const { r, a, check } = asked();
  const out = reply(r, 'dismiss');
  assert.match(out, /Dismissed/);
  assert.match(r.ticket(), /^- You dismissed speck's question \(2026-10-19 09:30 UTC\): Should it keep the old test\?$/m);
  assert.match(r.ticket(), /^status: building$/m);
  assert.deepEqual(asks(r), []);
  const f = foremanView({ run: ON, record: { lock: process.pid }, tickets: [T('0001', 'building')], agent: agentView(r.runs, [T('0001', 'building')]) });
  assert.doesNotMatch(f.word, /Needs you/);
  check();
  assert.equal(a.resumed.length, 0, 'nothing resumed');
  assert.deepEqual(a.again, []);
});

test('0318 AC2 AC3: the panel\'s Answer and Dismiss send the answer to the panel server', async () => {
  const { r } = asked();
  const p = pageWith(r, [{ message: 'ok' }]);
  await p.settle();
  const card = askIn(p, p.byId('queue'));
  const box = find(p, card, n => n.tagName === 'textarea');
  box.value = 'Keep it.';
  box.listeners.input?.({ target: box });
  click(buttonIn(p, card, 'Answer'));
  await p.settle();
  const sent = p.calls.find(c => /\/api\/foreman\/0001\/answer$/.test(c.url));
  assert.ok(sent, 'posted');
  assert.equal(sent.opts.method, 'POST');
  assert.equal(JSON.parse(sent.opts.body).text, 'Keep it.');
  assert.ok(sent.opts.headers['X-Speck-Token']);

  const p2 = pageWith(r, [{ message: 'ok' }]);
  await p2.settle();
  click(buttonIn(p2, askIn(p2, p2.byId('queue')), 'Dismiss'));
  await p2.settle();
  assert.ok(p2.calls.some(c => /\/api\/foreman\/0001\/dismiss$/.test(c.url) && c.opts.method === 'POST'));
});

test('0318 AC2 AC3: the panel server answers and dismisses through the same code', () => {
  const { r } = asked();
  const out = panelForemanReply(r.dir, '0001', 'answer', JSON.stringify({ text: 'Keep it.' }), { now: NOW, env: {} });
  assert.equal(out.status, 200);
  assert.match(r.ticket(), /You answered speck .*: Keep it\./);
  const again = panelForemanReply(r.dir, '0001', 'dismiss', '', { now: NOW, env: {} });
  assert.equal(again.status, 409);
  assert.match(again.body.error, /already been dealt with/);
  assert.equal(panelForemanReply(r.dir, '0001', 'answer', '{not json', { env: {} }).status, 400);
});

test('0318 AC2: the real panel server reads the answer from the request and refuses a second reply', async () => {
  const { r } = asked();
  const p = await startPanel(r.dir, ['--port', String(await freePort())], CLI, { SPECK_FOREMAN_RUN: '' });
  try {
    const token = tokenOf((await request(p.port)).body);
    const refused = await post(p.port, '/api/foreman/0001/answer', { body: JSON.stringify({ text: 'Keep it.' }) });
    assert.equal(refused.status, 403, 'only the page it sent');
    const out = await post(p.port, '/api/foreman/0001/answer', { token, body: JSON.stringify({ text: 'Keep it.' }) });
    assert.equal(out.status, 200, out.body);
    assert.match(r.ticket(), /You answered speck .*: Keep it\./);
    const again = await post(p.port, '/api/foreman/0001/dismiss', { token });
    assert.equal(again.status, 409);
    assert.match(JSON.parse(again.body).error, /already been dealt with/);
  } finally { await stop(p); }
});

test('0318 AC4: speck foreman answer and speck foreman dismiss do the same from the command line', () => {
  const { r } = asked();
  const run = (...args) => spawnSync(process.execPath, [CLI, 'foreman', ...args], { cwd: r.dir, encoding: 'utf8', env: { ...process.env, SPECK_FOREMAN_RUN: '' } });
  const a = run('answer', '0001', 'Keep it.');
  assert.equal(a.status, 0, a.stderr);
  assert.match(a.stdout, /resumes its build with your answer/);
  assert.match(r.ticket(), /You answered speck .*: Keep it\./);

  const { r: r2 } = asked();
  const d = spawnSync(process.execPath, [CLI, 'foreman', 'dismiss', '0001'], { cwd: r2.dir, encoding: 'utf8', env: { ...process.env, SPECK_FOREMAN_RUN: '' } });
  assert.equal(d.status, 0, d.stderr);
  assert.match(r2.ticket(), /You dismissed speck's question/);
  assert.doesNotMatch(d.stderr, /at .*\.mjs:\d+/, 'no stack trace');
});

test('0318 AC4: speck status says how to answer or dismiss it', () => {
  const { r } = asked();
  const f = foremanView({ run: ON, record: { lock: process.pid }, tickets: [T('0001', 'building')], agent: agentView(r.runs, [T('0001', 'building')]) });
  const lines = foremanLines(f).join('\n');
  assert.match(lines, /speck answer 0001/);
  assert.match(lines, /speck dismiss 0001/);
});

test('0318 AC4: the Foreman agent can\'t answer or dismiss its own question', () => {
  const { r } = asked();
  assert.throws(() => reply(r, 'answer', 'Keep it.', { env: { SPECK_FOREMAN_RUN: 'tok' } }), /only you can/);
  assert.throws(() => reply(r, 'dismiss', '', { env: { SPECK_FOREMAN_RUN: 'tok' } }), /only you can/);
  assert.equal(asks(r).length, 1);
});

test('0318 AC5: a question can be answered or dismissed only once', () => {
  for (const [first, second] of [['answer', 'dismiss'], ['dismiss', 'answer'], ['answer', 'answer'], ['dismiss', 'dismiss']]) {
    const { r } = asked();
    reply(r, first, 'Keep it.');
    const head = r.head();
    assert.throws(() => reply(r, second, 'Remove it.'), /already been dealt with/, `${first} then ${second}`);
    assert.equal(r.head(), head, 'nothing more is committed');
  }
});

test('0318 AC5: a question being dealt with at the same moment is refused, and one never asked says so', () => {
  const { r } = asked();
  const ask = JSON.parse(fs.readFileSync(path.join(r.runs, 'run.foreman-did.jsonl'), 'utf8').trim());
  fs.writeFileSync(path.join(r.runs, `run.foreman-answer.0001.${ask.at.replace(/\D/g, '')}.claim`), '{}'); // another reply partway
  assert.throws(() => reply(r, 'dismiss'), /already been dealt with/);
  const r2 = blockedRepo({ status: 'building' });
  assert.throws(() => foremanReply(r2.dir, 'dismiss', '0001', '', { env: {} }), /hasn't asked you anything about 0001/);
  assert.throws(() => foremanReply(r2.dir, 'dismiss', '9999', '', { env: {} }), /No ticket 9999/);
});

test('0318 AC4: the README, the brief and the Foreman\'s skill name the commands, and the brief the file a reply is kept in', () => {
  const read = f => fs.readFileSync(path.join(path.dirname(CLI), '..', f), 'utf8');
  for (const f of ['README.md', 'docs/brief.md']) {
    assert.ok(read(f).includes('speck foreman answer <id> "<answer>"'), f);
    assert.ok(read(f).includes('speck foreman dismiss <id>'), f);
  }
  assert.ok(read('docs/brief.md').includes('speck/.cache/runs/run.foreman-answer.<id>.<time>.json'));
  assert.ok(read('docs/brief.md').includes('speck(<id>): Foreman: answer') && read('docs/brief.md').includes('speck(<id>): Foreman: dismiss'));
  for (const command of ['speck foreman answer', 'speck foreman dismiss']) assert.ok(read('skills/speck-watch/SKILL.md').includes(command), command);
  const help = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' });
  assert.match(help.stdout + help.stderr, /speck answer <id> "<text>"/);
});

test('0318 AC4: an answer starting with -- is kept, and a question with no time is refused, changing nothing', () => {
  const { r } = asked();
  const a = spawnSync(process.execPath, [CLI, 'foreman', 'answer', '0001', '--force', 'it'], { cwd: r.dir, encoding: 'utf8', env: { ...process.env, SPECK_FOREMAN_RUN: '' } });
  assert.equal(a.status, 0, a.stderr);
  assert.match(r.ticket(), /You answered speck .*: --force it\./);

  const { r: r2 } = asked();
  const did = path.join(r2.runs, 'run.foreman-did.jsonl'), ask = JSON.parse(fs.readFileSync(did, 'utf8').trim());
  delete ask.at;
  fs.writeFileSync(did, `${JSON.stringify(ask)}\n`);
  const head = r2.head();
  assert.throws(() => reply(r2, 'dismiss'), /has no time/);
  assert.equal(r2.head(), head);
});

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gitEnv, fakePage, fullViewOf } from './support/panel.mjs';
import { CHECK, ASKED, blocked, checking } from './support/app-check.mjs';
import { OPTION, QUESTION, blockedRepo } from './support/blocked.mjs';
import { statusData } from '../scripts/speck.mjs';
import { questionFacts } from '../scripts/question-facts.mjs';
import { decidable, fixable } from '../scripts/foreman.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { readActions, readAgentState, foremanArgv } from '../scripts/foreman-agent.mjs';
import { addPicture, picturesLines } from '../scripts/pictures.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process

// ---------- 0636: let speck check a build's question in the running app ----------

const SAW = 'The Save button shows at the bottom in the dark look';
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b30000000049454e44ae426082', 'hex');

test('0636 AC1: a blocked question\'s Check in the app line is read apart from the question, and speck status --json gives it', () => {
  assert.equal(questionFacts([QUESTION, `- Check in the app: ${CHECK}`]).checkInApp, CHECK);
  assert.equal(questionFacts(['Check in the app:']).checkInApp, undefined, 'a blank one is left in the question');
  const r = blockedRepo({ question: ASKED });
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.blocked_check_in_app, CHECK);
  assert.ok(!t.blocked_question.includes('Check in the app'), t.blocked_question);
  assert.equal(statusData(blockedRepo().dir).tickets.find(x => x.id === '0001').blocked_check_in_app, null);
});

test('0636 AC1: the build skill asks for a check in the app with a Check in the app line', () => {
  const skill = fs.readFileSync(new URL('../skills/speck-build/SKILL.md', import.meta.url), 'utf8');
  assert.ok(skill.includes('`Check in the app: <what to look at>`'));
});

test('0636 AC1: the ticket\'s full view gives the Check in the app line', async () => {
  const tickets = [blocked()];
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : { tickets: JSON.parse(JSON.stringify(tickets)), ideas: [] }) }) });
  await p.settle();
  const v = await fullViewOf(p, '0001');
  const line = p.all(v).find(n => /\bquestion-check\b/.test(n.className));
  assert.equal(line?.textContent, `Check in the app: ${CHECK}`);
});

test('0636 AC2: with watch: decide, speck run starts the agent once per question, with a brief to use speck app, logins and picture', () => {
  const { a } = checking();
  a.check();
  assert.equal(a.starts.length, 1);
  const brief = a.starts[0].brief;
  for (const said of ['speck.mjs app 0001', 'speck.mjs logins', 'speck.mjs picture 0001', 'speck.mjs app 0001 --stop', `watch decide 0001 "${OPTION}"`, 'watch ask 0001', CHECK])
    assert.ok(brief.includes(said), `${said}\n${brief}`);
  assert.ok(a.starts[0].argv.includes('mcp__playwright'), 'it may use a browser');
  a.end(); a.check(); a.check();
  assert.equal(a.starts.length, 1, 'once per question');
  a.check(blocked({ blocked_question: 'Another question?' }));
  assert.equal(a.starts.length, 2, 'a new question is checked again');
});

test('0636 AC2: a decide on a check goes with the recommendation, sets the ticket building, and its Notes say what it checked and saw', () => {
  const { r, a } = checking();
  a.check();
  assert.match(a.act('decide', '0001', OPTION, `--saw=${SAW}`, '--why=It shows as asked'), /resumes its build/);
  const line = r.ticket().split('\n').find(l => l.startsWith('- Went with the recommendation:'));
  assert.equal(line, `- Went with the recommendation: ${OPTION} (chosen by speck, as watch is decide, 2026-11-11 14:00 UTC). Checked in the app: ${CHECK}. Saw: ${SAW}.`);
  assert.match(r.ticket(), /^status: building$/m);
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.deepEqual(t.foreman_took.map(w => w.option), [OPTION], 'still read as a call speck made');
});

test('0636 AC2: otherwise it asks, saying what it saw, and a check refuses other options and actions', () => {
  const { r, a } = checking();
  a.check();
  const head = r.head();
  assert.throws(() => a.act('decide', '0001', 'A, remove it', `--saw=${SAW}`, '--why=x'), /only with the build's recommendation/);
  assert.throws(() => a.act('decide', '0001', OPTION, '--why=x'), /--saw/);
  assert.throws(() => a.act('resume', '0001', 'carry on', `--saw=${SAW}`, '--why=x'), /Use decide or ask/);
  assert.equal(r.head(), head, 'nothing committed');
  a.act('ask', '0001', 'The button is cut off on a phone: keep it?', '--saw=The Save button is cut off at 375 px', '--why=It doesn\'t fully pass');
  assert.ok(r.ticket().includes(`asked you: The button is cut off on a phone: keep it?. Checked in the app: ${CHECK}. Saw: The Save button is cut off at 375 px. Why: It doesn't fully pass`), r.ticket());
  assert.deepEqual(readActions(r.runs).map(x => x.action), ['ask']);
});

test('0636 AC2: a check is refused once the question has changed during it, even with the same recommendation', () => {
  for (const change of [s => s.replace(CHECK, 'Look at the Cancel button instead'), s => s.replace('Should the old test', 'Should the new test'), s => s.replace(/^status: blocked$/m, 'status: building')]) {
    const { r, a } = checking();
    a.check();
    fs.writeFileSync(r.file, change(r.ticket())); r.g('commit', '-qam', 'changed');
    const head = r.head(), ticket = r.ticket();
    for (const act of [['decide', '0001', OPTION], ['ask', '0001', 'Keep it?']])
      assert.throws(() => a.act(...act, `--saw=${SAW}`, '--why=x'), /changed since|no longer blocked/);
    assert.equal(r.head(), head);
    assert.equal(r.ticket(), ticket);
    assert.deepEqual(readActions(r.runs), []);
  }
});

test('0636 AC2: such a question is never taken unchecked by speck run\'s check', () => {
  const t = blocked();
  assert.equal(decidable(t), false);
  assert.equal(fixable(t), false);
  const said = [];
  foremanFixQueue({ repo: '/nowhere', readConfig: () => ({ watch: 'decide' }), goWith: () => { throw new Error('taken'); }, say: m => said.push(m) }).check([t]);
  assert.equal(t.status, 'blocked');
});

test('0636 AC3: with watch: fix the agent is started, may go with the recommendation, and its brief says only when the check clearly passes', () => {
  const { r, a } = checking({ watch: 'fix' });
  a.check();
  assert.equal(a.starts.length, 1);
  assert.match(a.starts[0].brief, /only when the check clearly passes/);
  a.act('decide', '0001', OPTION, `--saw=${SAW}`, '--why=It clearly passes');
  assert.ok(r.ticket().includes(`(chosen by speck, as watch is fix, 2026-11-11 14:00 UTC). Checked in the app: ${CHECK}.`), r.ticket());
  a.end(); a.check(blocked({ status: 'building' }));
  assert.equal(a.resumed.length, 1, 'its build is resumed');
  assert.ok(a.resumed[0].argv.some(w => w.includes('speck (watch: fix)') && w.includes(OPTION)), a.resumed[0].argv.join(' '));
});

test('0636 AC4: once the agent has ended, speck run stops the app, whatever it did', async () => {
  const { r, a } = checking();
  a.check();
  a.end(); a.check();
  assert.equal(readAgentState(r.runs).running, null);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(a.stopped, ['0001']);
  assert.ok(a.said.some(l => /stopped the app I started/.test(l)), a.said.join('\n'));
});

test('0636 AC4: the review pack lists the screenshots it kept, with their captions', () => {
  const r = blockedRepo({ question: ASKED });
  const file = path.join(r.dir, '..', 'shot.png');
  fs.writeFileSync(file, PNG);
  addPicture(r.dir, '0001', file, 'Settings, Save button, dark look');
  assert.ok(picturesLines(r.dir, '0001').some(l => l.startsWith('- Settings, Save button, dark look: ')));
});

for (const [name, o] of [['watch: tell', { watch: 'tell' }], ['watch: off', { watch: 'off' }], ['high risk', { risk: 'high' }]]) // 0638: commands.start blank no longer stops it
  test(`0636 AC5: with ${name}, the question waits for you`, () => {
    const { a } = checking(o);
    a.check();
    assert.equal(a.starts.length, 0);
  });

test('0636 AC2: a check run\'s Claude Code may use a browser; other runs may not', () => {
  assert.ok(!foremanArgv({}, 'brief', undefined, []).includes('mcp__playwright'));
  assert.ok(foremanArgv({}, 'brief', undefined, [], true).includes('mcp__playwright'));
});

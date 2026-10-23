import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { T, fakePage, queueRows, round } from './support/panel.mjs';
import { CLI, commandRepo, reviewRepo, changesVerdict, approveVerdict, skillText } from './support/speck.mjs';
import { statusData } from '../scripts/speck.mjs';

// ---------- 0223: say which review round is running ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const asked = n => ({ ...round(n, 10), verdict: 'changes_requested' });
const reviewing = (id, o) => T(id, 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', builder: 'claude', reviewer: 'codex', ...o });

function fake(tickets) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const find = (p, row, re) => p.all(row).filter(n => re.test(n.className || ''));
const say = (p, id) => find(p, rowOf(p, id), /\bsay\b/)[0].textContent;
const stage = (p, id) => find(p, rowOf(p, id), /^stage\b/)[0]?.textContent;

test('0223 AC1: while a round is running, the card names the round being run: 1 for the first, otherwise the last recorded plus one', async () => {
  const p = fake([
    reviewing('0601', { review_running: 1 }),
    reviewing('0602', { rounds: [asked(1)], review_running: 2 }),
    reviewing('0603', { rounds: [asked(1), asked(2)], review_running: 3, reviewer: 'fake' }),
  ]);
  await p.settle();
  assert.equal(say(p, '0601'), 'Codex is reviewing · round 1');
  assert.equal(say(p, '0602'), 'Codex is reviewing · round 2');
  assert.equal(say(p, '0603'), 'Fake is reviewing · round 3');
});

test('0223 AC2: while no round is running, the card says the builder is fixing the last recorded round\'s findings', async () => {
  const p = fake([
    reviewing('0611', { rounds: [asked(1)], review_running: null }),
    reviewing('0612', { rounds: [asked(1), asked(2)], review_running: null, builder: 'codex', reviewer: 'claude-subagent' }),
    reviewing('0613', { rounds: [asked(1)], review_running: null, builder: '' }),
  ]);
  await p.settle();
  assert.equal(say(p, '0611'), "Claude is fixing round 1's findings");
  assert.equal(say(p, '0612'), "Codex is fixing round 2's findings");
  assert.equal(say(p, '0613'), "The builder is fixing round 1's findings");
});

test('0223 AC4: the stage name still uses the last recorded round, whether or not a round is running', async () => {
  const p = fake([
    reviewing('0621', { rounds: [asked(1)], review_running: 2 }),
    reviewing('0622', { rounds: [asked(1)], review_running: null }),
  ]);
  await p.settle();
  assert.equal(stage(p, '0621'), 'Review 1');
  assert.equal(stage(p, '0622'), 'Review 1');
});

// A reviewer command that, while it runs, saves what `speck status --json` says, then answers as FAKE_MODE says.
function snapReviewer() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0223-')), 'snap-reviewer');
  fs.writeFileSync(file, `#!${process.execPath}
const fs = require('fs');
fs.readFileSync(0, 'utf8');
const r = require('child_process').spawnSync(process.execPath, [${JSON.stringify(CLI)}, 'status', '--json'], { encoding: 'utf8' });
fs.writeFileSync(process.env.SNAP, r.stdout);
if (process.env.FAKE_MODE === 'fail') process.exit(3);
if (process.env.FAKE_MODE === 'hang') setInterval(() => {}, 1e6);
else console.log(process.env.FAKE_VERDICT);
`, { mode: 0o755 });
  return file;
}
const one = data => data.tickets.find(t => t.id === '0001');
const runsIn = dir => path.join(dir, 'speck', '.cache', 'runs');

test('0223 AC1, AC3: speck review records the round as running while the reviewer runs, and not once it has ended', () => {
  const r = commandRepo({ command: snapReviewer(), ticketFields: 'status: building' });
  const snap = path.join(r.dir, '..', `snap-${path.basename(r.dir)}.json`);
  assert.equal(one(statusData(r.dir)).review_running, null, 'nothing running before the first round');
  let res = r.runEnv({ SNAP: snap, FAKE_VERDICT: JSON.stringify(changesVerdict) }, 'review', '1');
  assert.equal(res.status, 10, res.stderr);
  assert.equal(one(JSON.parse(fs.readFileSync(snap, 'utf8'))).review_running, 1, 'round 1 is running while its reviewer runs');
  assert.equal(one(statusData(r.dir)).review_running, null, 'round 1 has ended');
  assert.equal(one(statusData(r.dir)).status, 'reviewing');
  res = r.runEnv({ SNAP: snap, FAKE_VERDICT: JSON.stringify({ ...approveVerdict }) }, 'review', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(one(JSON.parse(fs.readFileSync(snap, 'utf8'))).review_running, 2, 'round 2 is the last recorded plus one');
  assert.equal(one(statusData(r.dir)).review_running, null);
  assert.deepEqual(fs.readdirSync(runsIn(r.dir)).filter(f => /review/.test(f)), [], 'no record left behind');
});

test('0223 AC3: a round that fails or times out no longer counts as running', () => {
  const failed = commandRepo({ command: snapReviewer(), ticketFields: 'status: building' });
  const snap = path.join(failed.dir, '..', `snap-${path.basename(failed.dir)}.json`);
  let res = failed.runEnv({ SNAP: snap, FAKE_MODE: 'fail' }, 'review', '1');
  assert.equal(res.status, 1, res.stderr);
  assert.equal(one(JSON.parse(fs.readFileSync(snap, 'utf8'))).review_running, 1);
  assert.equal(one(statusData(failed.dir)).review_running, null, 'a failed round has ended');

  const slow = commandRepo({ command: snapReviewer(), ticketFields: 'status: building' });
  const snap2 = path.join(slow.dir, '..', `snap-${path.basename(slow.dir)}.json`);
  res = slow.runEnv({ SNAP: snap2, FAKE_MODE: 'hang', SPECK_REVIEW_TIMEOUT_MS: '3000' }, 'review', '1');
  assert.equal(res.status, 1, res.stderr);
  assert.match(res.stderr, /took longer than/);
  assert.equal(one(statusData(slow.dir)).review_running, null, 'a round that timed out has ended');
});

test('0223 AC3: the running round is read from disk, so a fresh read (a reload or a panel restart) shows it, and a stale record does not count', async () => {
  const r = commandRepo({ command: snapReviewer(), ticketFields: 'status: building' });
  const runs = runsIn(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  const rec = path.join(runs, '0001.review.json');
  // A speck review still running: this test's own process stands in for it.
  fs.writeFileSync(rec, JSON.stringify({ id: '0001', round: 1, pid: process.pid, started: ago(5) }));
  assert.equal(one(statusData(r.dir)).review_running, 1);
  const again = spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8' });
  assert.equal(one(JSON.parse(again.stdout)).review_running, 1, 'a new process reads the same');

  // The speck review that wrote it was killed: its process has gone.
  const gone = spawn(process.execPath, ['-e', '']);
  await new Promise(resolve => gone.on('exit', resolve));
  fs.writeFileSync(rec, JSON.stringify({ id: '0001', round: 1, pid: gone.pid, started: ago(5) }));
  assert.equal(one(statusData(r.dir)).review_running, null, 'a dead process isn\'t running a round');

  // A round already recorded isn't running, nor is a record that makes no sense.
  r.runEnv({ SNAP: path.join(r.dir, '..', `snap-${path.basename(r.dir)}.json`), FAKE_VERDICT: JSON.stringify(changesVerdict) }, 'review', '1');
  for (const bad of [{ round: 1, pid: process.pid }, { round: 'x', pid: process.pid }, { round: 2, pid: 'x' }, [], 'nope', '{']) {
    fs.writeFileSync(rec, typeof bad === 'string' ? bad : JSON.stringify(bad));
    assert.equal(one(statusData(r.dir)).review_running, null, JSON.stringify(bad));
  }
});

test('0223 AC3: a records folder that can\'t be written doesn\'t stop the round', () => {
  const r = commandRepo({ command: snapReviewer(), ticketFields: 'status: building' });
  fs.mkdirSync(path.join(r.dir, 'speck', '.cache'), { recursive: true });
  fs.writeFileSync(runsIn(r.dir), 'not a folder');
  const res = r.runEnv({ SNAP: path.join(r.dir, '..', `snap-${path.basename(r.dir)}.json`), FAKE_VERDICT: JSON.stringify(changesVerdict) }, 'review', '1');
  assert.equal(res.status, 10, res.stderr);
  assert.equal(r.roundFile(1).verdict.verdict, 'changes_requested');
});

// ---------- a reviewer subagent, which runs in the builder's own session ----------

const subagent = () => reviewRepo({ config: 'allow_same_model_review: true\n', ticketFields: 'reviewer: claude-subagent\nstatus: building' });
const verdictFile = (r, v) => { const f = path.join(r.dir, '..', `verdict-${path.basename(r.dir)}.json`); fs.writeFileSync(f, JSON.stringify(v)); return f; };

test('0223 AC1, AC3: a subagent\'s round counts as running from speck review-running until speck record records it', () => {
  const r = subagent();
  let res = r.run('review-running', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Round 1 of 0001 is shown as running/);
  assert.equal(one(statusData(r.dir)).review_running, 1);
  res = r.run('record', '1', verdictFile(r, changesVerdict), '--reviewer=claude-subagent');
  assert.equal(res.status, 10, res.stderr);
  assert.equal(one(statusData(r.dir)).review_running, null, 'recorded: the builder is fixing its findings');
  assert.equal(r.run('review-running', '1').status, 0);
  assert.equal(one(statusData(r.dir)).review_running, 2, 'the last recorded round plus one');
});

test('0223 AC1: the card of a building ticket whose first round a subagent is running says the reviewer is reviewing round 1', async () => {
  const r = subagent();
  assert.equal(r.run('review-running', '1').status, 0);
  const t = one(statusData(r.dir));
  assert.equal(t.status, 'building', 'speck record sets it to reviewing, not speck review-running');
  const p = fake([{ ...t, started: ago(65), build_running: true, self_check: 'no changes' }]);
  await p.settle();
  assert.equal(say(p, '0001'), 'Claude-subagent is reviewing · round 1');
});

test('0223 AC3: a subagent\'s round given up on, or whose build has gone, stops counting; a long one that is still going keeps counting', async () => {
  const r = subagent();
  const runs = runsIn(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  // A build speck run started: this test's own process stands in for it, and lives on after the subagent fails.
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ id: '0001', session: 's', pid: process.pid, started: ago(60) }));
  assert.equal(r.run('review-running', '1').status, 0);
  const rec = path.join(runs, '0001.review.json');
  assert.equal(JSON.parse(fs.readFileSync(rec, 'utf8')).build_pid, process.pid);
  // Running for longer than review_timeout_minutes (30) still counts: nothing ends a subagent for taking long.
  fs.writeFileSync(rec, JSON.stringify({ ...JSON.parse(fs.readFileSync(rec, 'utf8')), started: ago(120 * 60) }));
  assert.equal(one(statusData(r.dir)).review_running, 1);
  const res = r.run('review-running', '1', '--ended');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /No review round of 0001 is shown as running/);
  assert.equal(one(statusData(r.dir)).review_running, null, 'given up on while the builder lives on');

  assert.equal(r.run('review-running', '1').status, 0);
  const gone = spawn(process.execPath, ['-e', '']);
  await new Promise(resolve => gone.on('exit', resolve));
  fs.writeFileSync(rec, JSON.stringify({ ...JSON.parse(fs.readFileSync(rec, 'utf8')), build_pid: gone.pid }));
  assert.equal(one(statusData(r.dir)).review_running, null, 'the build was killed');

  fs.rmSync(path.join(runs, '0001.json'));
  assert.equal(r.run('review-running', '1').status, 0);
  assert.equal(one(statusData(r.dir)).review_running, 1, 'a build not started by speck run counts until it is recorded or ended');
});

test('0223 AC1, AC3: the review skill has the builder run speck review-running before each subagent round, and end one given up on', () => {
  const text = skillText('speck-review');
  assert.match(text, /Run `speck review-running <id>`[^\n]*`speck review-running <id> --ended`[^\n]*Then spawn a fresh subagent/);
  assert.match(text, /\*\*claude-subagent:\*\* run `speck review-running <id>` \(and `speck review-running <id> --ended` if you give up on the round\), then use SendMessage/);
});

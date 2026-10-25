import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { shipRepo, env, gIn, BRANCH } from './support/ship.mjs';
import { speck } from './support/cli.mjs';
import { filesNaming } from './support/private-words.mjs';
import { tildePaths } from '../scripts/private-words.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { handBackMessage } from '../scripts/hand-back.mjs';

// ---------- 0506: keep private words and the home folder's path out of what speck writes under speck/ ----------

// A fake home folder, with a private-words file holding `words` (none when null).
function fakeHome(words = null) {
  const home = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0506-'))), 'home', 'ann');
  fs.mkdirSync(home, { recursive: true });
  if (words !== null) {
    fs.mkdirSync(path.join(home, '.config', 'speck'), { recursive: true });
    fs.writeFileSync(path.join(home, '.config', 'speck', 'private-words'), words);
  }
  return { home, env: { ...env, HOME: home, USERPROFILE: home } };
}

const TICKET = 'speck/tickets/0001-export-bookings.md';

test('0506 AC1: a path under the home folder is written as a ~/ path, and only one standing on its own', () => {
  const home = '/home/ann';
  assert.equal(tildePaths(`see ${home}/projects/app/outputs/tests/README.md`, home), 'see ~/projects/app/outputs/tests/README.md');
  assert.equal(tildePaths(`in ${home}.`, home), 'in ~.');
  assert.equal(tildePaths(`${home}2/x /mnt${home}/x ${home}.git`, home), `${home}2/x /mnt${home}/x ${home}.git`);
  assert.equal(tildePaths(`${home}/a and ${home}/b`, home), '~/a and ~/b');
  assert.equal(tildePaths(`${home}/a`, ''), `${home}/a`, 'no home folder: nothing changes');
});

test('0506 AC1: a review round\'s verdict, findings and evidence, the notes, self-check and logs are written with ~/ paths', () => {
  const { home, env: e } = fakeHome();
  const r = shipRepo();
  const file = path.join(r.wt, TICKET);
  const evidence = `${home}/projects/app/outputs/tests/README.md`;
  // Back to reviewing, with a home path in the notes and self-check the builder wrote.
  const text = fs.readFileSync(file, 'utf8').replace(/^status: approved/m, 'status: reviewing')
    .replace('## Out of scope', `## Notes\n- Self-check: looked at ${home}/projects/app/a.mjs\n\n## Out of scope`)
    + `\n## Review log\n\n## Delivery log\n- Checked ${home}/projects/app\n`;
  fs.writeFileSync(file, text);
  gIn(r.wt, 'commit', '-qam', 'reviewing');
  const verdict = { verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence }], summary: `Read ${evidence}.`,
    findings: [{ id: 'F1', severity: 'minor', state: 'open', issue: `Odd line in ${evidence}.`, evidence: `${home}/x.md:3` }], escalation_question: '' };
  const v = path.join(os.tmpdir(), 'speck-0506-verdict.json');
  fs.writeFileSync(v, JSON.stringify(verdict));
  assert.equal(speck(r.wt, e, 'record', '1', v).status, 0);
  const saved = fs.readFileSync(file, 'utf8');
  assert.ok(saved.includes('~/projects/app/outputs/tests/README.md'), 'the evidence has a ~/ path');
  assert.ok(saved.includes('~/x.md:3'));
  assert.ok(!saved.includes(home), 'no home folder path is left in the round');
  gIn(r.wt, 'commit', '-qam', 'round');
  const closed = speck(r.wt, e, 'close', '1');
  assert.equal(closed.status, 0, closed.stdout + closed.stderr);
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(!after.includes(home), 'no home folder path is left after close');
  assert.match(after, /Self-check: looked at ~\/projects\/app\/a\.mjs/);
  assert.match(after, /- Checked ~\/projects\/app$/m);
});

// The ticket on its branch with `lines` added to its notes, committed.
function withNotes(r, lines) {
  const file = path.join(r.wt, TICKET);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('## Review rounds', `## Notes\n${lines.join('\n')}\n\n## Review rounds`));
  gIn(r.wt, 'commit', '-qam', 'notes');
  return fs.readFileSync(file, 'utf8').split('\n');
}

test('0506 AC2: speck ship refuses, changing nothing, when a file under speck/ holds a private word or the home folder path', () => {
  const { home, env: e } = fakeHome('# mine\nZorblax\n');
  const r = shipRepo();
  const lines = withNotes(r, ['- Written by zorBLAX.', `- Looked in ${home}/projects/app.`]);
  const before = r.snapshot();
  const out = speck(r.dir, e, 'ship', '1');
  assert.equal(out.status, 17, out.stdout + out.stderr);
  const msg = out.stdout + out.stderr;
  const wordLine = lines.findIndex(l => l.includes('zorBLAX')) + 1, homeLine = lines.findIndex(l => l.includes(home)) + 1;
  assert.match(msg, new RegExp(`${TICKET} line ${wordLine}\\b`));
  assert.match(msg, new RegExp(`${TICKET} line ${homeLine}\\b`));
  assert.doesNotMatch(msg, /zorblax/i, 'the word isn\'t repeated');
  assert.match(msg, /[Tt]ake each one out/);
  assert.deepEqual(r.snapshot(), before, 'nothing changed');
});

test('0506 AC2: without a private-words file, ship checks only the home folder path', () => {
  const { home, env: e } = fakeHome();
  const r = shipRepo();
  withNotes(r, ['- Written by zorblax.', `- Looked in ${home}.`]);
  const out = speck(r.dir, e, 'ship', '1');
  assert.equal(out.status, 17, out.stdout + out.stderr);
  assert.match(out.stdout + out.stderr, /home folder's path/);
  assert.doesNotMatch(out.stdout + out.stderr, /private words \(from/);
});

test('0506 AC3: the ship queue hands a ticket refused for private words back to its build, with the message', () => {
  const r = shipRepo();
  const launches = [], backs = [], stuck = [];
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: () => {}, launch: (repo, id, log, done) => { fs.writeFileSync(log, 'Files under speck/ hold your private words\nTake each one out.\n'); launches.push(done); }, handBack: h => backs.push(h), stuck: s => stuck.push(s) });
  q.check([{ id: '0001', status: 'approved', auto_ship: true, type: '', approved: '2026-10-25T10:00:00.000Z', build_running: false }]);
  launches[0](17);
  assert.equal(backs.length, 1);
  assert.equal(backs[0].kind, 'private');
  assert.match(backs[0].why, /Take each one out/);
  assert.deepEqual(stuck, [], 'not left for the Foreman');
  const m = handBackMessage({ id: '0001', kind: 'private', why: backs[0].why, base: 'main', count: 1 });
  assert.match(m, /"Private words" steps in section 5 of \/speck-build for 0001/);
  assert.match(m, /speck ship said: Take each one out/);
});

test('0506 AC4: a ship whose speck/ files hold neither ships as before', () => {
  const { env: e } = fakeHome('zorblax\n');
  const r = shipRepo();
  withNotes(r, ['- Looked in ~/projects/app.']);
  const out = speck(r.dir, e, 'ship', '1');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.equal(r.statusIn(r.dir), 'done');
  assert.equal(gIn(r.dir, 'branch', '--list', BRANCH).stdout.trim(), '');
});

test('0506 AC4: the repo\'s private-words test still skips speck/', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0506-grep-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'a.md'), 'zorblax\n');
  fs.writeFileSync(path.join(dir, 'b.md'), 'Zorblax\n');
  gIn(dir, 'add', '-A');
  assert.deepEqual(filesNaming(['zorblax'], dir), ['b.md']);
});

test('0506 AC3: the build skill has "Private words" steps for exit 17, and the brief names the refusal\'s exit code and file', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const skill = fs.readFileSync(path.join(root, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  assert.match(skill, /\(exited 17\): follow "Private words"/);
  assert.match(skill, /^### Private words$/m);
  const brief = fs.readFileSync(path.join(root, 'docs', 'brief.md'), 'utf8');
  assert.ok(brief.includes('`~/.config/speck/private-words`'));
  assert.match(brief, /exit 17/);
});

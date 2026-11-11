// 0633: speck takes the user's private words out of a review round as it saves it, so a ship isn't refused for one.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { commandRepo, subagentRepo, approveVerdict, gitEnv } from './support/speck.mjs';
import { ticketRounds } from '../scripts/core.mjs';
import { redactPrivateWords } from '../scripts/private-words.mjs';

Object.assign(process.env, gitEnv);

const homeWith = (words) => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0633-home-'));
  fs.mkdirSync(path.join(h, '.config', 'speck'), { recursive: true });
  if (words) fs.writeFileSync(path.join(h, '.config', 'speck', 'private-words'), `# my words\n${words.join('\n')}\n`);
  return h;
};
const roundsOf = r => ticketRounds(fs.readFileSync(r.ticketFile, 'utf8')).rounds;

// An approval whose evidence and summary quote private words in mixed case.
const quoting = {
  ...approveVerdict,
  criteria: [{ id: 1, status: 'pass', evidence: 'The page greets Zorblat and ZORBLAT\'s team.' }],
  findings: [{ id: 'F1', severity: 'minor', file: 'zorblat/a.md', issue: 'Names Quux Corp', suggested_fix: 'drop quux corp', state: 'open' }],
  summary: 'Fine for zorblat.',
};
const redacted = {
  ...approveVerdict,
  criteria: [{ id: 1, status: 'pass', evidence: 'The page greets [private] and [private]\'s team.' }],
  findings: [{ id: 'F1', severity: 'minor', file: '[private]/a.md', issue: 'Names [private]', suggested_fix: 'drop [private]', state: 'open' }],
  summary: 'Fine for [private].',
};
const WORDS = ['zorblat', 'Quux Corp'];

// Turns auto_ship on for every risk, with a test command that passes, and commits it on the ticket's branch.
function autoShipOn(r) {
  const file = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8')
    .replace(/^auto_ship: .*$/m, 'auto_ship: true').replace(/^auto_ship_risk: .*$/m, 'auto_ship_risk: [low, high]')
    .replace(/^  test: .*$/m, '  test: "true"'));
  r.git('add', '-A'); r.git('commit', '-qm', 'auto ship on');
}

test('0633 AC1: redactPrivateWords replaces each word in any case in every string, leaving the rest as it was', () => {
  const words = ['zorblat', 'quux corp'];
  const rec = { meta: { round: 1, reviewer: 'codex', seconds: 3, ok: true, none: null }, verdict: quoting };
  const out = redactPrivateWords(rec, words);
  assert.deepEqual(out.verdict, redacted);
  assert.deepEqual(out.meta, rec.meta);
  assert.equal(quoting.summary, 'Fine for zorblat.', 'the input is left as it was');
  assert.deepEqual(redactPrivateWords(rec, []), rec, 'no words: unchanged');
  assert.equal(redactPrivateWords('a.b and A.B and axb', ['a.b']), '[private] and [private] and axb', 'a word is matched as written, not as a pattern');
  assert.equal(redactPrivateWords('ann joanne', ['ann', 'joanne']), '[private] [private]', 'a longer word is taken out whole');
  const proto = JSON.parse('{"__proto__": "zorblat", "constructor": "Zorblat"}');
  const p = redactPrivateWords(proto, words);
  assert.deepEqual(Object.entries(p), [['__proto__', '[private]'], ['constructor', '[private]']]);
  assert.deepEqual(redactPrivateWords({ verdict: 'approve', summary: 'I approve' }, ['approve'], ['verdict']), { verdict: 'approve', summary: 'I [private]' }, 'a kept field stays as it is');
});

test('0633 AC1: speck review saves a round with each private word replaced by [private], and the rest as the reviewer wrote it', () => {
  const r = commandRepo();
  const home = homeWith(WORDS);
  const said = path.join(home, 'response.md');
  fs.writeFileSync(said, 'Fixed what Zorblat asked for.\n');
  const out = r.runEnv({ HOME: home, FAKE_VERDICT: JSON.stringify(quoting) }, 'review', '1', `--response=${said}`);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  const last = roundsOf(r).at(-1);
  assert.deepEqual(last.verdict, { ...redacted, round: 1 });
  assert.match(last.meta.builder_response, /Fixed what \[private\] asked for\./);
  assert.equal(last.meta.reviewer, 'fake', 'speck\'s own fields stay as they are');
  assert.doesNotMatch(fs.readFileSync(r.ticketFile, 'utf8'), /zorblat|quux corp/i);
});

test('0633 AC1: speck record saves a round with each private word replaced by [private]', () => {
  const r = subagentRepo();
  const v = path.join(r.dir, '..', `verdict-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(quoting));
  const out = r.runEnv({ HOME: homeWith(WORDS) }, 'record', '1', v);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.deepEqual(roundsOf(r).at(-1).verdict, { ...redacted, round: 1 });
  assert.doesNotMatch(fs.readFileSync(r.ticketFile, 'utf8'), /zorblat|quux corp/i);
});

test('0633 AC2: a ticket whose only private words were in its review round ships with speck ship --auto, with no exit 17', () => {
  const r = commandRepo();
  autoShipOn(r);
  const env = { HOME: homeWith(WORDS) };
  const rev = r.runEnv({ ...env, FAKE_VERDICT: JSON.stringify(quoting) }, 'review', '1');
  assert.equal(rev.status, 0, rev.stdout + rev.stderr);
  assert.equal(r.runEnv(env, 'set', '1', 'status', 'approved').status, 0);
  r.git('add', '-A'); r.git('commit', '-qm', 'approved');
  const out = r.runEnv(env, 'ship', '1', '--auto');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.ok(fs.readdirSync(path.join(r.dir, 'speck', 'tickets', 'done')).some(n => n.startsWith('0001-')), 'shipped and filed as done');
});

test('0633 AC3: without a private-words file, a round is saved as the reviewer wrote it', () => {
  const r = commandRepo();
  const out = r.runEnv({ HOME: homeWith(null), FAKE_VERDICT: JSON.stringify(quoting) }, 'review', '1');
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.deepEqual(roundsOf(r).at(-1).verdict, { ...quoting, round: 1 });
});

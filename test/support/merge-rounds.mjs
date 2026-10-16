// An approved ticket in its own worktree with a fake command reviewer, for the tests on merge rounds (0097, 0241).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { shipRepo, runIn, gIn, env } from './ship.mjs';
import { speck } from './cli.mjs';
import { ticketRounds } from '../../scripts/core.mjs';

export const TICKET = 'speck/tickets/0001-export-bookings.md';
export const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
export const verdict = (v, findings = []) => ({ verdict: v, criteria: [{ id: 1, status: v === 'approve' ? 'pass' : 'fail', evidence: 'e' }], findings, summary: 's', escalation_question: '' });

// An approved ticket (one ordinary round) in its own worktree, with max_review_rounds set to 1 there, and a fake
// command reviewer "fake" that answers with FAKE_VERDICT, and saves its prompt to FAKE_PROMPT when that's set.
// main then changes shared.txt, as the ticket does.
export function mergeRepo() {
  const r = shipRepo();
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-fake-'));
  const fake = path.join(bin, 'fake-reviewer');
  fs.writeFileSync(fake, `#!${process.execPath}\nconst p = require('fs').readFileSync(0, 'utf8');\nif (process.env.FAKE_PROMPT) require('fs').writeFileSync(process.env.FAKE_PROMPT, p);\nconsole.log(process.env.FAKE_VERDICT);\n`, { mode: 0o755 });
  const cfgFile = path.join(r.wt, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, read(r.wt, 'speck/config.yml').replace('reviewer_options:\n', `reviewer_options:\n  fake:\n    command: ${JSON.stringify(fake)}\n`));
  assert.equal(runIn(r.wt, 'config', 'set', 'limits.max_review_rounds', '1').status, 0);
  fs.writeFileSync(path.join(r.wt, TICKET), read(r.wt, TICKET).replace(/^reviewer: .*$/m, 'reviewer: fake')
    .replace(/^## Review rounds$/m, '## Review log\n\n## Delivery log\n\n## Review rounds'));
  gIn(r.wt, 'commit', '-qam', 'one round only, fake reviewer');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side\n');
  r.g('commit', '-qam', 'main moves on');
  const mergeMain = () => {
    gIn(r.wt, 'merge', '-q', 'main');
    fs.writeFileSync(path.join(r.wt, 'shared.txt'), 'feature\nmain side\n');
    gIn(r.wt, 'add', 'shared.txt');
    assert.equal(gIn(r.wt, 'commit', '-q', '--no-edit').status, 0);
  };
  const work = (text = 'more\n') => {
    fs.appendFileSync(path.join(r.wt, 'notes.txt'), text);
    gIn(r.wt, 'commit', '-qam', 'work');
  };
  const vfile = path.join(bin, 'verdict.json');
  const record = v => { fs.writeFileSync(vfile, JSON.stringify(verdict(v))); return runIn(r.wt, 'record', '1', vfile); };
  const next = () => runIn(r.wt, 'next', '1').stdout.trim();
  const saved = () => ticketRounds(read(r.wt, TICKET)).rounds;
  return { ...r, bin, mergeMain, work, record, next, saved };
}

// Runs `speck review` with the fake reviewer answering `v`. `extra` adds to its environment.
export function spawnReview(wt, v, extra = {}) {
  return speck(wt, { ...env, FAKE_VERDICT: JSON.stringify(verdict(v)), ...extra }, 'review', '1');
}

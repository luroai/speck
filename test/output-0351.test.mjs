// 0351: a document task names its folder inside outputs/, and outputs/ is kept out of git.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseTicket, lintTicket } from '../scripts/speck.mjs';
import { ignoreOutputs } from '../scripts/install.mjs';
import { fm, good } from './support/panel.mjs';
import { CLI, env } from './support/run.mjs';

const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };
const lintRaw = head => lintTicket(parseTicket(`---\n${head}\n---\n${good}`), cfg).errors;
const outputErrors = head => lintRaw(head).filter(e => /\boutput\b/.test(e));
const doc = output => `${fm({ task: 'document' })}${output === undefined ? '' : `\noutput: ${output}`}`;

test('0351 AC1: lint errors on a document task with a missing or blank output, naming the field', () => {
  for (const o of [undefined, '""', "''", '', '"   "', '   # a comment']) {
    const errors = outputErrors(doc(o));
    assert.equal(errors.length, 1, `output ${JSON.stringify(o)}: one error, got ${JSON.stringify(errors)}`);
    assert.match(errors[0], /\boutput\b/);
  }
});

test('0351 AC1: a code ticket needs no output', () => {
  for (const head of [fm({}), fm({ task: 'code' }), fm({ task: '""' }), `${fm({ task: 'code' })}\noutput: ""`])
    assert.deepEqual(outputErrors(head), [], head);
});

test('0351 AC2: lint errors on an absolute output or one leading outside outputs/', () => {
  for (const bad of ['/tmp/x', '"/tmp/x"', '../x', 'a/../../x', '..', '"C:/x"', '"C:\\\\x"', '"\\\\x"', '"a\\\\..\\\\..\\\\x"', '.', './', 'a/..', '[a]', '{}', '3', 'true']) {
    const errors = outputErrors(doc(bad));
    assert.equal(errors.length, 1, `output ${bad}: one error, got ${JSON.stringify(errors)}`);
    assert.match(errors[0], /outputs\//, `output ${bad}: says it's relative to outputs/`);
  }
});

test('0351 AC2: lint accepts nested folders and a single name inside outputs/', () => {
  for (const ok of ['strategy-2027/pricing/', 'emails', '"emails"', 'emails/', 'a/./b', 'a/../b', 'constructor', '__proto__', 'emails   # the newsletter'])
    assert.deepEqual(outputErrors(doc(ok)), [], ok);
});

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
const lines = dir => fs.readFileSync(path.join(dir, '.gitignore'), 'utf8').split('\n');

test('0351 AC3: ignoreOutputs makes a .gitignore with /outputs/ when there is none', () => {
  const dir = tmp();
  ignoreOutputs(dir);
  assert.deepEqual(lines(dir), ['/outputs/', '']);
});

test('0351 AC3: ignoreOutputs adds /outputs/ to an existing .gitignore once, keeping what was there', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n.env'); // no newline at the end
  ignoreOutputs(dir);
  ignoreOutputs(dir);
  assert.deepEqual(lines(dir), ['node_modules/', '.env', '/outputs/', '']);
});

test('0351 AC3: ignoreOutputs leaves an existing /outputs/ or outputs/ line as it is', () => {
  for (const text of ['/outputs/\n', 'a\noutputs/\nb\n', 'a\r\noutputs/\r\n', 'x\n  /outputs/  \n']) {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, '.gitignore'), text);
    ignoreOutputs(dir);
    assert.equal(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8'), text, JSON.stringify(text));
  }
});

test('0351 AC3: speck init adds /outputs/ to the root .gitignore, and a second init adds no second line', () => {
  const dir = tmp();
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env });
  for (let i = 0; i < 2; i++) {
    const res = spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8', env });
    assert.equal(res.status, 0, res.stderr);
  }
  assert.equal(lines(dir).filter(l => l === '/outputs/').length, 1);
  const check = spawnSync('git', ['check-ignore', '-q', 'outputs/strategy-2027/pricing/a.md'], { cwd: dir, env });
  assert.equal(check.status, 0, 'git ignores a file inside outputs/');
});

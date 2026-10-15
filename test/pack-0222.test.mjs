// 0222: the plain pack says when the reviewer couldn't see the rest of the code in a review round.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { plainPack, reviewPack } from '../scripts/pack.mjs';
import { shipRepo } from './support/speck.mjs';

const SENTENCE = 'In at least one review round, the reviewer could only see the change itself, not the rest of the code.';
const BLIND = 'Reviewer could not inspect the repo';

// shipRepo's approved ticket with one review round for each entry of `sandbox`: its round's sandbox_ok, or
// undefined to leave it out, as a round recorded before speck kept it does.
function packs(sandbox) {
  const r = shipRepo({ worktree: false });
  const file = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf('<details>');
  const block = text.slice(start, text.indexOf('</details>') + '</details>'.length);
  const rounds = sandbox.map((ok, i) => block.replace('Round 1', `Round ${i + 1}`)
    .replace('"round": 1,', `"round": ${i + 1},`).replace('"round": 1\n', `"round": ${i + 1}\n`)
    .replace('"reviewer": "claude-subagent"', `"reviewer": "codex"${ok === undefined ? '' : `,\n    "sandbox_ok": ${ok}`}`));
  fs.writeFileSync(file, text.slice(0, start) + rounds.join('\n\n') + '\n');
  return { plain: plainPack(r.dir, '1'), full: reviewPack(r.dir, '1') };
}
const count = (s, part) => s.split(part).length - 1;

test('0222 AC1: when a round was done without the reviewer seeing the repo, the plain pack says so', () => {
  for (const sandbox of [[false], [false, true], [true, false, undefined]]) {
    const { plain, full } = packs(sandbox);
    assert.ok(full.includes(BLIND), `the full pack marks it for ${JSON.stringify(sandbox)}`);
    assert.ok(plain.includes(SENTENCE), `the plain pack says so for ${JSON.stringify(sandbox)}\n---\n${plain}`);
  }
});

test('0222 AC2: the sentence appears once however many rounds were blind, and not when none was', () => {
  assert.equal(count(packs([false, false, false]).plain, SENTENCE), 1);
  assert.equal(count(packs([false, true, false]).plain, SENTENCE), 1);
  for (const sandbox of [[true], [true, true], [undefined], [undefined, true]]) {
    const { plain, full } = packs(sandbox);
    assert.ok(!full.includes(BLIND), `the full pack doesn't mark it for ${JSON.stringify(sandbox)}`);
    assert.equal(count(plain, SENTENCE), 0, `no sentence for ${JSON.stringify(sandbox)}`);
  }
});

test('0222 AC2: the sentence uses none of the words the plain pack keeps for its one risk sentence', () => {
  assert.doesNotMatch(SENTENCE, /risk|sensitive|closer look/i);
});

// 0553: the review pack's and the delivery log's Reviewer tokens, counted as each round saved them, as the panel does.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reviewTotals } from '../scripts/pack.mjs';
import { roundTokenCount } from '../scripts/spend.mjs';
import { approveVerdict, shipRepo } from './support/speck.mjs';

const T = { fm: {} };
const saved = (round, reviewer, usage, tokens) => ({ meta: { round, reviewer, usage, ...(tokens ? { tokens } : {}) } });
// A resumed Codex round: its usage is the session's, two rounds' worth; it saved only its own tokens.
const CODEX = saved(2, 'codex', { input_tokens: 10000, cached_input_tokens: 6000, output_tokens: 500 }, { input: 1000, cached: 3000, write: 0, output: 200 });
// A Claude round: cache reads and writes left out of its usage's input.
const CLAUDE = saved(1, 'claude', { input_tokens: 40, cache_read_input_tokens: 9000, cache_creation_input_tokens: 700, output_tokens: 120 }, { input: 40, cached: 9000, write: 700, output: 120 });
// A Cursor round: its usage in camelCase.
const CURSOR = saved(3, 'cursor', { inputTokens: 5000, cacheReadTokens: 4000, outputTokens: 60 }, { input: 1000, cached: 4000, write: 0, output: 60 });
// A round saved before 0529, with no tokens of its own.
const OLD = saved(1, 'codex', { input_tokens: 700, cached_input_tokens: 300, output_tokens: 50 });

test('0553 AC1: the pack\'s Reviewer tokens add up each round\'s saved tokens, as speck status --json counts them', () => {
  const rounds = [CLAUDE, CODEX, CURSOR];
  assert.equal(reviewTotals(T, rounds).tokens, '19,120');
  assert.equal(reviewTotals(T, rounds).tokens, rounds.reduce((n, r) => n + roundTokenCount(r), 0).toLocaleString('en-GB'));
});

test('0553 AC3: a round saved without its own tokens counts its usage\'s input plus output', () => {
  assert.equal(reviewTotals(T, [OLD]).tokens, '750');
  assert.equal(reviewTotals(T, [OLD, CODEX]).tokens, '4,950');
  assert.equal(reviewTotals(T, [{ meta: { round: 1 } }]).tokens, '0');
});

test('0553 AC4: the line keeps its wording and number format', () => {
  assert.equal(`- Reviewer tokens: ${reviewTotals(T, [saved(1, 'codex', {}, { input: 100000, cached: 60000, write: 0, output: 6010 })]).tokens}`, '- Reviewer tokens: 166,010');
});

test('0553 AC2: speck close writes the same Reviewer tokens in the delivery log as the review pack', () => {
  const r = shipRepo({ approve: false });
  const file = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  fs.appendFileSync(file, '\n## Review log\n\n## Delivery log\n');
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'reviewing').status, 0);
  r.g('add', '-A'); r.g('commit', '-qm', 'reviewing');
  const verdict = path.join(os.tmpdir(), `v-0553-${path.basename(r.dir)}.json`);
  fs.writeFileSync(verdict, JSON.stringify(approveVerdict));
  assert.equal(r.run('record', '1', verdict, '--reviewer=codex').status, 0);
  // The round as a resumed Codex round saves it: the session's usage, and its own tokens.
  const text = fs.readFileSync(file, 'utf8');
  const withTokens = text.replace(/(```json\n)([\s\S]*?)(\n```)/, (all, open, json, close) => {
    const round = JSON.parse(json);
    Object.assign(round.meta, { usage: CODEX.meta.usage, tokens: CODEX.meta.tokens });
    return `${open}${JSON.stringify(round, null, 2)}${close}`;
  });
  assert.notEqual(withTokens, text, 'the round was saved');
  fs.writeFileSync(file, withTokens);
  r.g('add', '-A'); r.g('commit', '-qm', 'round 1');
  const pack = r.run('pack', '1').stdout;
  assert.match(pack, /Reviewer tokens: 4,200\b/, pack);
  assert.equal(r.run('close', '1').status, 0);
  const delivery = fs.readFileSync(file, 'utf8').split('## Delivery log\n')[1];
  assert.match(delivery, /^- Reviewer tokens: 4,200$/m, delivery);
});

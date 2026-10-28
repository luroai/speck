// 0546: each review round's tokens, in speck status --json and the panel, counted as the round saved them.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { roundTokenCount, totalSpent } from '../scripts/spend.mjs';
import { statusData, runsOf } from '../scripts/speck.mjs';
import { T, panelModel, stoppedClock } from './support/panel.mjs';
import { runRepo } from './support/run.mjs';

const NOW = new Date(2026, 9, 28, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
// A saved review round: its number, its usage as the reviewer reported it, and the tokens it saved when it has them.
const saved = (round, usage, tokens) => ({ meta: { round, reviewer: 'codex', usage, ...(tokens ? { tokens } : {}) }, verdict: { verdict: 'request_changes' } });
const block = r => `<details><summary>Round ${r.meta.round}</summary>\n\n\`\`\`json\n${JSON.stringify(r)}\n\`\`\`\n\n</details>\n`;

// A ticket 0001 whose ## Review rounds keeps `rounds`, and what speck status --json says of it.
function statusOf(rounds) {
  const r = runRepo({ tickets: [['0001', {}]] });
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  const dir = path.join(r.dir, 'speck', 'tickets'), file = path.join(dir, fs.readdirSync(dir).find(f => f.startsWith('0001-')));
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').trimEnd()}\n\n## Review rounds\n\n${rounds.map(block).join('\n')}`);
  return statusData(r.dir).tickets.find(t => t.id === '0001');
}

// A resumed Codex round: its usage is the session's, two rounds' worth; it saved only its own tokens.
const CODEX = saved(2, { input_tokens: 10000, cached_input_tokens: 6000, output_tokens: 500 }, { input: 1000, cached: 3000, write: 0, output: 200 });
// A Claude round: cache reads and writes left out of its usage's input.
const CLAUDE = saved(1, { input_tokens: 40, cache_read_input_tokens: 9000, cache_creation_input_tokens: 700, output_tokens: 120 }, { input: 40, cached: 9000, write: 700, output: 120 });
// A Cursor round: its usage in camelCase.
const CURSOR = saved(3, { inputTokens: 5000, cacheReadTokens: 4000, outputTokens: 60 }, { input: 1000, cached: 4000, write: 0, output: 60 });

test('0546 AC1: each round\'s tokens in speck status --json are the tokens it saved, the figure total_tokens counts', () => {
  const t = statusOf([CLAUDE, CODEX, CURSOR]);
  assert.deepEqual(t.rounds.map(r => r.tokens), [9860, 4200, 5060]);
  assert.equal(t.rounds.reduce((n, r) => n + r.tokens, 0), t.total_tokens, 'the ticket\'s total, with no other spend');
  for (const r of [CLAUDE, CODEX, CURSOR]) assert.equal(roundTokenCount(r), totalSpent('/nonexistent', '0001', [r]).total_tokens);
});

test('0546 AC2: a round saved without its own tokens keeps its usage\'s input plus output', () => {
  assert.equal(roundTokenCount(saved(1, { input_tokens: 700, cached_input_tokens: 300, output_tokens: 50 })), 750);
  assert.equal(roundTokenCount({ meta: { tokens: null, usage: { input_tokens: 7, output_tokens: 3 } } }), 10, 'tokens saved as null');
  assert.equal(roundTokenCount({ meta: { tokens: { input: null, cached: null, write: null, output: null }, usage: { input_tokens: 7, output_tokens: 3 } } }), 10, 'no count saved');
  assert.equal(roundTokenCount({ meta: { usage: { inputTokens: 1000, outputTokens: 10 } } }), 0, 'an old Cursor round, as today');
  for (const r of [{ meta: {} }, {}, null, 'round', { meta: { usage: { input_tokens: -5, output_tokens: 'x' } } }]) assert.equal(roundTokenCount(r), 0);
  assert.deepEqual(statusOf([saved(1, { input_tokens: 700, output_tokens: 50 })]).rounds.map(r => r.tokens), [750]);
});

test('0546 AC3: a resumed Codex round counts only its own tokens, and a Cursor round its real count', () => {
  assert.equal(roundTokenCount(CODEX), 4200, 'not the session\'s 10,500');
  assert.equal(roundTokenCount(CURSOR), 5060, 'not 0');
  // A saved count missing one part counts the others.
  assert.equal(roundTokenCount(saved(1, {}, { input: 10, output: 5 })), 15);
});

test('0546 AC4: the panel\'s Reviewer tokens and the Shipped lane\'s median add up the rounds\' tokens', () => {
  const t = statusOf([CLAUDE, CODEX]);
  const tickets = [
    T('0001', 'done', { started: ago(3000), finished: ago(600), rounds: t.rounds }),
    T('0002', 'done', { started: ago(3000), finished: ago(700), rounds: statusOf([CURSOR]).rounds }),
    T('0003', 'done', { started: ago(3000), finished: ago(800), rounds: statusOf([saved(1, { input_tokens: 100, output_tokens: 1 })]).rounds }),
  ];
  const m = panelModel({ Date: stoppedClock(NOW) })({ run: { on: false }, ideas: [], tickets });
  assert.deepEqual(m.shipped.map(s => [s.id, s.tokens]), [['0001', 14060], ['0002', 5060], ['0003', 101]]);
  assert.equal(m.stats.tokens.median, 5060);
});

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';
import { speck } from './support/cli.mjs';
import { SOURCE, SHIPPED, cutTable, findRates, costOf, priceTable } from '../scripts/prices.mjs';
import { updatePrices } from '../scripts/update-prices.mjs';

const brief = () => fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
const section = (text, heading) => text.split(/^## /m).find(s => s.startsWith(heading)) || '';

// A price table of the test's own, in the shipped table's form: dollars per token.
const M = 1e-6;
const TABLE = {
  source: SOURCE, taken: '2026-01-02',
  models: {
    'claude-opus-5-5': [4 * M, 0.2 * M, 5 * M, 20 * M],
    'gpt-6.1-sol': [2 * M, 0.1 * M, 2.5 * M, 10 * M],
    'deepseek-v4-pro': [1 * M, 0.1 * M, null, 2 * M],
    'xai/grok-4.7': [2 * M, 0.5 * M, null, 6 * M],
    'azure_ai/grok-4.7': [9 * M, 9 * M, null, 9 * M],
    'opencode_go/grok-4.7': [8 * M, 8 * M, null, 8 * M],
    'openrouter/auto': [1 * M, 1 * M, null, 1 * M],
    'fireworks_ai/accounts/fireworks/routers/auto': [1 * M, 1 * M, null, 1 * M],
  },
};

function tableFile(table = TABLE) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0524-'));
  const file = path.join(dir, 'prices.json');
  fs.writeFileSync(file, JSON.stringify(table));
  return file;
}

test('0524 AC1: the shipped table holds the four base rates of each model, the list it came from and the day it was taken', () => {
  const t = priceTable(SHIPPED);
  assert.equal(t.source, 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json');
  assert.match(t.taken, /^\d{4}-\d{2}-\d{2}$/);
  const entries = Object.entries(t.models);
  assert.ok(entries.length > 100);
  for (const [, r] of entries) {
    assert.equal(r.length, 4);
    assert.ok(r.every(v => v === null || (typeof v === 'number' && v >= 0)));
    assert.equal(typeof r[0], 'number');
    assert.equal(typeof r[3], 'number');
  }
  assert.equal(t.models.sample_spec, undefined);
});

test('0524 AC1: cutting the full list keeps only the base rates of models priced by the token', () => {
  const full = {
    sample_spec: { mode: 'chat', input_cost_per_token: 0, output_cost_per_token: 0 },
    'b-model': { mode: 'chat', input_cost_per_token: 3e-6, output_cost_per_token: 1.5e-5, cache_read_input_token_cost: 3e-7,
      cache_creation_input_token_cost: 3.75e-6, input_cost_per_token_above_200k_tokens: 6e-6, cache_creation_input_token_cost_above_1hr: 6e-6, max_input_tokens: 200000 },
    'a-model': { mode: 'responses', input_cost_per_token: 1e-6, output_cost_per_token: 4e-6 },
    'an-embedding': { mode: 'embedding', input_cost_per_token: 1e-7, output_cost_per_token: 0 },
    'an-image': { mode: 'image_generation', output_cost_per_image: 0.04 },
    'no-output': { mode: 'chat', input_cost_per_token: 1e-6 },
    'bad-rate': { mode: 'chat', input_cost_per_token: 'free', output_cost_per_token: 1e-6 },
  };
  const t = cutTable(full, '2026-03-04');
  assert.deepEqual(t, { source: SOURCE, taken: '2026-03-04', models: { 'a-model': [1e-6, null, null, 4e-6], 'b-model': [3e-6, 3e-7, 3.75e-6, 1.5e-5] } });
});

test('0524 AC1: npm run prices replaces the table with the current list, and nothing else in speck fetches it', async () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.prices, 'node scripts/update-prices.mjs');
  const file = tableFile();
  let asked = null;
  const fetch = async url => { asked = url; return { ok: true, status: 200, json: async () => ({ 'new-model': { mode: 'chat', input_cost_per_token: 1e-6, output_cost_per_token: 2e-6 } }) }; };
  const n = await updatePrices({ fetch, file, today: '2026-05-06' });
  assert.equal(asked, SOURCE);
  assert.equal(n, 1);
  assert.deepEqual(priceTable(file), { source: SOURCE, taken: '2026-05-06', models: { 'new-model': [1e-6, null, null, 2e-6] } });

  // A failed fetch or an empty list leaves the table as it was.
  const before = fs.readFileSync(file, 'utf8');
  await assert.rejects(updatePrices({ fetch: async () => ({ ok: false, status: 503 }), file, today: '2026-05-07' }), /503/);
  await assert.rejects(updatePrices({ fetch: async () => ({ ok: true, status: 200, json: async () => ({}) }), file, today: '2026-05-07' }), /no models/i);
  assert.equal(fs.readFileSync(file, 'utf8'), before);

  for (const f of fs.readdirSync(path.join(ROOT, 'scripts')).filter(f => f.endsWith('.mjs') && f !== 'update-prices.mjs')) {
    const src = fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8');
    assert.doesNotMatch(src, /from '\.\/update-prices/, `${f} imports the updater`);
    if (src.includes('SOURCE')) assert.doesNotMatch(src, /fetch\(\s*SOURCE/, `${f} fetches the list`);
  }
});

test('0524 AC2: the Releases section says a release ticket runs npm run prices', () => {
  assert.match(section(brief(), 'Releases'), /`npm run prices`/);
});

test('0524 AC3: a model is found from its name as the agents give it', () => {
  assert.equal(findRates(TABLE, 'claude-opus-5-5').model, 'claude-opus-5-5');
  assert.equal(findRates(TABLE, 'gpt-6.1-sol').model, 'gpt-6.1-sol');
  assert.equal(findRates(TABLE, 'deepseek-v4-pro').model, 'deepseek-v4-pro');
  assert.equal(findRates(TABLE, 'grok-4.7-high').model, 'xai/grok-4.7');
  assert.equal(findRates(TABLE, 'grok-4.7-high-fast').model, 'xai/grok-4.7');
  assert.deepEqual(findRates(TABLE, 'grok-4.7-high'), { model: 'xai/grok-4.7', input: 2 * M, cached: 0.5 * M, write: null, output: 6 * M });
  assert.equal(findRates(TABLE, 'GPT-6.1-SOL').model, 'gpt-6.1-sol');
});

test('0524 AC3: auto and a name in no entry find none, so their cost is unknown, never $0', () => {
  for (const name of ['auto', 'not-a-model', 'high', '', '   ', null, undefined, 'constructor', '__proto__', 'toString', 'grok-4.8-high']) {
    assert.equal(findRates(TABLE, name), null, String(name));
    assert.equal(costOf(findRates(TABLE, name), { input: 1000, output: 1000 }), null, String(name));
  }
  assert.equal(findRates({ ...TABLE, models: { ...TABLE.models, auto: [1, 1, 1, 1] } }, 'auto'), null);
});

test('0524 AC4: each kind of token costs its count times its rate, added up', () => {
  const rates = findRates(TABLE, 'gpt-6.1-sol');
  assert.equal(costOf(rates, { input: 400_000, cached: 600_000, write: 0, output: 10_000 }), 0.96);
  assert.equal(costOf(findRates(TABLE, 'claude-opus-5-5'), { input: 1_000_000, cached: 1_000_000, write: 1_000_000, output: 1_000_000 }), 29.2);
  // A model with no cache-write rate pays its input rate for them.
  assert.equal(costOf(findRates(TABLE, 'deepseek-v4-pro'), { input: 0, cached: 0, write: 1_000_000, output: 0 }), 1);
  // Missing or unusable counts count as none.
  assert.equal(costOf(rates, { output: 1_000_000, input: -5, cached: 'x' }), 10);
  assert.equal(costOf(rates, {}), 0);
  assert.equal(costOf(null, { input: 1 }), null);
});

test('0524 AC5: speck prices prints the rates per million tokens, the entry it matched and the date the table was taken', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0524-'));
  const env = { ...process.env, SPECK_PRICES: tableFile() };
  const r = speck(dir, env, 'prices', 'grok-4.7-high');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /xai\/grok-4\.7/);
  assert.match(r.stdout, /2026-01-02/);
  assert.match(r.stdout, /input\s+\$2\.00/);
  assert.match(r.stdout, /cached input\s+\$0\.50/);
  assert.match(r.stdout, /output\s+\$6\.00/);
  assert.match(r.stdout, /per million tokens/);
  const o = speck(dir, env, 'prices', 'claude-opus-5-5');
  assert.match(o.stdout, /cache writes\s+\$5\.00/);
  assert.match(o.stdout, /cached input\s+\$0\.20/);

  const none = speck(dir, env, 'prices', 'auto');
  assert.equal(none.status, 1);
  assert.match(none.stderr, /No rates found for "auto"/);
  assert.match(none.stderr, /2026-01-02/);

  const missing = speck(dir, env, 'prices');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /speck prices <model>/);

  const bad = speck(dir, { ...env, SPECK_PRICES: path.join(dir, 'nope.json') }, 'prices', 'gpt-6.1-sol');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /price table/);
  assert.doesNotMatch(bad.stderr, /at .*\.mjs:\d+/);
});

test('0524 AC5: the command table lists speck prices', () => {
  assert.match(brief(), /^\| `speck prices <model>` \|/m);
});

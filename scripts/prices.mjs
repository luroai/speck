// 0524: what a model's tokens cost, from the price table that ships with each release (prices.json, beside this file).
// The table is cut down from LiteLLM's model price list by `npm run prices` (update-prices.mjs): speck itself never
// fetches it, so pricing works offline and the rates change only with a release. Each model has its four base rates,
// in dollars per token: [input, cached input, cache writes, output], the cache rates null where the list has none.
// Rates above a context size and for 1-hour cache writes are left out: agents report a session's totals, not each
// request's, so a cost is an estimate at list prices.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SpeckError } from './core.mjs';

export const SOURCE = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
export const SHIPPED = path.join(path.dirname(fileURLToPath(import.meta.url)), 'prices.json');

// The kinds of entry an agent's tokens are billed as: the rest are images, embeddings, audio and the like.
const MODES = new Set(['chat', 'responses', 'completion']);
const rate = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);

// The shipped table's form of LiteLLM's full list `full`, taken on `taken` (YYYY-MM-DD): each chat, responses or
// completion model with an input and an output rate, by name in order, leaving out the list's sample_spec.
export function cutTable(full, taken) {
  const models = {};
  for (const name of Object.keys(full || {}).sort()) {
    const e = full[name];
    if (name === 'sample_spec' || !e || typeof e !== 'object' || !MODES.has(e.mode)) continue;
    const r = [e.input_cost_per_token, e.cache_read_input_token_cost, e.cache_creation_input_token_cost, e.output_cost_per_token].map(rate);
    if (r[0] !== null && r[3] !== null) models[name] = r;
  }
  return { source: SOURCE, taken, models };
}

// The table as prices.json keeps it: one model to a line, so a release's new rates show line by line.
export function formatTable(t) {
  const lines = Object.entries(t.models).map(([name, r]) => `    ${JSON.stringify(name)}: ${JSON.stringify(r)}`);
  return `{\n  "source": ${JSON.stringify(t.source)},\n  "taken": ${JSON.stringify(t.taken)},\n  "models": {\n${lines.join(',\n')}\n  }\n}\n`;
}

// The price table in `file`: the shipped one, or SPECK_PRICES's when it's set. Throws a SpeckError when it can't be read.
export function priceTable(file = process.env.SPECK_PRICES || SHIPPED) {
  let t;
  try { t = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
    throw new SpeckError(`The price table ${file} can't be read (${e.code || e.message}). Reinstall speck, or run npm run prices in speck's own repo.`);
  }
  if (!t || typeof t !== 'object' || typeof t.taken !== 'string' || !t.models || typeof t.models !== 'object' || Array.isArray(t.models))
    throw new SpeckError(`The price table ${file} isn't in the form speck expects. Reinstall speck, or run npm run prices in speck's own repo.`);
  return t;
}

// The models of a table by lower-case name, made once per table.
const indexes = new WeakMap();
function index(t) {
  let m = indexes.get(t);
  if (!m) {
    m = new Map();
    for (const [name, r] of Object.entries(t.models || {})) if (Array.isArray(r) && rate(r[0]) !== null && rate(r[3]) !== null && !m.has(name.toLowerCase())) m.set(name.toLowerCase(), name);
    indexes.set(t, m);
  }
  return m;
}

// Words an agent adds to a model's name for its effort or speed, as Cursor does in grok-4.7-high-fast.
const EXTRA_WORDS = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'fast']);
// The model makers' own provider prefixes, tried in this order for a name with no entry of its own, so a maker's own
// rates win over a reseller's copy of the same model (xai/grok-4.7, not azure_ai/grok-4.7).
const MAKERS = ['anthropic', 'openai', 'xai', 'deepseek', 'gemini', 'mistral', 'moonshot', 'zai'];

// The rates for a model, from its name as the agent gives it: {model, input, cached, write, output}, with `model` the
// entry it matched and the rates in dollars per token (cached and write null where the entry has none), or null when
// no entry matches. It tries the name itself, then with each maker's prefix, then the same again with each trailing
// effort or speed word dropped in turn. Cursor's `auto` finds none: it picks a model without saying which.
export function findRates(t, name) {
  const n = String(name ?? '').trim().toLowerCase();
  if (!n || n === 'auto') return null;
  const m = index(t);
  let words = n.split('-');
  for (;;) {
    const base = words.join('-');
    const key = [base, ...MAKERS.map(p => `${p}/${base}`)].find(k => m.has(k));
    if (key) {
      const model = m.get(key), r = t.models[model];
      return { model, input: rate(r[0]), cached: rate(r[1]), write: rate(r[2]), output: rate(r[3]) };
    }
    if (words.length < 2 || !EXTRA_WORDS.has(words.at(-1))) return null;
    words = words.slice(0, -1);
  }
}

// What `tokens` ({input, cached, write, output}: uncached input, cached input, cache writes and output) cost at `rates`
// (findRates's), in dollars: each count times its rate, added up. Cached input and cache writes are charged the input
// rate where the entry has no rate of their own. A missing or unusable count counts as none. Null without rates, as
// the cost is then unknown, never $0.
export function costOf(rates, tokens) {
  if (!rates) return null;
  const n = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
  const t = tokens || {};
  const sum = n(t.input) * rates.input + n(t.cached) * (rates.cached ?? rates.input) + n(t.write) * (rates.write ?? rates.input) + n(t.output) * rates.output;
  return Math.round(sum * 1e10) / 1e10;
}

// A rate in dollars per token as dollars per million tokens: $4.00, $0.20, $0.075.
function perMillion(r) {
  const v = Math.round(r * 1e6 * 1e6) / 1e6;
  return `$${Math.abs(Math.round(v * 100) - v * 100) < 1e-6 ? v.toFixed(2) : String(v)}`;
}

// `speck prices <model>`: the rates speck would use for a model, per million tokens, the entry it matched and the
// date the table was taken.
export function cmdPrices(args) {
  const name = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (!name) throw new SpeckError('Usage: speck prices <model>, with the model named as the agent gives it.');
  const t = priceTable();
  const r = findRates(t, name);
  if (!r) throw new SpeckError(`No rates found for "${name}" in the price table taken ${t.taken}, so its cost is unknown.`);
  const own = (v, what) => (v === null ? `${perMillion(r.input)} (no ${what} rate listed: the input rate)` : perMillion(v));
  console.log(`${name}: ${r.model} in the price table taken ${t.taken}, per million tokens:`);
  console.log(`  input          ${perMillion(r.input)}`);
  console.log(`  cached input   ${own(r.cached, 'cached input')}`);
  console.log(`  cache writes   ${own(r.write, 'cache write')}`);
  console.log(`  output         ${perMillion(r.output)}`);
}

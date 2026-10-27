// 0529: what a review round spent: the model it ran on, its tokens and its cost, saved with the round.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { priceTable, findRates, costOf } from './prices.mjs';

const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const usable = v => (typeof v === 'string' && v.trim() && v !== 'default' ? v.trim() : null);

// The raw counts of `usage` in the shape its agent reports them, by name, each a number or null.
const CODEX = ['input_tokens', 'cached_input_tokens', 'cache_write_input_tokens', 'output_tokens'];
const CURSOR = ['inputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'outputTokens'];
const CLAUDE = ['input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens', 'output_tokens'];
const shapeOf = (usage, codex) => (codex ? CODEX : 'inputTokens' in usage || 'cacheReadTokens' in usage ? CURSOR : CLAUDE);

// A round's tokens from the usage its agent reported: {input, cached, write, output}, with input the uncached input, or
// null when it reported none. Codex's input_tokens and Cursor's inputTokens include the cached input, so it's taken
// out of them. Claude Code's input_tokens leave it out already. `before`, for a Codex round that resumed an earlier
// round's session, is that round's usage: Codex reports a resumed session's totals, so each count is less that one's.
export function roundTokens(usage, { codex = false, before } = {}) {
  if (!plain(usage)) return null;
  const keys = shapeOf(usage, codex);
  let raw = keys.map(k => num(usage[k]));
  if (raw[0] === null && raw[3] === null) return null;
  raw = raw.map(v => v ?? 0);
  if (before !== undefined) {
    if (!plain(before)) return null;
    raw = raw.map((v, i) => v - (num(before[keys[i]]) ?? 0));
    if (raw.some(v => v < 0)) return null;
  }
  const [input, cached, write, output] = raw;
  const uncached = keys === CLAUDE ? input : input - cached;
  return uncached < 0 ? null : { input: uncached, cached, write, output };
}

// The model a Claude Code result says it ran on: the one in its modelUsage that cost the most, or null.
function claudeModel(modelUsage) {
  if (!plain(modelUsage)) return null;
  const ms = Object.entries(modelUsage).filter(([, m]) => plain(m));
  if (!ms.length) return null;
  return ms.reduce((a, b) => ((num(b[1].costUSD) ?? 0) > (num(a[1].costUSD) ?? 0) ? b : a))[0];
}

// The model Codex's session file records for thread `thread`, in `home`'s sessions folder
// (sessions/YYYY/MM/DD/rollout-<time>-<thread>.jsonl): the last turn's, or null when there's no such file or model.
export function codexModel(thread, home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')) {
  if (typeof thread !== 'string' || !/^[\w-]+$/.test(thread)) return null;
  const files = [];
  const walk = (dir, depth) => {
    let names;
    try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of names) {
      const p = path.join(dir, d.name);
      if (d.isDirectory() && depth < 3) walk(p, depth + 1);
      else if (d.isFile() && d.name.startsWith('rollout-') && d.name.endsWith(`-${thread}.jsonl`)) files.push(p);
    }
  };
  walk(path.join(home, 'sessions'), 0);
  let model = null, newest = -Infinity;
  for (const f of files) {
    let text, at;
    try { text = fs.readFileSync(f, 'utf8'); at = fs.statSync(f).mtimeMs; } catch { continue; }
    let found = null;
    for (const line of text.split('\n')) {
      if (!line.includes('"turn_context"')) continue;
      try { const o = JSON.parse(line); if (o?.type === 'turn_context' && usable(o.payload?.model)) found = o.payload.model.trim(); } catch { /* not an event */ }
    }
    if (found && at >= newest) { model = found; newest = at; }
  }
  return model;
}

// What a round cost at `model`'s rates in the price table, or null when it has none or the table can't be read.
function priced(model, tokens) {
  if (!model || !tokens) return null;
  try { return costOf(findRates(priceTable(), model), tokens); } catch { return null; }
}

// The spend a Codex round saves: {model, tokens, cost_usd}. Its model is `model` (the round's reviewer_model) when one
// is set, or else the one Codex's session file records for `thread`. `before` is the usage of the round whose session
// it resumed, if it resumed one. Its cost is priced from the price table, and null when it can't be.
export function codexSpend(usage, { model, thread, before } = {}) {
  const m = usable(model) || codexModel(thread);
  const tokens = roundTokens(usage, { codex: true, before });
  return { model: m, tokens, cost_usd: priced(m, tokens) };
}

// The spend a round run as a command saves (Claude, Cursor, a provider or a reviewer set up in config), from the JSON
// envelope it printed: {model, tokens, cost_usd}, and session_cost_usd when the envelope gives total_cost_usd. A
// Claude Code round costs its total_cost_usd, which covers the whole session, so a round that resumed the session of
// `earlier` (the round before it) costs that less the earlier round's session_cost_usd, and null when that's not
// known. A round that reported no usage has an unknown cost. Any other round is priced from the price table at its
// model's rates: `model` (reviewer_model, or a provider's default), and null when it has none, such as Cursor's auto.
export function commandSpend(envelope, { model, earlier } = {}) {
  const e = plain(envelope) ? envelope : {};
  const m = claudeModel(e.modelUsage) || usable(model);
  const tokens = roundTokens(e.usage);
  const total = num(e.total_cost_usd);
  if (!tokens) return { model: m, tokens, cost_usd: null, ...(total === null ? {} : { session_cost_usd: total }) };
  if (total === null) return { model: m, tokens, cost_usd: priced(m, tokens) };
  let cost = total;
  if (earlier) {
    const was = num(earlier.session_cost_usd);
    cost = was === null || was > total ? null : Math.round((total - was) * 1e10) / 1e10;
  }
  return { model: m, tokens, cost_usd: cost, session_cost_usd: total };
}

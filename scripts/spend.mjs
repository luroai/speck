// What a build's builder spent, from its log and from speck run's run record.

import fs from 'node:fs';
import path from 'node:path';

// What a build's builder spent, from the last `result` line of its log, as Claude Code's `--output-format stream-json`
// writes it: {tokens, cost_usd}, or null when there's no such line or it reports no usage. Each result line's
// modelUsage and total_cost_usd cover the whole session, a resumed one too, while its usage covers only its own turn,
// so tokens come from modelUsage (input, cache reads, cache writes and output, summed over models) when it's there.
// cost_usd is total_cost_usd, or null without one.
// A Codex build's log (`codex exec --json`) has no result line: its last `turn.completed` line's usage covers the whole
// session, a resumed one too, and its input_tokens already include the cached input, so tokens are input_tokens and
// output_tokens. A Cursor build's last result line has usage with inputTokens, outputTokens, cacheReadTokens and
// cacheWriteTokens, summed as Claude Code's are. Neither says what it cost, so cost_usd is null (0291).
export function builderSpend(text) {
  const lines = String(text ?? '').split('\n');
  let e = null;
  for (let i = lines.length - 1; i >= 0 && !e; i--) {
    if (!lines[i].startsWith('{')) continue;
    try { const o = JSON.parse(lines[i]); if (o && typeof o === 'object' && (o.type === 'result' || o.type === 'turn.completed')) e = o; } catch { /* not an event */ }
  }
  if (!e) return null;
  const n = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  if (e.type === 'turn.completed') return obj(e.usage) ? { tokens: n(e.usage.input_tokens) + n(e.usage.output_tokens), cost_usd: null } : null;
  let tokens = null;
  if (obj(e.usage) && 'inputTokens' in e.usage)
    tokens = n(e.usage.inputTokens) + n(e.usage.cacheReadTokens) + n(e.usage.cacheWriteTokens) + n(e.usage.outputTokens);
  else if (obj(e.modelUsage) && Object.values(e.modelUsage).some(obj))
    tokens = Object.values(e.modelUsage).filter(obj).reduce((t, m) => t + n(m.inputTokens) + n(m.cacheReadInputTokens) + n(m.cacheCreationInputTokens) + n(m.outputTokens), 0);
  else if (obj(e.usage))
    tokens = n(e.usage.input_tokens) + n(e.usage.cache_read_input_tokens) + n(e.usage.cache_creation_input_tokens) + n(e.usage.output_tokens);
  if (tokens === null) return null;
  const cost = e.total_cost_usd;
  return { tokens, cost_usd: typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : null };
}

// What the builder of a build launched by `speck run` spent, as speck run recorded it in the run record when the build
// ended: {tokens, cost_usd}, each null when it isn't recorded.
export function builderSpent(runs, id) {
  id = String(id ?? '');
  const none = { tokens: null, cost_usd: null };
  if (!/^[\w-]+$/.test(id)) return none;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); } catch { return none; }
  const b = rec && typeof rec === 'object' ? rec.builder : null;
  if (!b || typeof b !== 'object') return none;
  const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
  return { tokens: num(b.tokens), cost_usd: num(b.cost_usd) };
}

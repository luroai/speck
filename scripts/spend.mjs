// What a build's builder spent, from its log and from speck run's run record, and what a ticket's reviewer spent.

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

const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const readRecord = (runs, id) => { try { const r = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); return plain(r) ? r : null; } catch { return null; } };

// The builds of a ticket before its latest, as its run record keeps them (earlier_builds): [{ended, tokens, cost_usd}],
// leaving out anything malformed.
const earlierOf = rec => (Array.isArray(rec?.earlier_builds) ? rec.earlier_builds : [])
  .filter(plain).map(b => ({ ended: typeof b.ended === 'string' ? b.ended : null, tokens: num(b.tokens), cost_usd: num(b.cost_usd) }));

// 0523: what a new build of ticket `id` carries forward before its run record and log are replaced: the earlier builds
// its record kept, and the build it records, with the time it ended, when that one spent anything (its recorded
// builder, or its log's when it stopped before its exit was saved). A resumed build has one record and its log's last
// result line covers the whole session, so it counts once. [] when there's no record.
export function earlierBuilds(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return [];
  const rec = readRecord(runs, id);
  if (!rec) return [];
  let b = plain(rec.builder) ? rec.builder : null;
  // A log older than the record is an earlier build's, already counted, left when this one couldn't open its own.
  const log = path.join(runs, `${id}.log`);
  if (!b) { try { if (!(fs.statSync(log).mtimeMs < Date.parse(rec.started))) b = builderSpend(fs.readFileSync(log, 'utf8')); } catch { /* no log */ } }
  const last = b && (num(b.tokens) !== null || num(b.cost_usd) !== null)
    ? [{ ended: typeof rec.exited === 'string' ? rec.exited : null, tokens: num(b.tokens), cost_usd: num(b.cost_usd) }] : [];
  return [...earlierOf(rec), ...last];
}

// What the builder of a ticket's builds launched by `speck run` spent, as speck run recorded it in the run record when
// each build ended: {tokens, cost_usd}. 0523: summed over the latest build and the earlier ones the record keeps, each
// over the builds that report it, and null when none does.
export function builderSpent(runs, id) {
  id = String(id ?? '');
  const none = { tokens: null, cost_usd: null };
  if (!/^[\w-]+$/.test(id)) return none;
  const rec = readRecord(runs, id);
  if (!rec) return none;
  const b = plain(rec.builder) ? rec.builder : {};
  const builds = [...earlierOf(rec), { tokens: num(b.tokens), cost_usd: num(b.cost_usd) }];
  const sum = k => builds.reduce((t, x) => (x[k] === null ? t : (t ?? 0) + x[k]), null);
  return { tokens: sum('tokens'), cost_usd: sum('cost_usd') };
}

// 0529: the sum of the known costs of a ticket's rounds, or null when none is known.
export function reviewerCost(rounds) {
  return (Array.isArray(rounds) ? rounds : []).reduce((t, r) => {
    const c = num(r?.meta?.cost_usd);
    return c === null ? t : Math.round(((t ?? 0) + c) * 1e10) / 1e10;
  }, null);
}

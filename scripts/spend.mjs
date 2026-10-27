// What a build's builder spent, from its log and from speck run's run record, and what a ticket's reviewer spent.

import fs from 'node:fs';
import path from 'node:path';
import { priceTable, findRates, costOf } from './prices.mjs';
import { roundTokens, codexModel } from './round-cost.mjs';

const usable = v => (typeof v === 'string' && v.trim() && v !== 'default' ? v.trim() : null);

// 0530: the model a build's command gives with one of `flags`, the last one given, or null.
function commandModel(command, flags) {
  const words = Array.isArray(command) ? command.map(w => (typeof w === 'string' ? w : '')) : typeof command === 'string' ? command.trim().split(/\s+/) : [];
  let m = null;
  words.forEach((w, i) => {
    for (const f of flags) {
      if (w === f && i + 1 < words.length) m = words[i + 1];
      else if (w.startsWith(`${f}=`)) m = w.slice(f.length + 1);
    }
  });
  return usable(m);
}

// What `tokens` cost at `model`'s rates in the price table, or null when it has none or the table can't be read.
function priced(model, tokens) {
  if (!model || !tokens) return null;
  try { return costOf(findRates(priceTable(), model), tokens); } catch { return null; }
}

// What a build's builder spent, from the last `result` line of its log, as Claude Code's `--output-format stream-json`
// writes it: {tokens, cost_usd, models}, or null when there's no such line or it reports no usage. Each result line's
// modelUsage and total_cost_usd cover the whole session, a resumed one too, while its usage covers only its own turn,
// so tokens come from modelUsage (input, cache reads, cache writes and output, summed over models) when it's there.
// cost_usd is total_cost_usd, or null without one. 0530: models lists each model in modelUsage as {model, tokens,
// cost_usd}, its tokens split into {input, cached, write, output} (uncached input, cached input, cache writes and
// output) and its cost its costUSD. A result with no modelUsage gives no models.
// A Codex build's log (`codex exec --json`) has no result line: its last `turn.completed` line's usage covers the whole
// session, a resumed one too, and its input_tokens already include the cached input, so tokens are input_tokens and
// output_tokens. A Cursor build's last result line has usage with inputTokens, outputTokens, cacheReadTokens and
// cacheWriteTokens, and its inputTokens already include the cache reads, so tokens are inputTokens, cacheWriteTokens
// and outputTokens (0530). Neither says what it cost, so each is priced from the price table (0530) at its model's
// rates: for Codex the `-m` its `command` gives, or else the one its session file records for its thread (the log's,
// or `session`), and for Cursor the `--model` its command gives. cost_usd is null when the model has no rates, such as
// Cursor's auto. Its models is that one model, split as a review round's tokens are (round-cost.mjs).
export function builderSpend(text, { command, session } = {}) {
  const lines = String(text ?? '').split('\n');
  let e = null;
  for (let i = lines.length - 1; i >= 0 && !e; i--) {
    if (!lines[i].startsWith('{')) continue;
    try { const o = JSON.parse(lines[i]); if (o && typeof o === 'object' && (o.type === 'result' || o.type === 'turn.completed')) e = o; } catch { /* not an event */ }
  }
  if (!e) return null;
  const n = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  const obj = v => v && typeof v === 'object' && !Array.isArray(v);
  const one = (model, split, tokens) => { const cost = priced(model, split); return { tokens, cost_usd: cost, models: [{ model, tokens: split, cost_usd: cost }] }; };
  if (e.type === 'turn.completed') {
    if (!obj(e.usage)) return null;
    const model = commandModel(command, ['-m', '--model']) || codexModel(threadOf(lines) ?? session);
    return one(model, roundTokens(e.usage, { codex: true }), n(e.usage.input_tokens) + n(e.usage.output_tokens));
  }
  if (obj(e.usage) && 'inputTokens' in e.usage)
    return one(commandModel(command, ['--model']), roundTokens(e.usage), n(e.usage.inputTokens) + n(e.usage.cacheWriteTokens) + n(e.usage.outputTokens));
  let tokens = null, models = null;
  if (obj(e.modelUsage) && Object.values(e.modelUsage).some(obj)) {
    models = Object.entries(e.modelUsage).filter(([, m]) => obj(m)).map(([model, m]) => ({ model,
      tokens: { input: n(m.inputTokens), cached: n(m.cacheReadInputTokens), write: n(m.cacheCreationInputTokens), output: n(m.outputTokens) },
      cost_usd: num(m.costUSD) }));
    tokens = models.reduce((t, { tokens: k }) => t + k.input + k.cached + k.write + k.output, 0);
  } else if (obj(e.usage))
    tokens = n(e.usage.input_tokens) + n(e.usage.cache_read_input_tokens) + n(e.usage.cache_creation_input_tokens) + n(e.usage.output_tokens);
  if (tokens === null) return null;
  return { tokens, cost_usd: num(e.total_cost_usd), ...(models ? { models } : {}) };
}

// The thread id on the first thread.started line of a Codex log's lines, or null.
function threadOf(lines) {
  for (const l of lines) {
    if (!l.includes('"thread.started"')) continue;
    try { const o = JSON.parse(l); if (o?.type === 'thread.started') return usable(o.thread_id); } catch { /* not an event */ }
  }
  return null;
}

// 0530: what the build of ticket `id` whose run record is `rec` spent, from its log in `runs`, read with the command
// the record says it started with: builderSpend's, or null when there's no log or no spend in it.
export function logSpend(runs, id, rec) {
  let text;
  try { text = fs.readFileSync(path.join(runs, `${id}.log`), 'utf8'); } catch { return null; }
  return builderSpend(text, { command: rec?.command, session: typeof rec?.session === 'string' ? rec.session : undefined });
}

const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const readRecord = (runs, id) => { try { const r = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); return plain(r) ? r : null; } catch { return null; } };

// 0530: a build's models as its run record keeps them ([{model, tokens: {input, cached, write, output}, cost_usd}]),
// leaving out anything malformed: a model is a name or null, each count a number (0 when it's unusable) and the
// tokens null when it kept none.
const modelsOf = v => (Array.isArray(v) ? v : []).filter(m => plain(m) && (typeof m.model === 'string' || m.model === null)).map(m => ({
  model: m.model,
  tokens: plain(m.tokens) ? Object.fromEntries(['input', 'cached', 'write', 'output'].map(k => [k, num(m.tokens[k]) ?? 0])) : null,
  cost_usd: num(m.cost_usd),
}));
// A build's spend as a run record keeps it: {tokens, cost_usd}, with its models when it has any.
const spendOf = b => (ms => ({ tokens: num(b.tokens), cost_usd: num(b.cost_usd), ...(ms.length ? { models: ms } : {}) }))(modelsOf(b.models));

// The builds of a ticket before its latest, as its run record keeps them (earlier_builds): [{ended, tokens, cost_usd}],
// with models when a build has them (0530), leaving out anything malformed.
const earlierOf = rec => (Array.isArray(rec?.earlier_builds) ? rec.earlier_builds : [])
  .filter(plain).map(b => ({ ended: typeof b.ended === 'string' ? b.ended : null, ...spendOf(b) }));

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
  if (!b) { try { if (!(fs.statSync(log).mtimeMs < Date.parse(rec.started))) b = logSpend(runs, id, rec); } catch { /* no log */ } }
  const last = b && (num(b.tokens) !== null || num(b.cost_usd) !== null)
    ? [{ ended: typeof rec.exited === 'string' ? rec.exited : null, ...spendOf(b) }] : [];
  return [...earlierOf(rec), ...last];
}

// Each build of ticket `id` its run record keeps, earlier ones first, as spendOf gives them, or [] with no record.
const buildsOf = (runs, id) => {
  id = String(id ?? '');
  const rec = /^[\w-]+$/.test(id) ? readRecord(runs, id) : null;
  return rec ? [...earlierOf(rec), spendOf(plain(rec.builder) ? rec.builder : {})] : [];
};

// What the builder of a ticket's builds launched by `speck run` spent, as speck run recorded it in the run record when
// each build ended: {tokens, cost_usd}. 0523: summed over the latest build and the earlier ones the record keeps, each
// over the builds that report it, and null when none does. 0530: with models, when any build kept them: each model its
// builds ran on, once, with its tokens and its cost summed the same way, the model null for one that isn't known.
export function builderSpent(runs, id) {
  const builds = buildsOf(runs, id);
  if (!builds.length) return { tokens: null, cost_usd: null };
  const sum = k => builds.reduce((t, x) => (x[k] === null ? t : (t ?? 0) + x[k]), null);
  const models = new Map();
  for (const m of builds.flatMap(x => x.models ?? [])) {
    const was = models.get(m.model);
    if (!was) { models.set(m.model, { ...m, tokens: m.tokens && { ...m.tokens } }); continue; }
    if (m.tokens) was.tokens = Object.fromEntries(Object.entries(m.tokens).map(([k, v]) => [k, (was.tokens?.[k] ?? 0) + v]));
    if (m.cost_usd !== null) was.cost_usd = Math.round(((was.cost_usd ?? 0) + m.cost_usd) * 1e10) / 1e10;
  }
  return { tokens: sum('tokens'), cost_usd: sum('cost_usd'), ...(models.size ? { models: [...models.values()] } : {}) };
}

// 0529: the sum of the known costs of a ticket's rounds, or null when none is known.
export function reviewerCost(rounds) {
  return (Array.isArray(rounds) ? rounds : []).reduce((t, r) => {
    const c = num(r?.meta?.cost_usd);
    return c === null ? t : Math.round(((t ?? 0) + c) * 1e10) / 1e10;
  }, null);
}

// 0525: what each watch agent run spent, one JSON object a line: {id, run, ended, tokens, cost_usd, models?}, `id` the
// ticket it looked into and `run` its token. Not <id>.json or <id>.log, so nothing takes it for a build's record.
export const WATCH_SPEND = 'run.watch-spend.jsonl';

const watchRuns = runs => {
  let text = '';
  try { text = fs.readFileSync(path.join(runs, WATCH_SPEND), 'utf8'); } catch { return []; }
  return text.split('\n').flatMap(l => { try { const v = JSON.parse(l); return plain(v) && typeof v.id === 'string' && typeof v.run === 'string' ? [v] : []; } catch { return []; } });
};

// 0525: keeps what the watch agent run `run` that looked into ticket `id` spent, from its log `log`, read as a build's
// is (builderSpend) with the `command` it started with, and the log's last change as the time it ended. Returns what it
// kept, or null when the log has no final line reporting usage, such as a killed run's, or the run is already kept.
export function recordWatchSpend(runs, { id, run, command, log }) {
  let text, ended;
  try { text = fs.readFileSync(log, 'utf8'); ended = fs.statSync(log).mtime.toISOString(); } catch { return null; }
  const spent = builderSpend(text, { command });
  if (!spent || watchRuns(runs).some(x => x.run === run)) return null;
  const entry = { id: String(id), run: String(run), ended, ...spent };
  fs.appendFileSync(path.join(runs, WATCH_SPEND), `${JSON.stringify(entry)}\n`);
  return entry;
}

// Each watch agent run that looked into ticket `id`, once.
const watchOf = (runs, id) => {
  id = String(id ?? '');
  const seen = new Set();
  return /^[\w-]+$/.test(id) ? watchRuns(runs).filter(x => x.id === id && !seen.has(x.run) && seen.add(x.run)) : [];
};

// 0525: what the watch agent spent on ticket `id`, summed over its runs, each once: {tokens, cost_usd}, each null when
// no run reports it, so both are null for a ticket it never looked into.
export function watchSpent(runs, id) {
  const sum = { tokens: null, cost_usd: null };
  for (const x of watchOf(runs, id)) {
    if (num(x.tokens) !== null) sum.tokens = (sum.tokens ?? 0) + x.tokens;
    if (num(x.cost_usd) !== null) sum.cost_usd = Math.round(((sum.cost_usd ?? 0) + x.cost_usd) * 1e10) / 1e10;
  }
  return sum;
}

// 0526: a saved review round's tokens: the tokens it saved (0529: uncached and cached input, cache writes and output),
// or for a round saved before those, its usage split as roundSplit gives it (0527). Null when it has neither.
function roundSpent(r) {
  const meta = plain(r) && plain(r.meta) ? r.meta : {}, t = plain(meta.tokens) ? meta.tokens : null;
  const counts = t ? ['input', 'cached', 'write', 'output'].map(k => num(t[k])) : Object.values(roundSplit(meta) ?? {});
  return { tokens: !counts.length || counts.every(n => n === null) ? null : counts.reduce((n, x) => n + (x ?? 0), 0), cost_usd: num(meta.cost_usd) };
}

// 0527: a saved round's tokens as {input, cached, write, output}: the ones it saved (0529), or for a round saved before
// those, its usage's, as Codex, Claude Code or Cursor names them (roundTokens), cache reads and writes too. Codex's
// usage names its cached input cached_input_tokens. A usage roundTokens can't split, such as one whose cached input is
// more than its input, counts its input and output. Null with neither.
function roundSplit(meta) {
  const t = plain(meta.tokens) ? meta.tokens : null, u = plain(meta.usage) ? meta.usage : null;
  if (t) return Object.fromEntries(['input', 'cached', 'write', 'output'].map(k => [k, num(t[k]) ?? 0]));
  if (!u) return null;
  const split = roundTokens(u, { codex: meta.reviewer === 'codex' || 'cached_input_tokens' in u });
  if (split) return split;
  const input = num(u.input_tokens) ?? num(u.inputTokens), output = num(u.output_tokens) ?? num(u.outputTokens);
  return input === null && output === null ? null : { input: input ?? 0, cached: 0, write: 0, output: output ?? 0 };
}

// 0527: each build, review round and watch agent run of ticket `id` that spent anything: {part, ended, tokens, cost_usd,
// models}, part 'builder', 'reviewer' or 'watch', ended the time it ended (a build's exited, a round's saved_at, a watch
// run's ended) or null when it's not known, and models each model it ran on as {model, tokens, cost_usd}, the model null
// when it isn't known and the tokens null when they weren't split.
export function spendParts(runs, id, rounds) {
  const rec = /^[\w-]+$/.test(String(id ?? '')) ? readRecord(runs, String(id)) : null;
  const time = v => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null);
  const builds = buildsOf(runs, id).map((b, i, all) => ({ part: 'builder', ...b, ended: time(i === all.length - 1 ? rec?.exited : b.ended) }));
  const reviews = (Array.isArray(rounds) ? rounds : []).map(r => {
    const meta = plain(r) && plain(r.meta) ? r.meta : {}, spent = roundSpent(r);
    const split = roundSplit(meta);
    return { part: 'reviewer', ended: time(meta.saved_at), ...spent, models: [{ model: usable(meta.model) ?? usable(meta.reviewer_model), tokens: split, cost_usd: spent.cost_usd }] };
  });
  const watch = watchOf(runs, id).map(x => ({ part: 'watch', ended: time(x.ended), tokens: num(x.tokens), cost_usd: num(x.cost_usd), models: modelsOf(x.models) }));
  return [...builds, ...reviews, ...watch].filter(x => x.tokens !== null || x.cost_usd !== null)
    .map(x => ({ ...x, models: x.models?.length ? x.models : [{ model: null, tokens: null, cost_usd: x.cost_usd }] }));
}

// 0527: the sums of `parts` (spendParts'): the sum of the known costs, or null when none is known, the sum of the known
// tokens, or null when none is known, and each part whose cost the total leaves out, in part, because a build, round
// or run of it has tokens but no cost: 'builder', 'reviewer' or 'watch', in that order.
export function sumParts(parts) {
  const add = (t, v) => (v === null ? t : Math.round(((t ?? 0) + v) * 1e10) / 1e10);
  let cost = null, tokens = null;
  for (const x of parts) { cost = add(cost, num(x.cost_usd)); tokens = add(tokens, num(x.tokens)); }
  const unknown = ['builder', 'reviewer', 'watch'].filter(p => parts.some(x => x.part === p && num(x.cost_usd) === null && num(x.tokens) > 0));
  return { total_cost_usd: cost, total_tokens: tokens, total_cost_unknown: unknown };
}

// 0526: ticket `id`'s total AI spend, from the builds and watch agent runs kept in `runs` and its saved review rounds:
// sumParts of its spendParts (0527), so speck status and speck spend never disagree.
export function totalSpent(runs, id, rounds) {
  return sumParts(spendParts(runs, id, rounds));
}

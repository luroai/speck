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
// round's session, is that round's usage: Codex reports a resumed session's totals, so each count is less that one's,
// and the round's tokens are unknown when that round reported none.
export function roundTokens(usage, { codex = false, before } = {}) {
  if (!plain(usage)) return null;
  const keys = shapeOf(usage, codex);
  let raw = keys.map(k => num(usage[k]));
  if (raw[0] === null && raw[3] === null) return null;
  raw = raw.map(v => v ?? 0);
  if (before !== undefined) {
    const was = plain(before) ? keys.map(k => num(before[k])) : [];
    if (!was.length || (was[0] === null && was[3] === null)) return null;
    raw = raw.map((v, i) => v - (was[i] ?? 0));
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

const CODEX_HOME = () => process.env.CODEX_HOME || path.join(os.homedir(), '.codex');

// Every rollout file in `home`'s sessions folder (sessions/YYYY/MM/DD/rollout-<time>-<thread>.jsonl), or only those for
// thread `thread` when it's given.
function rollouts(home, thread) {
  const files = [];
  const walk = (dir, depth) => {
    let names;
    try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of names) {
      const p = path.join(dir, d.name);
      if (d.isDirectory() && depth < 3) walk(p, depth + 1);
      else if (d.isFile() && d.name.startsWith('rollout-') && d.name.endsWith(thread ? `-${thread}.jsonl` : '.jsonl')) files.push(p);
    }
  };
  walk(path.join(home, 'sessions'), 0);
  return files;
}

// The model a session file's text records: its last turn's, or null.
function lastModel(text) {
  let found = null;
  for (const line of text.split('\n')) {
    if (!line.includes('"turn_context"')) continue;
    try { const o = JSON.parse(line); if (o?.type === 'turn_context' && usable(o.payload?.model)) found = o.payload.model.trim(); } catch { /* not an event */ }
  }
  return found;
}

// The model Codex's session file records for thread `thread`, in `home`'s sessions folder
// (sessions/YYYY/MM/DD/rollout-<time>-<thread>.jsonl): the last turn's, or null when there's no such file or model.
export function codexModel(thread, home = CODEX_HOME()) {
  if (typeof thread !== 'string' || !/^[\w-]+$/.test(thread)) return null;
  let model = null, newest = -Infinity;
  for (const f of rollouts(home, thread)) {
    let text, at;
    try { text = fs.readFileSync(f, 'utf8'); at = fs.statSync(f).mtimeMs; } catch { continue; }
    const found = lastModel(text);
    if (found && at >= newest) { model = found; newest = at; }
  }
  return model;
}

// The first line of `file`, read a piece at a time so a long session file isn't read whole, or null when it can't be
// read or has no line within 4 MB.
function firstLine(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const parts = [], buf = Buffer.alloc(65536);
    for (let pos = 0, size = 0; size < 4 << 20;) {
      const got = fs.readSync(fd, buf, 0, buf.length, pos);
      if (!got) break;
      const nl = buf.subarray(0, got).indexOf(10);
      parts.push(Buffer.from(buf.subarray(0, nl < 0 ? got : nl)));
      if (nl >= 0) return Buffer.concat(parts).toString('utf8');
      pos += got; size += got;
    }
    return parts.length && size < 4 << 20 ? Buffer.concat(parts).toString('utf8') : null;
  } catch { return null; } finally { if (fd !== undefined) try { fs.closeSync(fd); } catch { /* closed */ } }
}

// 0532: every sub-agent session in `home`'s sessions folder that thread `thread` started, and those they started in
// turn, however deep, each once and never `thread` itself: [{thread, model, usage}], model the one its session file
// records and usage its last token_count's total_token_usage. A sub-agent's session_meta names the thread that started
// it as source.subagent.thread_spawn.parent_thread_id. A file that can't be read or parsed, or that has no usage yet, is
// left out, and when a session has several files, the newest one with usage counts.
export function codexSubagents(thread, home = CODEX_HOME()) {
  if (typeof thread !== 'string' || !/^[\w-]+$/.test(thread)) return [];
  const children = new Map(); // parent thread -> [{id, file}]
  for (const { file, meta } of sessionMetas(home)) {
    const id = usable(meta.payload?.id), parent = usable(meta.payload?.source?.subagent?.thread_spawn?.parent_thread_id);
    if (!id || !parent) continue;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push({ id, file });
  }
  const seen = new Set([thread]), found = [], queue = [thread];
  while (queue.length) {
    const ids = new Map();
    for (const c of children.get(queue.shift()) ?? []) if (!seen.has(c.id)) { if (!ids.has(c.id)) ids.set(c.id, []); ids.get(c.id).push(c.file); }
    for (const [id, files] of ids) {
      seen.add(id); queue.push(id);
      const best = sessionUsage(files);
      if (best) found.push({ thread: id, model: best.model, usage: best.usage });
    }
  }
  return found;
}

// The session_meta line of each rollout file in `home`'s sessions folder: [{file, meta}], leaving out a file whose first
// line can't be read or parsed or isn't a session_meta.
function sessionMetas(home) {
  return rollouts(home).flatMap(file => {
    let meta;
    try { meta = JSON.parse(firstLine(file) ?? ''); } catch { return []; }
    return plain(meta) && meta.type === 'session_meta' && plain(meta.payload) ? [{ file, meta }] : [];
  });
}

// What a session's files `files` record: {at, model, usage} from the newest one with usage, at its last change, model
// the one it records and usage its last token_count's total_token_usage, or null when none can be read or has usage.
function sessionUsage(files) {
  let best = null;
  for (const f of files) {
    let text, at;
    try { text = fs.readFileSync(f, 'utf8'); at = fs.statSync(f).mtimeMs; } catch { continue; }
    let usage = null;
    for (const line of text.split('\n')) {
      if (!line.includes('"token_count"')) continue;
      try { const o = JSON.parse(line); const u = o?.payload?.type === 'token_count' ? o.payload.info?.total_token_usage : null; if (plain(u)) usage = u; } catch { /* not an event */ }
    }
    if (usage && roundTokens(usage, { codex: true }) && (!best || at >= best.at)) best = { at, model: lastModel(text), usage };
  }
  return best;
}

// 0534: each Codex session whose session_meta gives as its cwd the folder `dir` or one inside it, in `home`'s sessions
// folder: [{thread, ancestors, ended, model, usage}], ancestors the threads that started it, nearest first, as their
// session files name them, ended the time its files last changed, and model and usage as sessionUsage gives them, both
// null for a session with no usage yet. A file that can't be read or parsed is left out.
export function codexSessionsIn(dir, home = CODEX_HOME()) {
  const real = p => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
  let root;
  try { root = fs.realpathSync(dir); } catch { return []; }
  const inside = cwd => {
    if (typeof cwd !== 'string' || !path.isAbsolute(cwd)) return false;
    const rel = path.relative(root, real(cwd));
    return rel === '' || (rel.split(path.sep)[0] !== '..' && !path.isAbsolute(rel));
  };
  const parents = new Map(), files = new Map(); // thread -> the thread that started it; thread -> its files here
  for (const { file, meta } of sessionMetas(home)) {
    const id = usable(meta.payload.id), parent = usable(meta.payload.source?.subagent?.thread_spawn?.parent_thread_id);
    if (!id || !/^[\w-]+$/.test(id)) continue;
    if (parent) parents.set(id, parent);
    if (!inside(meta.payload.cwd)) continue;
    if (!files.has(id)) files.set(id, []);
    files.get(id).push(file);
  }
  const ancestorsOf = thread => {
    const up = [], seen = new Set([thread]);
    for (let t = parents.get(thread); t && !seen.has(t); t = parents.get(t)) { seen.add(t); up.push(t); }
    return up;
  };
  return [...files].flatMap(([thread, list]) => {
    const best = sessionUsage(list);
    const at = best?.at ?? Math.max(...list.map(f => { try { return fs.statSync(f).mtimeMs; } catch { return -Infinity; } }));
    if (!Number.isFinite(at)) return [];
    return [{ thread, ancestors: ancestorsOf(thread), ended: new Date(at).toISOString(), model: best?.model ?? null, usage: best?.usage ?? null }];
  });
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

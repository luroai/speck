// 0528: speck spend --backfill, what past tickets spent before speck recorded all of it: builds and watch agent runs
// from this project's Claude Code transcripts, and review rounds from the tokens they saved.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { priceTable, findRates, costOf } from './prices.mjs';
import { roundTokens, codexModel } from './round-cost.mjs';
import { SpeckError } from './core.mjs';
import { runRecord, jsonLines, watchRuns, WATCH_SPEND, BACKFILL_BUILDS, BACKFILL_ROUNDS } from './spend.mjs';

const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const usable = v => (typeof v === 'string' && v.trim() && v !== 'default' ? v.trim() : null);
const pad = id => String(id).padStart(4, '0');
const KEYS = ['input', 'cached', 'write', 'output'];
// A session whose last message is this close to when an earlier build or watch run without a session ended is that one.
const SAME_RUN_MS = 5 * 60 * 1000;

// The folder Claude Code keeps the transcripts of sessions started in `dir` in, under `home`: the folder's absolute path
// with every character that isn't a letter or a digit turned into `-`.
export function transcriptsDir(dir, home = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')) {
  return path.join(home, 'projects', path.resolve(dir).replace(/[^a-zA-Z0-9]/g, '-'));
}

// The text of a transcript message's content: a string, or its first text block.
const textOf = c => (typeof c === 'string' ? c : Array.isArray(c) ? (c.find(b => plain(b) && b.type === 'text' && typeof b.text === 'string')?.text ?? '') : '');

// What a first prompt asks for: {kind: 'build' | 'watch', id}, or null for anything else. A build's is `/speck-build
// <id>`, as Claude Code writes a slash command; a watch agent's is the brief speck run starts it with.
export function promptKind(text) {
  const t = String(text ?? '').trim();
  const b = /^(?:<command-message>[^<]*<\/command-message>\s*)?<command-name>\/speck-build<\/command-name>\s*<command-args>\s*(\d+)\s*<\/command-args>$/.exec(t)
    ?? /^\/speck-build\s+(\d+)$/.exec(t);
  if (b) return { kind: 'build', id: pad(b[1]) };
  const w = /^You are speck(?:'s Foreman|, watching the pipeline)\. Work on ticket (\d+) stopped/.exec(t);
  return w ? { kind: 'watch', id: pad(w[1]) } : null;
}

// What `tokens` cost at `model`'s rates, or null when it has none or the table can't be read.
function priced(model, tokens) {
  if (!model || !tokens) return null;
  try { return costOf(findRates(priceTable(), model), tokens); } catch { return null; }
}

// What the session in transcript `file` spent: {prompt, ended, tokens, cost_usd, models}, over every message in it and
// in its subagents' transcripts (<session>/subagents/*.jsonl), each message counted once however many lines repeat it,
// each count its largest, as a message's lines are written while it streams. models is each model with its tokens
// split into {input, cached, write, output} and priced from the price table; cost_usd is their sum, or null when any
// model has no rates. ended is the session's last message's time. Null when the file can't be read.
export function sessionSpend(file) {
  const files = [file];
  const subs = path.join(file.replace(/\.jsonl$/, ''), 'subagents');
  try { for (const n of fs.readdirSync(subs).sort()) if (n.endsWith('.jsonl')) files.push(path.join(subs, n)); } catch { /* no subagents */ }
  const messages = new Map();
  let prompt = null, ended = null, read = false;
  files.forEach((f, fi) => {
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch { return; }
    if (fi === 0) read = true;
    text.split('\n').forEach((line, li) => {
      if (!line.startsWith('{')) return;
      let o;
      try { o = JSON.parse(line); } catch { return; }
      if (!plain(o)) return;
      if (typeof o.timestamp === 'string' && !Number.isNaN(Date.parse(o.timestamp)) && (!ended || Date.parse(o.timestamp) > Date.parse(ended))) ended = o.timestamp;
      const m = plain(o.message) ? o.message : null;
      if (fi === 0 && prompt === null && o.type === 'user' && !o.isMeta && m) prompt = textOf(m.content);
      if (o.type !== 'assistant' || !m || !usable(m.model) || m.model === '<synthetic>') return;
      const split = roundTokens(plain(m.usage) ? m.usage : null);
      if (!split) return;
      const key = typeof m.id === 'string' && m.id ? m.id : `${fi}:${li}`, was = messages.get(key);
      messages.set(key, { model: m.model.trim(), tokens: was ? Object.fromEntries(KEYS.map(k => [k, Math.max(was.tokens[k], split[k])])) : split });
    });
  });
  if (!read) return null;
  const byModel = new Map();
  for (const { model, tokens } of messages.values()) {
    const t = byModel.get(model) ?? Object.fromEntries(KEYS.map(k => [k, 0]));
    for (const k of KEYS) t[k] += tokens[k];
    byModel.set(model, t);
  }
  const models = [...byModel.entries()].filter(([, t]) => KEYS.some(k => t[k] > 0)).map(([model, tokens]) => ({ model, tokens, cost_usd: priced(model, tokens) }));
  const tokens = models.reduce((n, m) => n + KEYS.reduce((a, k) => a + m.tokens[k], 0), 0);
  const cost = models.some(m => m.cost_usd === null) ? null : Math.round(models.reduce((c, m) => c + m.cost_usd, 0) * 1e10) / 1e10;
  return { prompt, ended, tokens, cost_usd: cost, models };
}

// True when one of `ends` (times a build or run without a session ended) is within SAME_RUN_MS of `at`, taking it out
// of `ends` so it matches one session only.
function takeNear(ends, at) {
  const t = Date.parse(at);
  const i = ends.findIndex(e => Math.abs(Date.parse(e) - t) <= SAME_RUN_MS);
  if (i < 0) return false;
  ends.splice(i, 1);
  return true;
}

// The spend a review round saved without a cost would have: {model, tokens, cost_usd}, from the tokens it saved, or its
// usage, and its reviewer_model. A Codex round saved with `default` is priced at the model Codex's session file records
// for its thread. A Codex round that carried on an earlier round's thread reported the thread's totals, so that round's
// usage is taken out. Null when it saved no tokens.
function roundSpend(meta, earlier, codexHome) {
  const codex = meta.reviewer === 'codex';
  let tokens = null;
  if (plain(meta.tokens)) tokens = Object.fromEntries(KEYS.map(k => [k, num(meta.tokens[k]) ?? 0]));
  else if (plain(meta.usage)) {
    const before = codex && meta.thread_id ? [...earlier].reverse().find(r => r.thread_id === meta.thread_id) : null;
    tokens = roundTokens(meta.usage, { codex: codex || 'cached_input_tokens' in meta.usage, ...(before ? { before: before.usage ?? null } : {}) });
    if (!tokens && !before) return null;
  } else return null;
  const model = usable(meta.model) || usable(meta.reviewer_model) || (codex ? codexModel(meta.thread_id, codexHome) : null);
  return { model, tokens, cost_usd: priced(model, tokens) };
}

// Recovers past spend for `tickets` ([{id, rounds}]) of the project whose main checkout is `repo`, keeping it in `runs`:
// each /speck-build session and watch agent session in the project's Claude Code transcripts that isn't counted yet,
// and a cost for each review round saved without one. A session is counted when its ticket's run record names it with
// spend, an earlier build or watch run without a session ended within SAME_RUN_MS of its last message, or --backfill
// kept it before; a build session its record names that hasn't exited yet is left for speck run to record. Returns
// {transcripts, found, tickets: {<id>: {builds, watch, rounds, skipped, unknown}}}.
export function backfill({ repo, runs, tickets, claudeHome, codexHome }) {
  const dir = transcriptsDir(repo, claudeHome);
  const counts = {};
  const of = id => (counts[id] ??= { builds: 0, watch: 0, rounds: 0, skipped: 0, unknown: 0 });
  const out = { builds: [], watch: [], rounds: [] };
  let names = null;
  try { names = fs.readdirSync(dir).filter(n => n.endsWith('.jsonl')).sort(); } catch { /* no transcripts here */ }

  const keptBuilds = new Set(jsonLines(runs, BACKFILL_BUILDS).map(b => `${b.id} ${b.session}`));
  const watches = watchRuns(runs);
  const counted = new Map();
  const countedFor = (kind, id) => {
    const k = `${kind} ${id}`;
    if (counted.has(k)) return counted.get(k);
    const c = { sessions: new Set(), ends: [], running: null };
    if (kind === 'build') {
      const rec = runRecord(runs, id);
      const spent = b => plain(b) && (num(b.tokens) !== null || num(b.cost_usd) !== null);
      for (const b of rec && Array.isArray(rec.earlier_builds) ? rec.earlier_builds : []) {
        if (!spent(b)) continue;
        if (typeof b.session === 'string') c.sessions.add(b.session);
        else if (typeof b.ended === 'string' && !Number.isNaN(Date.parse(b.ended))) c.ends.push(b.ended);
      }
      if (rec && typeof rec.session === 'string') {
        if (spent(rec.builder)) c.sessions.add(rec.session);
        else if (typeof rec.exited !== 'string') c.running = rec.session;
      }
    } else {
      for (const w of watches.filter(x => x.id === id)) {
        if (typeof w.session === 'string') c.sessions.add(w.session);
        else if (typeof w.ended === 'string' && !Number.isNaN(Date.parse(w.ended))) c.ends.push(w.ended);
      }
    }
    counted.set(k, c);
    return c;
  };

  for (const name of names ?? []) {
    const session = name.slice(0, -'.jsonl'.length);
    if (!/^[\w-]+$/.test(session)) continue;
    const spent = sessionSpend(path.join(dir, name));
    const what = spent && promptKind(spent.prompt);
    if (!what || !spent.models.length) continue;
    const c = countedFor(what.kind, what.id), n = of(what.id);
    const already = c.sessions.has(session) || c.running === session || (what.kind === 'build' && keptBuilds.has(`${what.id} ${session}`))
      || (spent.ended && takeNear(c.ends, spent.ended));
    if (already) { n.skipped++; continue; }
    c.sessions.add(session);
    const entry = { id: what.id, session, ended: spent.ended, tokens: spent.tokens, cost_usd: spent.cost_usd, models: spent.models };
    if (what.kind === 'build') { out.builds.push(entry); n.builds++; } else { out.watch.push({ id: what.id, run: `backfill:${session}`, ...entry }); n.watch++; }
    if (spent.cost_usd === null) n.unknown++;
  }

  const keptRounds = new Set(jsonLines(runs, BACKFILL_ROUNDS).map(x => `${x.id} ${x.round} ${x.saved_at}`));
  for (const t of tickets) {
    const id = pad(t.id), earlier = [];
    for (const r of Array.isArray(t.rounds) ? t.rounds : []) {
      const meta = plain(r) && plain(r.meta) ? r.meta : null;
      if (!meta) continue;
      const key = `${id} ${meta.round} ${meta.saved_at ?? null}`;
      if (num(meta.cost_usd) !== null || keptRounds.has(key)) { of(id).skipped++; earlier.push(meta); continue; }
      const spend = roundSpend(meta, earlier, codexHome);
      earlier.push(meta);
      if (!spend) continue;
      keptRounds.add(key);
      out.rounds.push({ id, round: meta.round, saved_at: meta.saved_at ?? null, ...spend });
      of(id).rounds++;
      if (spend.cost_usd === null) of(id).unknown++;
    }
  }

  const append = (file, list) => { if (list.length) fs.appendFileSync(path.join(runs, file), list.map(x => `${JSON.stringify(x)}\n`).join('')); };
  try {
    if (out.builds.length + out.watch.length + out.rounds.length) fs.mkdirSync(runs, { recursive: true });
    append(BACKFILL_BUILDS, out.builds);
    append(WATCH_SPEND, out.watch);
    append(BACKFILL_ROUNDS, out.rounds);
  } catch (e) {
    throw new SpeckError(`speck couldn't keep the spend it recovered in ${runs} (${e.code || e.message}). Check you can write to that folder, then run speck spend --backfill again.`);
  }
  return { transcripts: dir, found: names !== null, tickets: counts };
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The lines speck spend --backfill prints for `report` (backfill's): one for each ticket it added to or skipped for,
// then the totals, after a line saying so when the project has no transcripts folder.
export function backfillLines(report) {
  const lines = report.found ? [] : [`No Claude Code transcripts for this project in ${report.transcripts}, so only review rounds were added.`];
  const ids = Object.keys(report.tickets).sort();
  const sum = k => ids.reduce((n, id) => n + report.tickets[id][k], 0);
  for (const id of ids) {
    const c = report.tickets[id];
    lines.push(`${id}: added ${plural(c.builds, 'build session')}, ${plural(c.watch, 'watch agent session')} and ${plural(c.rounds, 'review round')}; skipped ${c.skipped} as already counted; ${c.unknown} added with an unknown cost.`);
  }
  lines.push(`Added ${plural(sum('builds') + sum('watch'), 'session')} and ${plural(sum('rounds'), 'review round')} across ${plural(ids.filter(id => report.tickets[id].builds + report.tickets[id].watch + report.tickets[id].rounds).length, 'ticket')}; skipped ${sum('skipped')} as already counted; ${sum('unknown')} added with an unknown cost.`);
  return lines;
}

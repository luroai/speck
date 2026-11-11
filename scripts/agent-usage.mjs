// 0642: each agent's latest usage, as it reports it with every run: for Claude Code, the rate_limit_event lines of its
// stream-json log; for Codex, the token_count events of its session file. Kept per agent for this machine in the main
// checkout's speck/.cache/machine/usage/, which git ignores, a newer reading replacing an older one. A run with no
// reading leaves the last one as it was. Each reading has read_at, when speck read it, and Codex's also reported_at,
// when Codex wrote it, which says which of two readings is newer. 0643: Cursor reports none with a run, so speck reads
// it from Cursor's usage screen (cursor-usage.mjs) when `speck agents` runs, if the last reading is more than
// CURSOR_STALE_MS old or a Cursor run has ended since.

import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { machineConfigFile } from './machine.mjs';
import { sharedCacheDir } from './turns.mjs';
import { rollouts } from './round-cost.mjs';
import { threadId } from './codex-build.mjs';
import { configBuilder } from './build-model.mjs';

export const USAGE_AGENTS = Object.freeze(['claude', 'codex', 'cursor']);
export const CURSOR_STALE_MS = 10 * 60_000;
export const usageDir = repo => path.join(path.dirname(machineConfigFile(repo)), 'usage');

const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const percent = v => (v === null ? null : Math.round(v * 10) / 10);
const isoOf = secs => (num(secs) !== null && secs > 0 ? new Date(secs * 1000).toISOString() : null);
const isoTime = v => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? new Date(Date.parse(v)).toISOString() : null);
const jsonLines = text => String(text ?? '').split('\n').filter(l => l.startsWith('{')).flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });

// Claude's latest usage in its stream-json log `text`, or null when it has none: { read_at, windows }, each window
// (five_hour, seven_day) { used_percent, resets_at, refused }. A window is refused when the event's status is rejected
// for it, or when it gives its own status as rejected.
export function claudeUsageInLog(text, now = Date.now()) {
  let found = null;
  for (const e of jsonLines(text)) {
    if (e?.type !== 'rate_limit_event' || !plain(e.rate_limit_info?.unifiedWindows)) continue;
    const info = e.rate_limit_info, windows = {};
    for (const [name, w] of Object.entries(info.unifiedWindows)) {
      if (!['five_hour', 'seven_day'].includes(name) || !plain(w)) continue;
      const used = num(w.utilization);
      windows[name] = { used_percent: used === null ? null : percent(used * 100), resets_at: isoOf(w.resetsAt),
        refused: w.status === 'rejected' || (info.status === 'rejected' && info.rateLimitType === name) };
    }
    if (Object.keys(windows).length) found = windows;
  }
  return found && { read_at: new Date(now).toISOString(), windows: found };
}

// Codex's windows by length: 300 minutes is the five-hour one and 10080 the weekly one.
const CODEX_WINDOWS = { 300: 'five_hour', 10080: 'seven_day' };

// Codex's latest usage in a session file's text, or null when it has none: { read_at, reported_at, plan,
// limit_reached, limit_type, windows }, each window { used_percent, resets_at }. read_at is `now`, and reported_at when
// Codex wrote it, or `now` when its event has no time.
export function codexUsageInSession(text, now = Date.now()) {
  let found = null;
  for (const e of jsonLines(text)) {
    const p = e?.payload;
    if (e?.type !== 'event_msg' || p?.type !== 'token_count' || !plain(p.rate_limits)) continue;
    const r = p.rate_limits, windows = {};
    for (const [key, fallback] of [['primary', 'five_hour'], ['secondary', 'seven_day']]) {
      const w = r[key];
      if (!plain(w)) continue;
      windows[CODEX_WINDOWS[w.window_minutes] ?? fallback] = { used_percent: percent(num(w.used_percent)), resets_at: isoOf(w.resets_at) };
    }
    if (!Object.keys(windows).length) continue;
    const reached = typeof r.rate_limit_reached_type === 'string' && r.rate_limit_reached_type ? r.rate_limit_reached_type : null;
    found = { read_at: new Date(now).toISOString(), reported_at: isoTime(e.timestamp) ?? new Date(now).toISOString(), plan: typeof r.plan_type === 'string' && r.plan_type ? r.plan_type : null,
      limit_reached: reached !== null, limit_type: reached, windows };
  }
  return found;
}

// When a reading was reported, for which of two is newer: Codex's reported_at, or else when it was read.
const newer = reading => Date.parse(isoTime(reading.reported_at) ?? reading.read_at);

const CODEX_HOME = () => process.env.CODEX_HOME || path.join(os.homedir(), '.codex');

// Codex's latest usage in the session files of thread `thread`, the newest reading among them, or null.
export function codexUsage(thread, { home = CODEX_HOME(), now = Date.now() } = {}) {
  if (typeof thread !== 'string' || !/^[\w-]+$/.test(thread)) return null;
  let best = null;
  for (const f of rollouts(home, thread)) {
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const got = codexUsageInSession(text, now);
    if (got && (!best || newer(got) >= newer(best))) best = got;
  }
  return best;
}

// Each reading is a file of its own in its agent's folder, named by when it was reported, so runs ending at once never
// write the same file and need no lock: the newest file is the reading, and only files older than one already there
// are removed. A file is written under a name starting with a dot, then renamed, so it's never read half written.
const NAME = /^(\d{15})-[\w-]+\.json$/;
const agentDir = (repo, agent) => path.join(usageDir(repo), agent);
const timeOf = name => Number(name.slice(0, 15));
const valid = v => plain(v) && isoTime(v.read_at) && plain(v.windows);
function readingNames(dir) {
  let names;
  try { names = fs.readdirSync(dir); } catch { return []; }
  return names.filter(n => NAME.test(n)).sort().reverse();
}

// `agent`'s reading, the newest that can be read, or null.
function latest(repo, agent) {
  const dir = agentDir(repo, agent);
  for (const name of readingNames(dir)) {
    try { const v = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); if (valid(v)) return v; } catch { /* removed meanwhile, or unreadable */ }
  }
  return null;
}

// This machine's readings, { claude?, codex?, cursor? }, or {} when there are none.
export function readUsage(repo) {
  return Object.fromEntries(USAGE_AGENTS.map(a => [a, latest(repo, a)]).filter(([, v]) => v));
}

// Keeps `reading` as `agent`'s, unless the one kept is newer. Returns true when it was kept.
export function saveUsage(repo, agent, reading) {
  if (!USAGE_AGENTS.includes(agent) || !valid(reading)) return false;
  const at = newer(reading);
  if (!Number.isFinite(at) || at < 0) return false;
  const dir = sharedCacheDir(repo, path.join('machine', 'usage', agent));
  const top = readingNames(dir)[0];
  if (top && timeOf(top) > at) return false;
  const name = `${String(at).padStart(15, '0')}-${process.pid}-${crypto.randomUUID().slice(0, 8)}.json`, tmp = path.join(dir, `.${name}.tmp`);
  fs.writeFileSync(tmp, `${JSON.stringify(reading, null, 2)}\n`);
  fs.renameSync(tmp, path.join(dir, name));
  for (const n of readingNames(dir)) if (timeOf(n) < at) fs.rmSync(path.join(dir, n), { force: true });
  return true;
}

// The reading in a run's output `text` on `agent`: Claude's from its stream-json lines, Codex's from the session file
// of the thread its --json lines name, or `thread` when given. null for any other agent, or when there's none.
export function usageOfRun(agent, text, { thread, home, now = Date.now() } = {}) {
  if (agent === 'claude') return claudeUsageInLog(text, now);
  if (agent === 'codex') return codexUsage(thread || threadId(text), { home, now });
  return null;
}

// Keeps the usage a run on `agent` reported, its output being `text`. Never throws: a reading that can't be kept is
// said on stderr, and the run carries on as it would have. Returns true when a reading was kept.
export function keepUsage(repo, agent, text, opts = {}) {
  if (agent === 'cursor') { cursorRan(repo, opts.now); return false; }
  try { return saveUsage(repo, agent, usageOfRun(agent, text, opts)); }
  catch (e) { console.error(`Couldn't keep ${agent}'s usage for this machine (${e.message}).`); return false; }
}

// The same for a run whose output is in the file `log`.
export function keepUsageOfLog(repo, agent, log, opts = {}) {
  if (!USAGE_AGENTS.includes(agent)) return false;
  if (agent === 'cursor') return keepUsage(repo, agent, '', opts);
  let text;
  try { text = fs.readFileSync(log, 'utf8'); } catch { return false; }
  return keepUsage(repo, agent, text, opts);
}

// A build that ended: its agent as its run record names it, or else the builder `cfg` gives.
export function keepBuildUsage(repo, recordFile, log, cfg) {
  let rec = null;
  try { rec = JSON.parse(fs.readFileSync(recordFile, 'utf8')); } catch { /* the settings' builder */ }
  const agent = (plain(rec) && typeof rec.agent === 'string' && rec.agent) || configBuilder(cfg);
  return keepUsageOfLog(repo, agent, log, { thread: plain(rec) && agent === 'codex' && typeof rec.session === 'string' ? rec.session : undefined });
}

// 0643: when a Cursor run speck started last ended, kept in the usage folder, so the next `speck agents` reads Cursor's
// usage again. Never throws.
const cursorRanFile = repo => path.join(usageDir(repo), 'cursor-ran');
function cursorRan(repo, now = Date.now()) {
  try {
    const file = path.join(sharedCacheDir(repo, path.join('machine', 'usage')), 'cursor-ran'), tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${new Date(now).toISOString()}\n`);
    fs.renameSync(tmp, file);
  } catch (e) { console.error(`Couldn't note that a Cursor run ended (${e.message}).`); }
}

// Whether Cursor's usage should be read again: there's no reading, it's more than CURSOR_STALE_MS old, or a Cursor run
// has ended since it was read.
export function cursorUsageStale(repo, now = Date.now()) {
  const reading = latest(repo, 'cursor');
  if (!reading) return true;
  const at = Date.parse(reading.read_at);
  if (now - at > CURSOR_STALE_MS) return true;
  let ran = NaN;
  try { ran = Date.parse(fs.readFileSync(cursorRanFile(repo), 'utf8').trim()); } catch { /* none has ended */ }
  return Number.isFinite(ran) && ran >= at;
}

const NAMES = { five_hour: 'five-hour', seven_day: 'weekly', included: 'included', auto: 'Auto', api: 'API' };

// How long ago `iso` was, in words.
export function agoIn(iso, now = Date.now()) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  const say = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (s < 60) return 'just now';
  if (s < 3600) return say(Math.floor(s / 60), 'minute');
  if (s < 86400) return say(Math.floor(s / 3600), 'hour');
  return say(Math.floor(s / 86400), 'day');
}

const resetIn = (iso, day) => (iso ? `resets ${iso.slice(0, 16).replace('T', ' ')} UTC` : day ? `resets ${day}` : 'reset time unknown');
const dollars = n => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

// `speck agents`' lines for a reading, indented under its agent.
export function usageLines(reading, now = Date.now()) {
  const head = [`Usage, read ${agoIn(reading.read_at, now)}`, ...(reading.plan ? [`${reading.plan} plan`] : []), ...(reading.limit_reached ? ['limit reached'] : [])];
  const windows = Object.entries(reading.windows).map(([name, w]) =>
    `    ${NAMES[name] ?? name}: ${w.used_percent === null || w.used_percent === undefined ? '?' : w.used_percent}% used, ${resetIn(w.resets_at, reading.resets_on)}${w.refused ? ', refused' : ''}`);
  const od = reading.on_demand; // 0643: Cursor's
  const onDemand = plain(od) && num(od.spent) !== null ? [`    on-demand: ${dollars(od.spent)} spent, ${num(od.limit) === null ? 'no monthly limit' : `${dollars(od.limit)} monthly limit`}`] : [];
  return [`  ${head.join(', ')}:`, ...windows, ...onDemand];
}

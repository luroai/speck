// 0642: each agent's latest usage, as it reports it with every run: for Claude Code, the rate_limit_event lines of its
// stream-json log; for Codex, the token_count events of its session file. Kept per agent for this machine in the main
// checkout's speck/.cache/machine/usage.json, which git ignores, a newer reading replacing an older one. A run with no
// reading leaves the last one as it was. Each reading has read_at, when speck read it, and Codex's also reported_at,
// when Codex wrote it, which says which of two readings is newer.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { machineConfigFile } from './machine.mjs';
import { sharedCacheDir } from './turns.mjs';
import { rollouts } from './round-cost.mjs';
import { threadId } from './codex-build.mjs';
import { configBuilder } from './build-model.mjs';

export const USAGE_AGENTS = Object.freeze(['claude', 'codex']);
export const usageFile = repo => path.join(path.dirname(machineConfigFile(repo)), 'usage.json');

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

// This machine's readings, { claude?, codex? }, or {} when there are none or the file can't be read.
export function readUsage(repo) {
  let read;
  try { read = JSON.parse(fs.readFileSync(usageFile(repo), 'utf8')); } catch { return {}; }
  if (!plain(read)) return {};
  return Object.fromEntries(USAGE_AGENTS.filter(a => plain(read[a]) && isoTime(read[a].read_at) && plain(read[a].windows)).map(a => [a, read[a]]));
}

const LOCK_WAIT_MS = 5000, LOCK_STALE_MS = 30000;
const pause = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// How long ago `file` last changed, in ms, or null when it's gone.
const ageOf = file => { try { return Date.now() - fs.statSync(file).mtimeMs; } catch { return null; } };
const take = file => { try { fs.writeFileSync(file, `${process.pid}\n`, { flag: 'wx' }); return true; } catch (e) { if (e.code !== 'EEXIST') throw e; return false; } };

// Removes `lock` if a process that died left it, holding `lock`.stale while it checks again and removes it, so two
// processes taking over the same lock can't remove the one either of them has made since. A guard left for
// LOCK_STALE_MS is removed in turn. True when it removed the lock.
function clearStale(lock) {
  const guard = `${lock}.stale`;
  if (!take(guard)) { if (ageOf(guard) > LOCK_STALE_MS) fs.rmSync(guard, { force: true }); return false; }
  try { if (ageOf(lock) > LOCK_STALE_MS) { fs.rmSync(lock, { force: true }); return true; } return false; } finally { fs.rmSync(guard, { force: true }); }
}

// Runs fn holding `file`.lock, so builds, review rounds and watch runs ending at once each read and write the file in
// turn rather than one undoing another. A lock left for LOCK_STALE_MS by a process that died is taken over.
function withLock(file, fn) {
  const lock = `${file}.lock`, until = Date.now() + LOCK_WAIT_MS;
  while (!take(lock)) {
    if (Date.now() > until) throw new Error(`another process has held ${lock} for over ${LOCK_WAIT_MS / 1000} seconds`);
    if (!(ageOf(lock) > LOCK_STALE_MS && clearStale(lock))) pause(10);
  }
  try { return fn(); } finally { fs.rmSync(lock, { force: true }); }
}

// Keeps `reading` as `agent`'s, unless the one kept is newer. Returns true when it was kept.
export function saveUsage(repo, agent, reading) {
  if (!USAGE_AGENTS.includes(agent) || !reading) return false;
  sharedCacheDir(repo, 'machine');
  const file = usageFile(repo);
  return withLock(file, () => {
    const all = readUsage(repo), was = all[agent];
    if (was && newer(was) > newer(reading)) return false;
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify({ ...all, [agent]: reading }, null, 2)}\n`);
    fs.renameSync(tmp, file);
    return true;
  });
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
  try { return saveUsage(repo, agent, usageOfRun(agent, text, opts)); }
  catch (e) { console.error(`Couldn't keep ${agent}'s usage for this machine (${e.message}).`); return false; }
}

// The same for a run whose output is in the file `log`.
export function keepUsageOfLog(repo, agent, log, opts = {}) {
  if (!USAGE_AGENTS.includes(agent)) return false;
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

const NAMES = { five_hour: 'five-hour', seven_day: 'weekly' };

// How long ago `iso` was, in words.
export function agoIn(iso, now = Date.now()) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  const say = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (s < 60) return 'just now';
  if (s < 3600) return say(Math.floor(s / 60), 'minute');
  if (s < 86400) return say(Math.floor(s / 3600), 'hour');
  return say(Math.floor(s / 86400), 'day');
}

const resetIn = iso => (iso ? `resets ${iso.slice(0, 16).replace('T', ' ')} UTC` : 'reset time unknown');

// `speck agents`' lines for a reading, indented under its agent.
export function usageLines(reading, now = Date.now()) {
  const head = [`Usage, read ${agoIn(reading.read_at, now)}`, ...(reading.plan ? [`${reading.plan} plan`] : []), ...(reading.limit_reached ? ['limit reached'] : [])];
  const windows = Object.entries(reading.windows).map(([name, w]) =>
    `    ${NAMES[name] ?? name}: ${w.used_percent === null || w.used_percent === undefined ? '?' : w.used_percent}% used, ${resetIn(w.resets_at)}${w.refused ? ', refused' : ''}`);
  return [`  ${head.join(', ')}:`, ...windows];
}

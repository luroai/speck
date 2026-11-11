// 0623: a reviewer's usage limit. A round the reviewer refuses for it ends `speck review` with a code of its own, and
// the build ends there, leaving a record of the limit for speck run, which resumes it from a minute after the reset.
// Each build's `speck review` writes only its own record, in the main checkout's runs folder, so none can undo another's.
import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, speckSays } from './core.mjs';
import { saveRecord } from './build-records.mjs';
import { BUILD_ENV } from './build-env.mjs';
import { mainCheckout } from './output.mjs';
import { GRACE_MS, RETRY_MS, FURTHEST_MS, clock, carryOn, usageLimitQueue, readLimit } from './usage-limit.mjs';

export const REVIEWER_LIMITED = 18;
const FOLDER = 'reviewer-limits'; // in the runs folder, so nothing that reads that folder's build records takes one for a build's
const IN_HAND = ['building', 'reviewing']; // a ticket whose build has more to do

const REFUSED = /\bhit your\b[^\n]*\blimit\b|\busage limit\b[^\n]*\b(?:reached|exceeded)\b|\b(?:reached|exceeded)\b[^\n]*\busage limit\b/i;
export const reviewerRefused = said => REFUSED.test(String(said ?? ''));

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const RESET_WORDS = /\b(?:try again at|resets?(?: at)?)\s+(?:([a-z]{3})[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(?:(\d{4}),?\s+)?(?:at\s+)?)?(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\b\.?(?:\s*\(([^)]+)\))?/i;
const HOUR_MS = 3600000;

// When the reviewer's message `said` says its limit resets, in ms, or null when it doesn't or can't be read. Codex gives
// the machine's local time, with a date only when that's another day: "try again at 3:41 AM", or "Oct 28th, 2026 3:41
// AM". Claude names its zone: "resets 12:30pm (UTC)". A clock time an hour or more ago means tomorrow.
export function resetIn(said, now = Date.now()) {
  const m = String(said ?? '').match(RESET_WORDS);
  if (!m) return null;
  const [, month, day, year, hour, minute = '0', half, zone] = m;
  const h = Number(hour), min = Number(minute), mo = month ? MONTHS.indexOf(month.toLowerCase()) : -1;
  if (h < 1 || h > 12 || min > 59 || (month && mo < 0)) return null;
  const utc = /^(?:utc|gmt)$/i.test(zone ?? '');
  if (zone && !utc && zone !== Intl.DateTimeFormat().resolvedOptions().timeZone) return null;
  const hours = (h % 12) + (half.toLowerCase() === 'p' ? 12 : 0);
  const at = (y, mon, d) => (utc ? new Date(Date.UTC(y, mon, d, hours, min)) : new Date(y, mon, d, hours, min));
  const today = new Date(now), y = utc ? today.getUTCFullYear() : today.getFullYear();
  if (month) {
    const made = at(year ? Number(year) : y, mo, Number(day));
    if ((utc ? made.getUTCMonth() : made.getMonth()) !== mo) return null; // Feb 31st
    return !year && made.getTime() < now - 864e5 ? at(y + 1, mo, Number(day)).getTime() : made.getTime();
  }
  const [mon, d] = utc ? [today.getUTCMonth(), today.getUTCDate()] : [today.getMonth(), today.getDate()];
  const made = at(y, mon, d).getTime();
  return made <= now - HOUR_MS ? at(y, mon, d + 1).getTime() : made;
}

const limitsDir = runs => path.join(runs, FOLDER);
const mainLimits = repo => limitsDir(path.join(mainCheckout(repo), 'speck', '.cache', 'runs'));
const fileName = /^[\w-]+\.json$/;
const parsed = (name, text) => {
  let s;
  try { s = JSON.parse(text); } catch { return null; }
  if (!s || typeof s !== 'object' || Array.isArray(s) || typeof s.reviewer !== 'string' || typeof s.session !== 'string' || !Number.isFinite(Date.parse(s.carry_on))) return null;
  if (s.resets !== null && !Number.isFinite(Date.parse(s.resets))) return null;
  const id = name.slice(0, -'.json'.length);
  return /^\d+$/.test(id) ? { ...s, id } : null;
};
const names = dir => { try { return fs.readdirSync(dir); } catch { return []; } };
const inDir = dir => names(dir).filter(n => fileName.test(n)).flatMap(n => { try { const s = parsed(n, fs.readFileSync(path.join(dir, n), 'utf8')); return s ? [s] : []; } catch { return []; } });

// The limits on record, each { id, reviewer, resets, carry_on, session }. carry_on is when speck run resumes the build.
export const readLimits = runs => inDir(limitsDir(runs));
// The tickets waiting to be carried on, for what says a stopped build needs you.
export const reviewerWaiting = runs => readLimits(runs).map(s => s.id);

// Ends a refused round: keeps the limit for speck run when a build it started ran the round, and says when it resets.
function refuse(repo, id, reviewer, { resets, carry_on }, why, session) {
  const dir = mainLimits(repo);
  let kept = !!session;
  if (session) {
    try { fs.mkdirSync(dir, { recursive: true }); saveRecord(path.join(dir, `${id}.json`), { reviewer, resets, carry_on, session }); }
    catch (e) { kept = false; console.error(`Couldn't save the record of the limit for speck run (${e.message}).`); }
  }
  const until = resets ? `is reached until ${resets.slice(0, 16).replace('T', ' ')} UTC` : 'is reached, and its message doesn\'t say when it resets';
  throw new SpeckError(`The ${reviewer} reviewer's usage limit ${until}, so no round was recorded.${why ? `\n${why}` : ''}\n${kept ? `End your session here and leave the ticket as it is: speck run resumes this build ${resets ? 'a minute after the reset' : 'after 30 minutes'}.` : 'Run the round again once the limit has reset.'}`, REVIEWER_LIMITED);
}

// Ends the round if the reviewer's failure `said` is its usage limit. Otherwise returns, for the caller to fail as usual.
export function stopOnLimit(repo, id, reviewer, said, { session = process.env[BUILD_ENV], now = Date.now() } = {}) {
  if (!reviewerRefused(said)) return;
  const read = resetIn(said, now), usable = read !== null && read + GRACE_MS > now && read <= now + FURTHEST_MS ? read : null;
  refuse(repo, id, reviewer, { resets: usable === null ? null : new Date(usable).toISOString(), carry_on: new Date(usable === null ? now + RETRY_MS : usable + GRACE_MS).toISOString() }, said, session);
}

// Before a round of a build speck run started: while another build has found `reviewer` at its limit, it isn't run.
// A round you run yourself still asks the reviewer, which knows if the limit has lifted early.
export function holdOnLimit(repo, id, reviewer, { session = process.env[BUILD_ENV], now = Date.now() } = {}) {
  if (!session) return;
  const held = heldBy(repo, reviewer, now);
  if (held) refuse(repo, id, reviewer, held, '', session);
}

// 0649: the limit on record that holds `reviewer` now, the one lasting longest, or null.
export const heldBy = (repo, reviewer, now = Date.now()) => inDir(mainLimits(repo)).filter(s => s.reviewer === reviewer && Date.parse(s.carry_on) > now).sort((a, b) => Date.parse(b.carry_on) - Date.parse(a.carry_on))[0] ?? null;
// 0649: whether a recorded usage limit holds `agent` now: a reviewer's, or Claude's as a builder (0622).
export const agentHeld = (repo, agent, now = Date.now()) => {
  const runs = path.join(mainCheckout(repo), 'speck', '.cache', 'runs'), claude = readLimit(runs);
  return reviewerHolds(runs, agent, now) || (agent === 'claude' && !!claude?.carry_on && now < Date.parse(claude.carry_on));
};

// A round was recorded, so the build got past the limit.
export const clearLimit = (repo, id) => { try { fs.rmSync(path.join(mainLimits(repo), `${id}.json`), { force: true }); } catch { /* left to speck run */ } };

// speck run's side. ended(id, file) reads a build that has ended, true when it stopped on the reviewer's limit and speck
// run will carry it on; check(tickets), on each of its checks, says each new limit and resumes each build whose limit is
// over while a build slot is free. holdsBuild(id) says whether a build must not be resumed now, and view() is what the
// Foreman's record keeps, or null. `settings`, `running`, `startBuild` and `runs` are speck run's. heldBuild says whether
// the build's own agent is held (0622). A record is removed before its build is resumed, so it's never resumed twice.
export function reviewerLimitQueue({ repo, runs, settings, running, startBuild, resumeHint, countStop = () => '', statusOf = () => null, now = Date.now, say = console.log, heldBuild = () => false }) {
  const speak = text => say(speckSays(text));
  const said = new Map(); // each reviewer's last limit said, so it's said once
  const dir = () => limitsDir(runs());
  const fileOf = id => path.join(dir(), `${id}.json`);
  const readRec = id => { try { const v = JSON.parse(fs.readFileSync(path.join(runs(), `${id}.json`), 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
  const drop = id => { try { fs.rmSync(fileOf(id), { force: true }); return true; } catch (e) { speak(`I couldn't clear my record of ${id}'s reviewer limit (${e.message}), so I'll try again on speck run's next check.`); return false; } };
  const held = s => now() < Date.parse(s.carry_on);
  const own = (s, rec) => (rec?.env_session ?? rec?.session) === s.session;
  const limitOf = id => readLimits(runs()).find(s => s.id === String(id)) ?? null;

  const announce = s => {
    const key = s.resets ?? s.carry_on, last = said.get(s.reviewer);
    if (!held(s) || last?.key === key || (!s.resets && last && now() < last.until)) return;
    said.set(s.reviewer, { key, until: Date.parse(s.carry_on) });
    const t = now();
    speak(s.resets ? `The ${s.reviewer} reviewer's usage limit is reached until ${clock(Date.parse(s.resets), t)} UTC, so I'll run its reviews again then.`
      : `The ${s.reviewer} reviewer's usage limit is reached, and it doesn't say when it resets, so I'll try again at ${clock(Date.parse(s.carry_on), t)} UTC, and every 30 minutes after until a review gets past it.`);
  };

  const ended = (id, recordFile) => {
    const s = limitOf(id);
    if (!s) return false;
    let rec = null;
    try { rec = JSON.parse(fs.readFileSync(recordFile, 'utf8')); } catch { /* left as any other stop */ }
    if (!own(s, rec)) return false;
    let status = null;
    try { status = statusOf(id); } catch { /* unreadable: left as any other stop */ }
    if (!IN_HAND.includes(status)) return false;
    announce(s);
    console.log(`${id} build stopped on the ${s.reviewer} reviewer's usage limit, so speck run will carry it on once the limit has reset.`);
    return true;
  };

  const check = tickets => {
    const limits = readLimits(runs()).sort((a, b) => a.id.localeCompare(b.id));
    for (const n of names(dir())) if (fileName.test(n) && !limits.some(s => `${s.id}.json` === n)) drop(n.slice(0, -'.json'.length)); // unreadable: nothing can act on it
    for (const s of limits) {
      announce(s);
      const t = tickets.find(x => String(x.id) === s.id), rec = readRec(s.id);
      if (running.has(s.id) || t?.build_running) continue; // still ending: speck run comes back to it
      if (held(s)) continue;
      const movedOn = !t || !IN_HAND.includes(t.status) || !rec || !Object.hasOwn(rec, 'exited') || !own(s, rec);
      if (movedOn) { drop(s.id); continue; }
      if (heldBuild(s.id)) continue;
      const current = settings();
      if (!current || running.size >= current.max) return;
      if (!drop(s.id)) return;
      carryOn({ repo, runs, startBuild, resumeHint, countStop, now, speak }, s.id, rec, current, `The ${s.reviewer} reviewer's usage limit`,
        `The ${s.reviewer} reviewer's usage limit has reset, so speck run has resumed the build of ticket ${s.id}. Run the review round again with \`speck review ${s.id}\`, then carry on with /speck-build ${s.id} from where you left off.`);
    }
  };

  const view = () => {
    const t = now(), s = readLimits(runs()).filter(held).sort((a, b) => Date.parse(b.carry_on) - Date.parse(a.carry_on))[0];
    if (!s) return null;
    const at = s.resets ? clock(Date.parse(s.resets), t) : null;
    return { until: at, reviewer: true, why: at ? `The ${s.reviewer} reviewer's usage limit is reached until ${at} UTC, so no review starts on it until then.`
      : `The ${s.reviewer} reviewer's usage limit is reached, so no review starts on it until speck run tries again at ${clock(Date.parse(s.carry_on), t)} UTC.` };
  };

  return { ended, check, view, holdsBuild: id => { const s = limitOf(id); return !!s && held(s); } };
}

// 0637: whether a reviewer's limit on record holds `agent` now (a Claude subagent's is Claude's).
const reviewerHolds = (runs, agent, now) => readLimits(runs).some(s => (s.reviewer === 'claude-subagent' ? 'claude' : s.reviewer) === agent && now < Date.parse(s.carry_on));

// speck run's usage limits together: Claude's as a builder (0622), which holds new builds, and each reviewer's. 0637:
// holdsAgent(agent) says whether any of them holds an agent, for the watch agent.
export function limitQueues(opts) {
  const builder = usageLimitQueue(opts), reviewers = reviewerLimitQueue({ ...opts, heldBuild: id => builder.holdsBuild(id) });
  return { ...builder, ended: (id, log, file) => builder.ended(id, log, file) || reviewers.ended(id, file), check: tickets => { builder.check(tickets); reviewers.check(tickets); },
    holdsAgent: agent => builder.holds(agent) || reviewerHolds(opts.runs(), agent, (opts.now ?? Date.now)()),
    view: () => builder.view() ?? reviewers.view(), holdsBuild: id => builder.holdsBuild(id) || reviewers.holdsBuild(id) };
}

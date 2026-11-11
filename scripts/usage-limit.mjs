// 0622: Claude's usage limit. A build Claude refuses for it stops partway, and its log says when the limit resets. speck
// run records that, starts nothing on Claude until then, and from a minute after carries on each build that stopped.
// 0644: Codex's and Cursor's the same way, each agent's limit kept in a record of its own.
import fs from 'node:fs';
import path from 'node:path';
import { speckSays } from './core.mjs';
import { saveRecord } from './build-records.mjs';
import { resumeFor, resumedRecord } from './hand-back.mjs';
import { configBuilder } from './build-model.mjs';
import { codexLimitInLog, cursorLimitInLog } from './agent-limit.mjs';

export { keepUsageOfLog } from './agent-usage.mjs'; // 0642: for the watch agent's runs

// Not <id>.json, so nothing that reads the runs folder's build records takes it for one. 0644: Claude's keeps the name
// it had, so a wait recorded before goes on.
const fileOf = agent => (agent === 'claude' ? 'run.usage-limit.json' : `run.usage-limit.${agent}.json`);
export const LIMIT_AGENTS = Object.freeze(['claude', 'codex', 'cursor']);
const NAMES = { claude: 'Claude', codex: 'Codex', cursor: 'Cursor' };
export const agentName = agent => NAMES[agent] ?? agent;
export const GRACE_MS = 60000; // how long after the reset time it carries on
export const RETRY_MS = 30 * 60000; // how long it waits when the log gives no reset time it can use
export const FURTHEST_MS = 31 * 864e5; // no limit lasts this long, so a reset time further off is misread
const IN_HAND = ['ready', 'building', 'reviewing']; // a ticket whose build has more to do

const LIMIT_WORDS = /hit your .*limit|usage limit/i;
const refusedText = e => (e.type === 'assistant' && e.api_error === 'usage_limit_reached')
  || (e.type === 'result' && e.is_error === true && typeof e.result === 'string' && LIMIT_WORDS.test(e.result));
const realWork = e => (e.type === 'assistant' && !refusedText(e) && e.message?.model !== '<synthetic>') || (e.type === 'result' && e.is_error !== true);

// Whether Claude's stream-json log `text` ends refused for the usage limit: { resets, type }, resets being the reset
// time in ms when it gives one, or null. A refusal the build got past doesn't count.
export function limitInLog(text) {
  let hit = null;
  for (const line of String(text ?? '').split('\n')) {
    if (!line.startsWith('{')) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type === 'rate_limit_event') {
      const info = e.rate_limit_info;
      const at = info?.resetsAt;
      hit = info?.status === 'rejected' ? { resets: Number.isFinite(at) && at > 0 ? at * 1000 : null, type: typeof info.rateLimitType === 'string' ? info.rateLimitType : null } : null;
    } else if (realWork(e)) hit = null;
    else if (refusedText(e)) hit ??= { resets: null, type: null };
  }
  return hit;
}

// 0644: whether `agent`'s log `text` ends refused for the usage limit, as limitInLog says for Claude. null for an agent
// whose limit speck doesn't read. `thread` and `home` find a Codex build's session file, and `now` is the time to read a
// reset time from when the log doesn't say when it was written.
export function limitOfLog(agent, text, { thread, home, now = Date.now() } = {}) {
  if (agent === 'claude') return limitInLog(text);
  if (agent === 'codex') return codexLimitInLog(text, { thread, now, ...(home ? { home } : {}) });
  if (agent === 'cursor') return cursorLimitInLog(text, { now });
  return null;
}

// speck run's record of `agent`'s limit, or null when there's none or it can't be read: { resets, carry_on, builds }.
// resets is when the limit resets, or null when that isn't known; carry_on when it stops waiting, or null once it has;
// and builds the tickets whose builds stopped on the limit and haven't been resumed yet.
export function readLimit(runs, agent = 'claude') {
  if (!LIMIT_AGENTS.includes(agent)) return null;
  let s;
  try { s = JSON.parse(fs.readFileSync(path.join(runs, fileOf(agent)), 'utf8')); } catch { return null; }
  if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
  const time = v => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null);
  return { resets: time(s.resets), carry_on: time(s.carry_on), builds: Array.isArray(s.builds) ? s.builds.filter(id => typeof id === 'string') : [] };
}
// The tickets waiting to be carried on, for what says a stopped build needs you.
export const limitWaiting = runs => [...new Set(LIMIT_AGENTS.flatMap(a => readLimit(runs, a)?.builds ?? []))];

// `ms` in UTC as HH:MM, with its date when it's more than a day from `now`.
export const clock = (ms, now) => new Date(ms).toISOString().slice(ms - now > 864e5 ? 0 : 11, 16).replace('T', ' ');

// 0623: resumes in its own session a build that stopped on a usage limit, `who` being the limit in words and `message` what
// the build is told. The rest is speck run's.
export function carryOn({ repo, runs, startBuild, resumeHint, countStop, now, speak }, id, rec, { cfg, words }, who, message) {
  const recordFile = path.join(runs(), `${id}.json`);
  const { argv, why } = resumeFor(words, cfg, id, rec, message);
  if (!argv) return speak(`${id}: ${who} has reset, but speck run can't resume its build: ${why}. ${resumeHint(cfg, rec)}.`);
  const note = countStop(repo, id); // while its record still has the exit it waited from
  if (note) console.log(`${id}:${note}`);
  const { exited: _e, exit_code: _c, ...kept } = rec, next = { ...resumedRecord(kept), limit_resumed: new Date(now()).toISOString(), resume_command: argv };
  try { saveRecord(recordFile, next); } catch (e) { return speak(`${id}: ${who} has reset, but its run record couldn't be saved (${e.message}), so it wasn't resumed. ${resumeHint(cfg, rec)}.`); }
  const cwd = typeof rec.cwd === 'string' && fs.existsSync(rec.cwd) ? rec.cwd : repo;
  speak(`${id}: ${who} has reset, so I'm carrying on its build (session ${rec.session}).`);
  startBuild(id, argv, cwd, rec.session, 'a', pid => `${JSON.stringify({ ...next, pid: pid ?? rec.pid }, null, 2)}\n`, rec.env_session ?? rec.session);
}

// speck run's side. ended(id, log, file) reads a build that has ended, true when it stopped on the limit and speck run
// will carry it on; agentEnded(agent, log) does the same for the watch agent's own run (0625); check(tickets), on each of its checks, ends the wait once it's over and resumes each stopped build
// while a build slot is free. holds(agent) and holdsBuild(id) say whether an agent, or a ticket's build, may not start
// now, heldSays(agent) says so in words, or null, waiting(id) whether a ticket is waiting to be carried on, and view() is
// what the Foreman's record keeps, or null. `settings`, `running`, `startBuild` and `runs` are speck run's. `countStop` leaves the wait out of the build's time.
// 0644: each of Claude, Codex and Cursor has its own limit, held and carried on apart. `codexHome` is where Codex keeps
// its session files. 0648: `takeOver` (build-take-over.mjs) moves a stopped build to another agent while its own is held.
export function usageLimitQueue({ repo, runs, settings, running, startBuild, resumeHint, countStop = () => '', statusOf = () => null, now = Date.now, say = console.log,
  graceMs = process.env.SPECK_RUN_LIMIT_GRACE_MS ? Number(process.env.SPECK_RUN_LIMIT_GRACE_MS) : GRACE_MS, codexHome, takeOver = null }) {
  const speak = text => say(speckSays(text));
  const file = agent => path.join(runs(), fileOf(agent));
  const readRec = f => { try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
  const save = (agent, s) => {
    try { if (s.carry_on || s.builds.length) saveRecord(file(agent), s); else fs.rmSync(file(agent), { force: true }); return true; }
    catch (e) { speak(`I couldn't save my record of ${agentName(agent)}'s usage limit (${e.message}), so I'll try again on speck run's next check.`); return false; }
  };
  const held = s => !!s?.carry_on && now() < Date.parse(s.carry_on);
  const agentOf = rec => (typeof rec?.agent === 'string' && rec.agent) || configBuilder(settings()?.cfg);
  const empty = () => ({ resets: null, carry_on: null, builds: [] });
  // 0644: a clock time in a log is read from when the log was last written, not when speck run reads it, which may be
  // hours later if it was off.
  const writtenAt = log => { try { return Math.min(fs.statSync(log).mtimeMs, now()); } catch { return now(); } };

  // The limit reached: kept with the latest reset time known, and said only when that's news.
  const reached = (agent, s, hit) => {
    const t = now(), name = agentName(agent), usable = hit.resets !== null && hit.resets + graceMs > t && hit.resets <= t + FURTHEST_MS ? hit.resets : null;
    if (held(s) && (usable === null || (s.resets && usable <= Date.parse(s.resets)))) return;
    s.resets = usable === null ? null : new Date(usable).toISOString();
    s.carry_on = new Date(usable === null ? t + RETRY_MS : usable + graceMs).toISOString();
    speak(usable === null ? `${name}'s usage limit is reached, and its log doesn't say when it resets, so I'll try again at ${clock(Date.parse(s.carry_on), t)} UTC, and every 30 minutes after until a build gets past it.`
      : `${name}'s usage limit is reached until ${clock(usable, t)} UTC, so I'll carry on then.`);
  };

  const ended = (id, log, recordFile) => {
    const rec = readRec(recordFile), agent = rec && agentOf(rec);
    if (!rec || !LIMIT_AGENTS.includes(agent)) return false;
    let buf;
    try { buf = fs.readFileSync(log); } catch { return false; }
    const read = Number.isInteger(rec.limit_read) && rec.limit_read <= buf.length ? rec.limit_read : 0; // a refusal already acted on is old news
    const hit = limitOfLog(agent, buf.subarray(read).toString(), { thread: typeof rec.session === 'string' ? rec.session : undefined, home: codexHome, now: writtenAt(log) });
    if (!hit) return false;
    try { saveRecord(recordFile, { ...rec, limit_read: buf.length }); } catch { /* read again if it stops again */ }
    const s = readLimit(runs(), agent) ?? empty();
    reached(agent, s, hit);
    let status = null;
    try { status = statusOf(id); } catch { /* unreadable: left as any other stop */ }
    const waits = IN_HAND.includes(status);
    if (waits && !s.builds.includes(id)) s.builds = [...s.builds, id];
    if (!save(agent, s)) return false; // it can't wait without a record of it, so it's handled as any other stop
    if (waits) console.log(`${id} build stopped on ${agentName(agent)}'s usage limit, so speck run will carry it on once the limit has reset.`);
    return waits;
  };

  // 0625: the watch agent's own run, whose log is `log`: true when its agent stopped it on the limit and that's
  // recorded, so what it was looking into waits for the limit too.
  const agentEnded = (agent, log) => {
    if (!LIMIT_AGENTS.includes(agent)) return false;
    let text;
    try { text = fs.readFileSync(log, 'utf8'); } catch { return false; }
    const hit = limitOfLog(agent, text, { home: codexHome, now: writtenAt(log) });
    if (!hit) return false;
    const s = readLimit(runs(), agent) ?? empty();
    reached(agent, s, hit);
    return save(agent, s);
  };

  const resume = (agent, id, rec, current) => {
    const name = agentName(agent), build = agent === 'codex' ? '$speck-build' : '/speck-build';
    carryOn({ repo, runs, startBuild, resumeHint, countStop, now, speak }, id, rec, current, `${name}'s usage limit`,
      `${name}'s usage limit has reset, so speck run has resumed the build of ticket ${id}. Carry on with ${build} ${id} from where you left off.`);
  };

  // 0648: while held, each stopped build that `takeOver` moves to another agent, dropped from the wait before it starts.
  const moveOn = (agent, s, tickets) => {
    for (const id of [...s.builds]) {
      const t = tickets.find(x => String(x.id) === id), rec = readRec(path.join(runs(), `${id}.json`)), current = settings();
      if (!t || !IN_HAND.includes(t.status) || t.build_running || running.has(id) || !rec || !Object.hasOwn(rec, 'exited')) continue;
      if (!current || running.size >= current.max) return;
      const start = takeOver(agent, id, rec, current, s);
      if (!start) continue;
      s.builds = s.builds.filter(x => x !== id);
      if (!save(agent, s)) return;
      start();
    }
  };

  const checkAgent = (agent, tickets) => {
    const s = readLimit(runs(), agent);
    if (!s) return;
    if (held(s)) { if (takeOver) moveOn(agent, s, tickets); return; }
    if (s.carry_on) {
      s.carry_on = null; s.resets = null;
      if (!save(agent, s)) return;
      speak(`${agentName(agent)}'s usage limit has reset, so I'm starting builds again.`);
    }
    for (const id of [...s.builds]) {
      const t = tickets.find(x => String(x.id) === id), rec = readRec(path.join(runs(), `${id}.json`));
      const movedOn = !t || !IN_HAND.includes(t.status) || t.build_running || running.has(id) || !rec || !Object.hasOwn(rec, 'exited');
      const current = movedOn ? null : settings();
      if (!movedOn && (!current || running.size >= current.max)) return;
      s.builds = s.builds.filter(x => x !== id);
      if (!save(agent, s)) return; // saved before it starts, so it's never resumed twice
      if (!movedOn) resume(agent, id, rec, current);
    }
  };
  const check = tickets => { for (const agent of LIMIT_AGENTS) checkAgent(agent, tickets); };

  // Each agent held, said in turn; `until` is the reset of the one held longest.
  const view = () => {
    const t = now(), heldNow = LIMIT_AGENTS.map(agent => ({ agent, s: readLimit(runs(), agent) })).filter(({ s }) => held(s));
    if (!heldNow.length) return null;
    const whys = heldNow.map(({ agent, s }) => {
      const name = agentName(agent), at = s.resets ? clock(Date.parse(s.resets), t) : null;
      return at ? `${name}'s usage limit is reached until ${at} UTC, so no build starts on ${name} until then.`
        : `${name}'s usage limit is reached, so no build starts on ${name} until speck run tries again at ${clock(Date.parse(s.carry_on), t)} UTC.`;
    });
    const last = heldNow.reduce((a, b) => (Date.parse(b.s.carry_on) > Date.parse(a.s.carry_on) ? b : a)).s;
    return { until: last.resets ? clock(Date.parse(last.resets), t) : null, why: whys.join(' ') };
  };

  return {
    ended, agentEnded, check, view,
    holds: agent => LIMIT_AGENTS.includes(agent) && held(readLimit(runs(), agent)),
    heldSays: agent => (LIMIT_AGENTS.includes(agent) && held(readLimit(runs(), agent)) ? `${agentName(agent)}'s usage limit is reached` : null), // a ready ticket's wait
    holdsBuild: id => { const agent = agentOf(readRec(path.join(runs(), `${id}.json`))); return LIMIT_AGENTS.includes(agent) && held(readLimit(runs(), agent)); },
    waiting: id => limitWaiting(runs()).includes(String(id)),
  };
}

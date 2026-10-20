// 0344: time the machine spends asleep during a build isn't build time. Every process sleeps with the machine, but the
// wall clock carries on, so a build timed by the wall clock would count the hours asleep. speck run notices a sleep at
// its first check after waking and adds it to the waited_seconds of each ticket whose build was in hand all through it.
//
// On Linux, Node's monotonic clock (CLOCK_MONOTONIC) leaves out time suspended, so the wall clock running ahead of it
// is the time asleep. On macOS it keeps counting through sleep, so speck reads the times macOS records for its last
// sleep and wake instead (unconfirmed: this was written on Linux). Both are checked everywhere they can be, and the
// larger is taken, so a sleep is counted once whichever of them catches it.
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { sh, addWaited, pausedSince } from './core.mjs';
import { commitTicketOnly } from './close.mjs';
import { buildTicket } from './build-records.mjs';
import { buildPaused } from './speck.mjs';

// Shorter gaps than this are the clocks drifting apart or a check running late, not a sleep.
export const SLACK_MS = 5000;

export const clocks = () => ({ wall: Date.now(), mono: performance.now() });

// The wall clock's lead over the monotonic clock between two readings, in ms, or 0 when it's within SLACK_MS. A check
// that comes late on a busy machine moves both clocks alike, so it adds nothing.
export function clockGap(prev, now) {
  const wall = now.wall - prev.wall, gap = wall - (now.mono - prev.mono);
  return Number.isFinite(gap) && gap > SLACK_MS ? Math.min(gap, wall) : 0;
}

// `{ sec = 1760990000, usec = 123456 } Mon Oct 20 …`, as `sysctl -n kern.sleeptime` prints it, in ms, or null.
export function sysctlTime(text) {
  const m = /sec\s*=\s*(\d+)\s*,\s*usec\s*=\s*(\d+)/.exec(String(text ?? ''));
  if (!m || m[1] === '0') return null;
  return Number(m[1]) * 1000 + Math.floor(Number(m[2]) / 1000);
}

// macOS's last sleep and wake, { sleep, wake } in ms, or null when they can't be read.
export function macSleepTimes(run = sh) {
  let r;
  try { r = run('sysctl', ['-n', 'kern.sleeptime', 'kern.waketime']); } catch { return null; }
  if (!r || r.status !== 0) return null;
  const [sleep, wake] = String(r.stdout).split('\n').map(sysctlTime);
  return sleep !== null && wake !== null && sleep !== undefined && wake !== undefined ? { sleep, wake } : null;
}

// The part of macOS's last sleep that falls between two readings, { ms, from } with when it began, or null. It's read
// only when the wall clock has moved on further than a check late by SLACK_MS would, so most checks run no command. A
// sleep that ended before the earlier reading was counted then, or before speck run was watching.
export function macGap(prev, now, times, pollMs) {
  if (now.wall - prev.wall <= pollMs + SLACK_MS) return null;
  const t = times();
  if (!t || !(t.wake > t.sleep)) return null;
  const from = Math.max(t.sleep, prev.wall), ms = Math.min(t.wake, now.wall) - from;
  return ms > SLACK_MS ? { ms, from } : null;
}

// Measures the time asleep since its last check: check() gives null on its first check and when there was none, and
// otherwise { ms, before(t) }, before telling whether something that happened at `t` (in ms, between the two checks or
// earlier) happened before the sleep. With macOS's own times that's exact. From the clock gap alone, the sleep began
// somewhere after the last check and ended `ms` before the next at the latest, and nothing happens while asleep, so
// anything later than the last check by less than `ms` came before it: speck run checks every few seconds, so the
// machine is awake that long between two checks only when it's busier than any sleep worth counting.
export function sleepWatch({ read = clocks, platform = process.platform, times = macSleepTimes, pollMs = 5000 } = {}) {
  let prev = null;
  return {
    check() {
      const now = read(), last = prev;
      prev = now;
      if (!last) return null;
      const gap = clockGap(last, now);
      const mac = platform === 'darwin' ? macGap(last, now, times, pollMs) : null;
      if (mac && mac.ms >= gap) return { ms: mac.ms, before: t => t <= mac.from };
      return gap > 0 ? { ms: gap, before: t => t < last.wall + gap } : null;
    },
  };
}

// The ticket `t`'s build was in hand all through a sleep `s`: its build time had begun and not ended, and it wasn't
// blocked or paused, which count that time as waiting already, or stopped, as an exited build's wait is counted from
// its exit (0217). `rec` is its run record, and `paused` when its pause began, or null.
const at = v => { const ms = Date.parse(v); return Number.isFinite(ms) ? ms : null; };
const IN_HAND = new Set(['building', 'reviewing', 'blocked', 'approved']);
export function inHandAsleep(fm, rec, running, paused, s) {
  if (!IN_HAND.has(fm.status) || !rec) return false;
  const exited = Object.hasOwn(rec, 'exited') ? at(rec.exited) : null;
  if (!running && (exited === null || s.before(exited))) return false;
  const started = at(fm.started);
  if (started === null || !s.before(started)) return false;
  if (fm.status === 'blocked' && (at(fm.blocked_at) === null || s.before(at(fm.blocked_at)))) return false;
  if (fm.status === 'approved' && (at(fm.approved) === null || s.before(at(fm.approved)))) return false;
  return !(paused !== null && s.before(paused));
}

// Adds `seconds` asleep to ticket `id`'s waited_seconds and commits it where its build keeps it. Returns a note to log
// when it couldn't be recorded, or ''. `t` is the ticket as buildTicket reads it.
export function countSleep(at, t, seconds) {
  const text = addWaited(t.raw, seconds);
  if (text === t.raw) return '';
  let commit;
  try { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, `speck(${t.fm.id}): time asleep`); }
  catch { commit = { status: 1 }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  return commit.status === 0 ? '' : ` Its time asleep couldn't be committed in ${at}, so its ticket is unchanged and the time counts as build time.`;
}

const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };

// speck run's side: check(tickets), first thing on each check after it has read the tickets, so before it starts or
// resumes any build, adds the time asleep since its last check to each ticket whose build was in hand all through it
// (inHandAsleep): one running now, or one whose build exited after waking.
export function sleepQueue({ repo, readConfig, running, runs, watch = sleepWatch(), log = console.log }) {
  return {
    check(tickets) {
      const s = watch.check();
      if (!s) return;
      const seconds = s.ms / 1000;
      for (const { id } of tickets) {
        if (!/^[\w-]+$/.test(String(id))) continue;
        const rec = readObject(path.join(runs(), `${id}.json`));
        if (!rec) continue;
        let where, t;
        try { ({ at: where, t } = buildTicket(repo, readConfig(), id)); } catch { continue; }
        const paused = buildPaused(runs(), id) ? pausedSince(path.join(runs(), `${id}.paused`)) : null;
        if (!inHandAsleep(t.fm, rec, running.has(id), paused, s)) continue;
        const note = countSleep(where, t, seconds);
        log(`${id}: the machine was asleep for ${Math.round(seconds / 60)} min during its build, so that's left out of its build time.${note}`);
      }
    },
  };
}

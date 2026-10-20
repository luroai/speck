// 0344: time the machine spends asleep during a build isn't build time. Every process sleeps with the machine, but the
// wall clock carries on, so a build timed by the wall clock would count the hours asleep. speck run notices a sleep at
// its first check after waking and adds it to the waited_seconds of each ticket whose build it had running then.
//
// On Linux, Node's monotonic clock (CLOCK_MONOTONIC) leaves out time suspended, so the wall clock running ahead of it
// is the time asleep. On macOS it keeps counting through sleep, so speck reads the times macOS records for its last
// sleep and wake instead (unconfirmed: this was written on Linux). Both are checked everywhere they can be, and the
// larger is taken, so a sleep is counted once whichever of them catches it.
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { sh, addWaited } from './core.mjs';
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

// The part of macOS's last sleep that falls between two readings, in ms, or 0. It's read only when the wall clock has
// moved on further than a check late by SLACK_MS would, so most checks run no command. A sleep that ended before the
// earlier reading was counted then, or before speck run was watching.
export function macGap(prev, now, times, pollMs) {
  if (now.wall - prev.wall <= pollMs + SLACK_MS) return 0;
  const t = times();
  if (!t || !(t.wake > t.sleep)) return 0;
  const asleep = Math.min(t.wake, now.wall) - Math.max(t.sleep, prev.wall);
  return asleep > SLACK_MS ? asleep : 0;
}

// Measures the time asleep since its last check: check() gives it in ms, 0 on its first.
export function sleepWatch({ read = clocks, platform = process.platform, times = macSleepTimes, pollMs = 5000 } = {}) {
  let prev = null;
  return {
    check() {
      const now = read();
      if (!prev) { prev = now; return 0; }
      const asleep = Math.max(clockGap(prev, now), platform === 'darwin' ? macGap(prev, now, times, pollMs) : 0);
      prev = now;
      return asleep;
    },
  };
}

// Adds `seconds` asleep to ticket `id`'s waited_seconds and commits it where its build keeps it. Returns a note to log
// when it couldn't be recorded, or ''.
export function countSleep(repo, cfg, id, seconds) {
  let at, t;
  try { ({ at, t } = buildTicket(repo, cfg, id)); } catch { return ` Its time asleep couldn't be added to its ticket, which wasn't found, so it counts as build time.`; }
  const text = addWaited(t.raw, seconds);
  if (text === t.raw) return '';
  let commit;
  try { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, `speck(${t.fm.id}): time asleep`); }
  catch { commit = { status: 1 }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  return commit.status === 0 ? '' : ` Its time asleep couldn't be committed in ${at}, so its ticket is unchanged and the time counts as build time.`;
}

// speck run's side: check(tickets), on each check, adds the time asleep since the last one to each ticket that was
// building or reviewing then, with its build running and not paused. A ticket blocked or paused then is already
// counting that time as waiting, so it isn't added again. One shipped or cancelled since has no build time left to fix.
const IN_HAND = new Set(['building', 'reviewing']);
const LEFT = new Set(['done', 'cancelled']);
export function sleepQueue({ repo, readConfig, running, runs, watch = sleepWatch(), log = console.log }) {
  let before = new Set();
  return {
    check(tickets) {
      const asleep = watch.check();
      if (asleep > 0) {
        const seconds = asleep / 1000;
        for (const t of tickets) {
          if (!before.has(t.id) || LEFT.has(t.status)) continue;
          const note = countSleep(repo, readConfig(), t.id, seconds);
          log(`${t.id}: the machine was asleep for ${Math.round(seconds / 60)} min during its build, so that's left out of its build time.${note}`);
        }
      }
      before = new Set(tickets.filter(t => IN_HAND.has(t.status) && running.has(t.id) && !buildPaused(runs(), t.id)).map(t => t.id));
    },
  };
}

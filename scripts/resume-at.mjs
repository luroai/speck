// 0625: `speck watch resume --at`: when the watcher has a build resumed later, and what it says about that.
import { SpeckError } from './core.mjs';
import { clock } from './usage-limit.mjs';

const FURTHEST_MS = 31 * 864e5; // a stop that clears by itself clears sooner than this, so a time further off is misread
const CLOCK = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;
const NEEDS = '--at needs a time such as 12:30 (UTC, today or, if passed, tomorrow) or a full ISO date and time such as 2026-11-10T12:30:00Z';

// `args` without --at <time> or --at=<time>: { at, left }, at being the time as given, '' when --at has none, or
// undefined without one. Refuses more than one.
export function takeAt(args) {
  const isAt = a => a === '--at' || a.startsWith('--at=');
  if (args.filter(isAt).length > 1) throw new SpeckError('Give only one --at, so nothing was changed.');
  const i = args.findIndex(isAt);
  if (i < 0) return { left: args };
  if (args[i] !== '--at') return { at: args[i].slice('--at='.length), left: args.toSpliced(i, 1) };
  const next = args[i + 1], has = next !== undefined && !next.startsWith('--');
  return { at: has ? next : '', left: args.toSpliced(i, has ? 2 : 1) };
}

// The time `text` means at `now` (a Date), in ms, or throws a SpeckError saying why not.
export function resumeTime(text, now) {
  const t = String(text ?? '').trim(), ms = now.getTime(), c = t.match(CLOCK);
  if (c) {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), Number(c[1]), Number(c[2]));
    return today <= ms ? today + 864e5 : today;
  }
  const m = t.match(ISO), at = m ? Date.parse(m[4] ? t : `${t}Z`) : NaN;
  if (!Number.isFinite(at) || Number(m[3]) > new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).getUTCDate()) throw new SpeckError(`${NEEDS}, so nothing was changed.`);
  if (at <= ms) throw new SpeckError(`${t} has passed, so nothing was changed. Give a later time, or leave out --at to resume now.`);
  if (at > ms + FURTHEST_MS) throw new SpeckError(`${t} is more than 31 days away, so nothing was changed. Choose another action.`);
  return at;
}

// `ms` as HH:MM UTC, with its date when it's more than a day from `now` (ms).
export const resumeClock = (ms, now) => `${clock(ms, now)} UTC`;
// `why`, the watcher's reason, as a sentence.
export const resumeWhy = why => (/[.!?]$/.test(why) ? why : `${why}.`);

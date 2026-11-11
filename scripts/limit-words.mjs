// 0644, from reviewer-limit.mjs (0623): the words an agent refuses work with when its usage limit is reached, and the
// reset time they give. Shared by a reviewer's limit and a Codex or Cursor build's.

const REFUSED = /\bhit your\b[^\n]*\blimit\b|\busage limit\b[^\n]*\b(?:reached|exceeded)\b|\b(?:reached|exceeded)\b[^\n]*\busage limit\b/i;
export const reviewerRefused = said => REFUSED.test(String(said ?? ''));

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const RESET_WORDS = /\b(?:try again at|resets?(?: at)?)\s+(?:([a-z]{3})[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(?:(\d{4}),?\s+)?(?:at\s+)?)?(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\b\.?(?:\s*\(([^)]+)\))?/i;
const HOUR_MS = 3600000;

// When an agent's message `said` says its limit resets, in ms, or null when it doesn't or can't be read. Codex gives
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

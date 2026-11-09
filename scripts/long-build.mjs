// 0569: whether a build speck run is watching has been running far past the usual time, and the figures that say so.
export const LAST_SHIPPED = 20; // how many shipped tickets the usual build time comes from
const AT_LEAST_MINUTES = 20; // however short the usual time, a build under this isn't running long

const time = v => { const t = typeof v === 'string' ? Date.parse(v) : NaN; return Number.isFinite(t) ? t : null; };
const waited = t => { const w = typeof t.waited_seconds === 'number' ? t.waited_seconds : NaN; return Number.isFinite(w) && w > 0 ? w * 1000 : 0; };
function median(values) {
  const v = [...values].sort((a, b) => a - b), mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

// Each shipped ticket's build time, newest first, as { end, minutes }. A ticket's time is measured as the panel's Shipped
// stats measure it (templates/panel-model.js): from its start to its approval or, without one, to its end, less the time
// it waited for you. 0596: the bridge's median uses these too.
export function buildTimes(tickets) {
  return tickets.filter(t => t.status === 'done').flatMap(t => {
    const start = time(t.started), end = time(t.finished), approved = time(t.approved);
    const until = approved !== null && start !== null && approved >= start ? approved : end;
    return start !== null && until !== null && end !== null ? [{ end, minutes: Math.max(0, until - start - waited(t)) / 60000 }] : [];
  }).sort((a, b) => b.end - a.end);
}

// The median build time of the latest shipped tickets, in minutes, and how many it covers, or null with none.
export function usualBuild(tickets) {
  const took = buildTimes(tickets).slice(0, LAST_SHIPPED);
  return took.length ? { minutes: median(took.map(x => x.minutes)), count: took.length } : null;
}

// How long ticket `t`'s running build `rec` has run, in ms, and when its clock started, or null when that can't be told.
// A hand-back or a resume by the watch agent starts the clock again, as the wait before it isn't counted in the ticket's
// time; otherwise the time the ticket waited for you is left out, as it is from the usual time. A ticket its build
// hasn't started yet is timed from its launch.
function ranFor(t, rec, now) {
  const own = t.status === 'ready' ? null : time(t.started), start = own ?? time(rec.started);
  if (start === null) return null;
  const from = Math.max(start, time(rec.handed_back) ?? 0, time(rec.foreman_resumed) ?? 0);
  return { ms: now - from - (from === own ? waited(t) : 0), from };
}

// Whether ticket `t`'s build can count as running long: a paused build doesn't, and nor does a ticket no build has in hand.
export const canRunLong = t => !t.paused && ['ready', 'building', 'reviewing'].includes(t.status);

// A build running long: its key, so it's dealt with once, and a sentence with its figures, or null when it isn't. `usual`
// is from usualBuild.
export function runningLong(t, rec, usual, now, load) {
  if (!usual || !canRunLong(t)) return null;
  const ran = ranFor(t, rec, now);
  if (!ran || ran.ms < AT_LEAST_MINUTES * 60000 || ran.ms <= usual.minutes * 2 * 60000) return null;
  const tickets = usual.count === 1 ? 'the last shipped ticket' : `the last ${usual.count} shipped tickets`;
  const average = load.every(v => v === 0) ? 'This machine\'s load average isn\'t known.' : `This machine's load average is ${load.map(v => v.toFixed(2)).join(', ')} (over 1, 5 and 15 minutes).`;
  return { key: `long:${rec.started}:${ran.from}`,
    what: `its build is running long: it has been running for ${Math.round(ran.ms / 60000)} min, more than twice the median build time of ${Math.round(usual.minutes)} min over ${tickets}. ${average}` };
}

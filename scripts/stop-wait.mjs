// 0217: a build that stops before finishing leaves its ticket building or reviewing with nobody at work on it, waiting
// for you as a blocked ticket does. Its timer stops at when it stopped: an exited build's exit, or when speck first
// noticed a killed one, kept in a <id>.waiting mark beside its run record that names the build's session and pid, so a
// later build's stop never reads an earlier one's. When a build of the ticket starts again, the stretch since then is
// added to its waited_seconds, and the mark says so, so it's added once.
import fs from 'node:fs';
import path from 'node:path';
import { addWaited } from './core.mjs';
import { loadConfig, commitTicketOnly, runsOf } from './speck.mjs';
import { buildKilled, buildTicket } from './run.mjs';

const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
const saveMark = (file, mark) => {
  const tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify(mark)}\n`); fs.renameSync(tmp, file); } catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
};

// How the last build of a ticket it left in hand stopped: { since, counted, killed }, where since is when it stopped in
// ms (null if that can't be read or recorded) and counted says a build of it has started again since. null when its
// build hasn't stopped. A killed build not noticed before is noticed `now`, and that's recorded.
export function buildStop(runs, id, now = Date.now()) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  const rec = readObject(path.join(runs, `${id}.json`));
  if (!rec) return null;
  const file = path.join(runs, `${id}.waiting`);
  let mark = readObject(file);
  if (mark && (mark.session !== rec.session || mark.pid !== rec.pid)) mark = null;
  const counted = typeof mark?.counted === 'string';
  if (Object.hasOwn(rec, 'exited')) { const at = Date.parse(rec.exited); return { since: Number.isFinite(at) ? at : null, counted, killed: false }; }
  if (!buildKilled(runs, id)) return null;
  const at = Date.parse(mark?.since);
  if (Number.isFinite(at)) return { since: at, counted, killed: true };
  try { saveMark(file, { session: rec.session, pid: rec.pid, since: new Date(now).toISOString() }); } catch { return { since: null, counted: false, killed: true }; }
  return { since: now, counted: false, killed: true };
}

// A build of the ticket is starting again: adds the time its stopped build waited to its ticket's waited_seconds and
// commits that where the build keeps it, then marks the stop counted. Returns a note to add when the time couldn't be
// recorded, or ''.
export function countStop(repo, id, now = Date.now()) {
  let at, t;
  try { ({ at, t } = buildTicket(repo, loadConfig(repo), id)); } catch { return ''; }
  if (t.fm.status !== 'building' && t.fm.status !== 'reviewing') return '';
  const runs = runsOf(repo), pad = t.fm.id;
  const stop = buildStop(runs, pad, now);
  if (!stop || stop.counted || stop.since === null) return '';
  const text = addWaited(t.raw, (now - stop.since) / 1000);
  if (text !== t.raw) {
    let commit;
    try { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, `speck(${pad}): stopped time`); } catch { commit = { status: 1 }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
    if (commit.status !== 0) return ` The time its stopped build waited couldn't be recorded in ${at}, so it will count as build time.`;
  }
  const rec = readObject(path.join(runs, `${pad}.json`));
  try { saveMark(path.join(runs, `${pad}.waiting`), { session: rec?.session, pid: rec?.pid, since: new Date(stop.since).toISOString(), counted: new Date(now).toISOString() }); } catch { /* shown as stopped until its next build */ }
  return '';
}

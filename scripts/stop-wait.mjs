// 0217: a build that stops before finishing leaves its ticket building or reviewing with nobody at work on it, waiting
// for you as a blocked ticket does. Its timer stops at when it stopped: an exited build's exit, or when speck first
// noticed a killed one, kept in a <id>.waiting mark beside its run record that names the build's session and pid, so a
// later build's stop never reads an earlier one's. When a build of the ticket starts again, the stretch since then is
// added to its waited_seconds, and the mark says so, so it's added once.
import fs from 'node:fs';
import path from 'node:path';
import { addWaited } from './core.mjs';
import { loadConfig, commitTicketOnly, runsOf } from './speck.mjs';
import { buildKilled, buildTicket, pidAlive, sessionInUse } from './run.mjs';

const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
const saveMark = (file, mark) => {
  const tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify(mark)}\n`); fs.renameSync(tmp, file); } catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
};

// How the last build of a ticket it left in hand stopped: { since, counted, killed, resumed }, where since is when it
// stopped in ms (null if that can't be read or recorded) and counted says a build of it has started again since. null
// when its build hasn't stopped. A killed build not noticed before is noticed `now`, and that's recorded. `starting`:
// a build is starting, so a killed build whose session has been resumed by hand (`resumed`), which no longer counts as
// killed, still gives the stop speck noticed before.
export function buildStop(runs, id, now = Date.now(), starting = false) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  const rec = readObject(path.join(runs, `${id}.json`));
  if (!rec) return null;
  const file = path.join(runs, `${id}.waiting`);
  let mark = readObject(file);
  if (mark && (mark.session !== rec.session || mark.pid !== rec.pid)) mark = null;
  const counted = typeof mark?.counted === 'string', at = Date.parse(mark?.since);
  if (Object.hasOwn(rec, 'exited')) { const exit = Date.parse(rec.exited); return { since: Number.isFinite(exit) ? exit : null, counted, killed: false, resumed: false }; }
  if (!buildKilled(runs, id)) {
    const resumed = starting && Number.isFinite(at) && Number.isInteger(rec.pid) && rec.pid > 0 && !pidAlive(rec.pid) && sessionInUse(rec.session);
    return resumed ? { since: at, counted, killed: true, resumed: true } : null;
  }
  if (Number.isFinite(at)) return { since: at, counted, killed: true, resumed: false };
  try { saveMark(file, { session: rec.session, pid: rec.pid, since: new Date(now).toISOString() }); } catch { return { since: null, counted: false, killed: true, resumed: false }; }
  return { since: now, counted: false, killed: true, resumed: false };
}

// A build of the ticket is starting again: adds the time its stopped build waited to its ticket's waited_seconds and
// commits that where the build keeps it. The stop is marked counted first, and put back if the ticket can't be
// committed, so a failure part way loses the stretch rather than counting it twice. A session resumed by hand has its
// mark removed instead, so when it stops too, that's noticed afresh. Returns a note to add when the time couldn't be
// recorded, or ''.
export function countStop(repo, id, now = Date.now()) {
  let at, t;
  try { ({ at, t } = buildTicket(repo, loadConfig(repo), id)); } catch { return ''; }
  if (t.fm.status !== 'building' && t.fm.status !== 'reviewing') return '';
  const runs = runsOf(repo), pad = t.fm.id;
  const stop = buildStop(runs, pad, now, true);
  if (!stop || stop.counted || stop.since === null) return '';
  const file = path.join(runs, `${pad}.waiting`), rec = readObject(path.join(runs, `${pad}.json`));
  let before = null;
  try { before = fs.readFileSync(file, 'utf8'); } catch { /* none yet */ }
  const note = ` The time its stopped build waited couldn't be recorded, so it will count as build time.`;
  try {
    if (stop.resumed) fs.rmSync(file, { force: true });
    else saveMark(file, { session: rec?.session, pid: rec?.pid, since: new Date(stop.since).toISOString(), counted: new Date(now).toISOString() });
  } catch { return note; }
  const text = addWaited(t.raw, (now - stop.since) / 1000);
  if (text === t.raw) return '';
  let commit;
  try { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, `speck(${pad}): stopped time`); } catch { commit = { status: 1 }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  if (commit.status === 0) return '';
  try { if (before === null) fs.rmSync(file, { force: true }); else fs.writeFileSync(file, before); } catch { /* the stretch is lost, not counted twice */ }
  return note;
}

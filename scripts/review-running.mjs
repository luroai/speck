// 0223: which review round `speck review` is running, so the panel can say whether the reviewer is at work or the
// builder is fixing the last round's findings. Kept as <id>.review.json in speck run's records folder in the main
// checkout, which the panel watches, whichever checkout the round runs in.
import fs from 'node:fs';
import path from 'node:path';
import { padId } from './core.mjs';
import { runsOf } from './speck.mjs';
import { pidAlive } from './run.mjs';

const fileOf = (runs, id) => path.join(runs, `${padId(id)}.review.json`);
const safeId = id => /^[\w-]+$/.test(String(id ?? ''));

// Records `round` of ticket `id` as running in this process until the returned function is called, which removes it.
// It only feeds the panel, so a record that can't be written leaves the round to run without one.
export function markRoundRunning(repo, id, round) {
  const runs = runsOf(repo), file = fileOf(runs, id);
  try {
    fs.mkdirSync(runs, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ id: padId(id), round, pid: process.pid, started: new Date().toISOString() }) + '\n');
  } catch { return () => {}; }
  return () => {
    try { if (JSON.parse(fs.readFileSync(file, 'utf8')).pid === process.pid) fs.rmSync(file, { force: true }); } catch { /* gone already */ }
  };
}

// 0223: a reviewer subagent runs in the builder's own session, so no speck process lasts the round. `speck
// review-running` records the round with the pid of the build speck run started for the ticket, if there is one, and
// `speck record`, or `speck review-running --ended` for a round given up on, ends it.
export function markSubagentRound(repo, id, round) {
  const runs = runsOf(repo), file = fileOf(runs, id);
  let build = null;
  try { const rec = JSON.parse(fs.readFileSync(path.join(runs, `${padId(id)}.json`), 'utf8')); if (!Object.hasOwn(rec, 'exited') && Number.isInteger(rec.pid) && rec.pid > 0 && pidAlive(rec.pid)) build = rec.pid; } catch { /* not started by speck run */ }
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ id: padId(id), round, pid: null, build_pid: build, started: new Date().toISOString() }) + '\n');
}
export function endRound(repo, id) { fs.rmSync(fileOf(runsOf(repo), id), { force: true }); }

// The round of ticket `id` being run now, or null. A record left by a `speck review` that was killed, or one for a
// round already recorded (`recorded` rounds so far), doesn't count. Nor does a subagent's round once the build speck
// run started it in has gone.
export function roundRunning(runs, id, recorded) {
  if (!safeId(id)) return null;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(fileOf(runs, id), 'utf8')); } catch { return null; }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return null;
  const { round, pid, build_pid: build } = rec;
  if (!Number.isInteger(round) || round <= recorded) return null;
  if (Number.isInteger(pid) && pid > 0) return pidAlive(pid) ? round : null;
  if (pid !== null || build === undefined) return null;
  return build === null || (Number.isInteger(build) && build > 0 && pidAlive(build)) ? round : null;
}

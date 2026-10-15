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

// The round of ticket `id` being run now, or null. A record left by a `speck review` that was killed, or one for a
// round already recorded (`recorded` rounds so far), doesn't count.
export function roundRunning(runs, id, recorded) {
  if (!safeId(id)) return null;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(fileOf(runs, id), 'utf8')); } catch { return null; }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return null;
  const { round, pid } = rec;
  return Number.isInteger(round) && round > recorded && Number.isInteger(pid) && pid > 0 && pidAlive(pid) ? round : null;
}

// 0544: `speck run --background` turns speck run on in the background, as the panel's switch does (panelRunOn): in its
// own process group and session, with its output added to speck/.cache/runs/run.log, so it keeps running after the
// shell that started it has ended. It returns once speck run is watching, or with speck run's own refusal.
import path from 'node:path';
import { SpeckError, findRepoRoot, runsOf } from './speck.mjs';
import { runState } from './run.mjs';
import { isSpeckRun, recordedRun } from './run-lock.mjs';
import { panelRunOn } from './panel-run.mjs';
export { stopStarted } from './panel-run.mjs';

const LOG = path.join('speck', '.cache', 'runs', 'run.log');

// The speck run already running in this repo, as its pid, or null: one its lock names, or the one the Foreman's record
// names while its lock is gone. A lock naming a live process that isn't speck run isn't one: speck run refuses that itself.
function running(repo) {
  const runs = runsOf(repo), run = runState(runs);
  if (run.on && isSpeckRun(run.pid)) return run.pid;
  return recordedRun(repo, runs);
}

export function runBackground() {
  const fail = e => { console.error(e instanceof SpeckError ? e.message : `speck run: ${e?.message || e}`); process.exit(e?.code > 0 ? e.code : 1); };
  return startBackground(findRepoRoot()).catch(fail);
}

// Starts it, `ms` being how long it has to say it's watching. Prints and exits on success; throws a SpeckError otherwise.
export async function startBackground(repo, { ms } = {}) {
  const already = pid => console.log(`speck run: already running in this repo (process ${pid}). Its output is in ${LOG}.`);
  const was = running(repo);
  if (was) return already(was);
  const res = await panelRunOn(repo, ms ? { ms } : {});
  if (res.status === 200) {
    console.log(`speck run: on, in the background (process ${res.body.run.pid}): stop it with the switch at the top of the panel's Settings; its output is in ${LOG}`);
    process.exit(0); // the child's listeners would otherwise hold this process
  }
  // It didn't say it was watching in time: panelRunOn has stopped it, or says which process to stop (0551).
  if (res.body.pid) throw new SpeckError(res.body.error, 1);
  // Another one started meanwhile, so this one refused: it's on all the same.
  const now = running(repo);
  if (now) { already(now); process.exit(0); }
  throw new SpeckError(res.body.error, 1);
}

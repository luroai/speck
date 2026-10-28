// 0544: `speck run --background` turns speck run on in the background, as the panel's switch does (panelRunOn): in its
// own process group and session, with its output added to speck/.cache/runs/run.log, so it keeps running after the
// shell that started it has ended. It returns once speck run is watching, or with speck run's own refusal.
import path from 'node:path';
import { SpeckError, findRepoRoot, runsOf } from './speck.mjs';
import { runState, pidAlive } from './run.mjs';
import { isSpeckRun, recordedRun } from './run-lock.mjs';
import { panelRunOn } from './panel-run.mjs';

const LOG = path.join('speck', '.cache', 'runs', 'run.log');
const STOP_MS = 5000, POLL_MS = 50;
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

// Stops the process group a speck run that didn't start in time leads: SIGTERM, then SIGKILL if it's still there after
// `ms`. Resolves once it has gone, or rejects saying which process to stop when even SIGKILL didn't stop it in time.
export async function stopStarted(pid, ms = STOP_MS) {
  const gone = async () => { for (const until = Date.now() + ms; Date.now() < until; await sleep(POLL_MS)) if (!pidAlive(pid)) return true; return !pidAlive(pid); };
  for (const signal of ['SIGTERM', 'SIGKILL']) {
    try { process.kill(-pid, signal); } catch { /* already gone */ }
    if (await gone()) return;
  }
  throw new SpeckError(`speck run (process ${pid}) didn't stop. Stop that process yourself.`);
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
  // It didn't say it was watching in time: stop it, so nothing is left running.
  if (res.body.pid) { await stopStarted(res.body.pid); throw new SpeckError(res.body.error, 1); }
  // Another one started meanwhile, so this one refused: it's on all the same.
  const now = running(repo);
  if (now) { already(now); process.exit(0); }
  throw new SpeckError(res.body.error, 1);
}

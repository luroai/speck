// 0758: speck serve keeps each listed project's speck run going. The panel's Auto-build switch records how it was last
// turned in the project's speck/.cache/runs/auto-build.json, and speck serve records in the home folder which projects'
// runs it last saw on (~/.config/speck/serve-runs.json, kept after it stops). As it starts, it starts speck run in each
// project whose switch was last turned on, or whose run was on when it last stopped, unless the switch was turned off
// after that run took its lock. While it runs, a project whose switch is on and whose run has stopped is started again,
// at most 3 times an hour, saying so in the project's run.log, which the panel's Pipeline log shows. It never stops a
// run: turning one off is the switch's job.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { runState, pidAlive } from './run-switch.mjs';
import { timedMessage } from './run-times.mjs';

export const RESTARTS_AN_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000, RUN_START_MS = 15000, STOP_MS = 5000, POLL_MS = 100;
// How long a speck run it starts has to take its lock, in ms. SPECK_SERVE_RUN_START_MS sets it, for speck's own tests.
const runStartMs = () => (Number(process.env.SPECK_SERVE_RUN_START_MS) > 0 ? Number(process.env.SPECK_SERVE_RUN_START_MS) : RUN_START_MS);
const sleep = ms => new Promise(r => setTimeout(r, ms));

export const runsIn = folder => path.join(folder, 'speck', '.cache', 'runs');
const switchFile = runs => path.join(runs, 'auto-build.json');
const writeJson = (file, value) => {
  const tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify(value)}\n`); fs.renameSync(tmp, file); }
  catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
};
const timeOf = iso => (typeof iso === 'string' ? Date.parse(iso) : NaN);

// How the project's Auto-build switch was last turned: { on, at }, or null when it hasn't been, or the file is unreadable.
export function readAutoBuild(runs) {
  try {
    const v = JSON.parse(fs.readFileSync(switchFile(runs), 'utf8'));
    return v && typeof v.on === 'boolean' && !Number.isNaN(timeOf(v.at)) ? { on: v.on, at: v.at } : null;
  } catch { return null; }
}
// Records the switch turned on or off, now. `by` says who: the panel's switch, or speck serve when it starts a run.
export function writeAutoBuild(runs, on, by) {
  fs.mkdirSync(runs, { recursive: true });
  writeJson(switchFile(runs), { on, at: new Date().toISOString(), by });
}

// When the run took its lock, or null.
const lockSince = runs => { try { return fs.statSync(path.join(runs, 'run.lock')).mtime.toISOString(); } catch { return null; } };

// Whether speck serve starts a project's run as it starts: its switch was last turned on, or its run was on when speck
// serve last stopped (`last`, { since }) and the switch wasn't turned off after that run took its lock.
export function wantedAtStart(sw, last) {
  if (sw?.on) return true;
  if (!last) return false;
  if (!sw) return true;
  return timeOf(last.since) >= timeOf(sw.at);
}

// The projects whose runs speck serve last saw on, { [folder]: { since } }, from its record in the home folder.
export function readRunsRecord(file) {
  try {
    const v = JSON.parse(fs.readFileSync(file, 'utf8'));
    const out = Object.create(null);
    for (const [folder, r] of Object.entries(v?.runs ?? {})) if (path.isAbsolute(folder) && r && typeof r === 'object') out[folder] = { since: typeof r.since === 'string' ? r.since : null };
    return out;
  } catch { return Object.create(null); }
}

// Adds a timed line to the project's run.log, which the panel's Pipeline log shows.
function pipelineSays(runs, text) {
  try { fs.mkdirSync(runs, { recursive: true }); fs.appendFileSync(path.join(runs, 'run.log'), `${timedMessage(`speck serve: ${text}`)}\n`); } catch { /* said on speck serve's own output all the same */ }
}

// The last line written to `file` since `from`, without its full stop, or ''.
function lastWords(file, from) {
  try { return (fs.readFileSync(file).subarray(from).toString('utf8').trim().split('\n').filter(l => l.trim()).pop()?.trim().slice(0, 300) || '').replace(/\.$/, ''); } catch { return ''; }
}

// Starts speck run in `folder` on the project's own speck, as the Auto-build switch does: in its own process group, its
// output added to run.log. Resolves with { pid } once it holds its lock, or { why } when it didn't, having stopped it.
export async function startRun(folder, env) {
  const runs = runsIn(folder), log = path.join(runs, 'run.log');
  let from = 0, fd, child;
  try {
    fs.mkdirSync(runs, { recursive: true });
    try { from = fs.statSync(log).size; } catch { /* no log yet */ }
    fd = fs.openSync(log, 'a');
    child = spawn(process.execPath, [path.join(folder, '.speck', 'scripts', 'speck.mjs'), 'run'], { cwd: folder, detached: true, stdio: ['ignore', fd, fd], env });
  } catch (e) { return { why: `it couldn't be started (${e.code || e.message})` }; }
  finally { if (fd !== undefined) fs.closeSync(fd); }
  child.unref();
  let ended = null;
  child.on('error', e => { ended = `it couldn't be started (${e.code || e.message})`; });
  child.on('exit', (code, signal) => { const said = lastWords(log, from); ended = `it stopped (${signal ? `by ${signal}` : `exit code ${code}`})${said ? `, saying: ${said}` : ''}`; });
  for (const until = Date.now() + runStartMs(); Date.now() < until; await sleep(POLL_MS)) {
    if (ended) return { why: ended };
    const run = runState(runs);
    if (run.on && run.pid === child.pid) return { pid: child.pid };
  }
  for (const signal of ['SIGTERM', 'SIGKILL']) {
    try { process.kill(-child.pid, signal); } catch { /* gone already */ }
    for (const until = Date.now() + STOP_MS; Date.now() < until && pidAlive(child.pid); await sleep(POLL_MS));
    if (!pidAlive(child.pid)) break;
  }
  return { why: `it didn't take its lock within ${runStartMs() / 1000} seconds, so it was stopped` };
}

const clock = ms => { const d = new Date(ms), two = n => String(n).padStart(2, '0'); return `${two(d.getHours())}:${two(d.getMinutes())}`; };

// What speck serve does about runs. check(folders) is called on each of its looks at the list; stillOn(folders) names
// the projects whose runs are on. `start`, `state` and `now` can be stood in for by tests.
export function runKeeper({ file, env, say, start = startRun, state = runState, now = Date.now }) {
  const atStart = readRunsRecord(file); // as speck serve last left it
  const last = Object.create(null);
  for (const f of Object.keys(atStart)) last[f] = atStart[f];
  let saved = JSON.stringify(last), saveError = null;
  const looked = new Set(), busy = new Set();
  const restarts = new Map(); // folder → the times this speck serve started its run again, in the last hour
  const held = new Map(); // folder → until when it's left off, once said
  const name = folder => path.basename(folder);

  function save() {
    const text = JSON.stringify(last);
    if (text === saved) return;
    try { fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 }); writeJson(file, { runs: last }); saved = text; saveError = null; } catch (e) {
      if (saveError !== (e.code || e.message)) say(`can't write ${file} (${saveError = e.code || e.message}), so the next speck serve may not know which runs were on.`);
    }
  }

  async function launch(folder, why, again) {
    const runs = runsIn(folder);
    busy.add(folder);
    try {
      try { writeAutoBuild(runs, true, 'speck serve'); } catch { /* it still starts; a later stop is then not started again */ }
      const got = await start(folder, env);
      if (got.pid) {
        const text = again ? `speck run stopped without being turned off, so speck serve started it again (process ${got.pid}), ${again} of at most ${RESTARTS_AN_HOUR} times an hour.` : `started speck run (process ${got.pid}), as ${why}.`;
        pipelineSays(runs, text);
        say(`${name(folder)}: ${text}`);
      } else {
        const text = `speck run didn't start: ${got.why}. speck serve tries again while Auto-build is on, at most ${RESTARTS_AN_HOUR} times an hour.`;
        pipelineSays(runs, text);
        say(`${name(folder)}: ${text}`);
      }
    } finally { busy.delete(folder); }
  }

  function check(folders) {
    const listed = new Set(folders);
    for (const folder of folders) {
      if (busy.has(folder)) continue;
      const runs = runsIn(folder);
      let run;
      try { run = state(runs); } catch { continue; }
      const first = !looked.has(folder);
      looked.add(folder);
      if (run.on) { last[folder] = { since: lockSince(runs) }; held.delete(folder); continue; }
      delete last[folder];
      const sw = readAutoBuild(runs);
      if (first) {
        if (sw?.on) void launch(folder, 'its Auto-build switch was last turned on', 0);
        else if (wantedAtStart(sw, atStart[folder])) void launch(folder, 'it was on when speck serve last stopped', 0);
        continue;
      }
      if (!sw?.on) { held.delete(folder); continue; }
      const t = now(), times = (restarts.get(folder) ?? []).filter(at => t - at < HOUR_MS);
      restarts.set(folder, times);
      if (times.length >= RESTARTS_AN_HOUR) {
        const until = times[0] + HOUR_MS;
        if (held.get(folder) !== until) {
          held.set(folder, until);
          const text = `speck run stopped without being turned off, but speck serve has started it again ${RESTARTS_AN_HOUR} times in the last hour, so it leaves it off until ${clock(until)}, then starts it again. Turn Auto-build off to stop it trying.`;
          pipelineSays(runs, text);
          say(`${name(folder)}: ${text}`);
        }
        continue;
      }
      times.push(t);
      void launch(folder, null, times.length);
    }
    for (const f of Object.keys(last)) if (!listed.has(f)) delete last[f];
    for (const f of [...looked]) if (!listed.has(f)) { looked.delete(f); restarts.delete(f); held.delete(f); } // a project put back on the list is looked at afresh
    save();
  }

  const stillOn = folders => folders.filter(f => { try { return state(runsIn(f)).on; } catch { return false; } });
  return { check, stillOn, save };
}

// What speck serve says as it stops about the runs it leaves on.
export const stillOnSays = names => (names.length ? `speck run is still on in ${names.join(', ')}: turn it off with each project's Auto-build switch.` : '');

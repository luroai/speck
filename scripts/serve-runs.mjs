// 0758: speck serve keeps each listed project's speck run going. The panel's Auto-build switch records how it was last
// turned in the project's speck/.cache/runs/auto-build.json, and speck serve records in the home folder which projects'
// runs it last saw on (~/.config/speck/serve-runs.json, kept after it stops). As it starts, it starts speck run in each
// project whose switch was last turned on, or whose run was on when it last stopped, unless the switch was turned off
// after that run took its lock. While it runs, a project whose switch is on and whose run has stopped is started again,
// at most 3 times an hour, saying so in the project's run.log, which the panel's Pipeline log shows. It never stops a
// run, apart from one it was starting when the switch was turned off: turning one off is the switch's job. A project on a
// speck from before 0758, whose panel doesn't record the switch, is kept going once speck serve has seen its run on,
// until the run says in run.log that it stopped as it was told to (stoppedAsTold); after the machine has started again,
// which stops every run that way, one that was on is started all the same.

import fs from 'node:fs';
import os from 'node:os';
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

// speck serve's record in the home folder: { runs, boot }. `runs` gives each project whose run it last saw on, or, on
// an older speck, kept going: { [folder]: { since, log } }, when that run took its lock and how long its run.log was
// then. `boot` is which start of the machine that was (bootMark), and `stopped` when speck serve was told to stop, in
// ms, or null.
export function readRunsRecord(file) {
  const runs = Object.create(null);
  try {
    const v = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const [folder, r] of Object.entries(v?.runs ?? {})) {
      if (path.isAbsolute(folder) && r && typeof r === 'object') runs[folder] = { since: typeof r.since === 'string' ? r.since : null, log: Number.isInteger(r.log) && r.log >= 0 ? r.log : 0 };
    }
    return { runs, boot: Number.isFinite(v?.boot) || (typeof v?.boot === 'string' && v.boot) ? v.boot : null, stopped: Number.isFinite(v?.stopped) ? v.stopped : null };
  } catch { return { runs, boot: null, stopped: null }; }
}

// Which start of the machine this is: Linux's boot id, or else when it started, in ms. restartedSince says whether the
// machine has started again since `boot`, which bootMark() gave earlier: never when they can't be compared.
export function bootMark() {
  try { const id = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(); if (id) return id; } catch { /* not Linux */ }
  return Math.round(Date.now() - os.uptime() * 1000);
}
export function restartedSince(boot, now = bootMark()) {
  if (typeof boot === 'string' && typeof now === 'string') return boot !== now;
  if (typeof boot === 'number' && typeof now === 'number') return Math.abs(now - boot) > 2 * 60 * 1000;
  return false;
}

// When run.log was last written to, in ms, or null.
const logTime = runs => { try { return fs.statSync(path.join(runs, 'run.log')).mtimeMs; } catch { return null; } };
// How close a run's stop has to be to speck serve's own for both to have been the machine shutting down, which stops
// every process at once.
const TOGETHER_MS = 10000;

// Whether speck run said it stopped as it was told to (Ctrl+C, the Auto-build switch or SIGTERM), in its run.log from
// `from` on: every speck run since before 1.5.0 says "speck run stopped." then, and one that ends any other way doesn't.
const logSize = runs => { try { return fs.statSync(path.join(runs, 'run.log')).size; } catch { return 0; } };
export function stoppedAsTold(runs, from) {
  try {
    const buf = fs.readFileSync(path.join(runs, 'run.log'));
    return /^(?:\d\d:\d\d:\d\d )?speck run stopped\./m.test(buf.subarray(from <= buf.length ? from : 0).toString('utf8'));
  } catch { return false; }
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

// Stops a run speck serve started, as the Auto-build switch does: SIGINT, then SIGKILL to its process group if it hasn't
// gone within STOP_MS * 2. Resolves with whether it has gone.
export async function stopRun(pid) {
  const goneWithin = async ms => { for (const until = Date.now() + ms; Date.now() < until; await sleep(POLL_MS)) if (!pidAlive(pid)) return true; return !pidAlive(pid); };
  try { process.kill(pid, 'SIGINT'); } catch { /* gone already */ }
  if (await goneWithin(STOP_MS * 2)) return true;
  try { process.kill(-pid, 'SIGKILL'); } catch { /* gone already */ }
  return goneWithin(STOP_MS);
}

// Whether the project's own speck records the Auto-build switch (0758 on). An older one's panel doesn't, so for it speck
// serve goes by the run itself: one it saw on is kept going until it says it stopped as it was told to (stoppedAsTold).
export const recordsSwitch = folder => fs.existsSync(path.join(folder, '.speck', 'scripts', 'serve-runs.mjs'));

const clock = ms => { const d = new Date(ms), two = n => String(n).padStart(2, '0'); return `${two(d.getHours())}:${two(d.getMinutes())}`; };

// What speck serve does about runs. check(folders) is called on each of its looks at the list; stillOn(folders) names
// the projects whose runs are on. `start`, `state` and `now` can be stood in for by tests.
export function runKeeper({ file, env, say, start = startRun, stop = stopRun, state = runState, now = Date.now, records = recordsSwitch, boot = bootMark }) {
  const before = readRunsRecord(file), atStart = before.runs; // as speck serve last left it
  // The machine has started again since, and speck serve was told to stop as it shut down: a run that stopped then was
  // stopped by the machine, not turned off.
  const restarted = restartedSince(before.boot, boot());
  const byShutdown = runs => { const at = logTime(runs); return restarted && before.stopped !== null && at !== null && Math.abs(at - before.stopped) <= TOGETHER_MS; };
  const last = Object.create(null);
  for (const f of Object.keys(atStart)) last[f] = atStart[f];
  let saved = null, saveError = null;
  const looked = new Set(), busy = new Set();
  const restarts = new Map(); // folder → the times this speck serve started its run again, in the last hour
  const held = new Map(); // folder → until when it's left off, once said
  const name = folder => path.basename(folder);

  let stoppedAt = null;
  function save() {
    const record = { boot: boot(), runs: last, ...(stoppedAt === null ? {} : { stopped: stoppedAt }) }, text = JSON.stringify(record.runs) + stoppedAt;
    if (text === saved) return;
    try { fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 }); writeJson(file, record); saved = text; saveError = null; } catch (e) {
      if (saveError !== (e.code || e.message)) say(`can't write ${file} (${saveError = e.code || e.message}), so the next speck serve may not know which runs were on.`);
    }
  }

  // `sw` is the switch as check() read it, to start on. A switch turned off since then, before or while the run starts,
  // wins: the run isn't started, or is stopped once it has taken its lock.
  async function launch(folder, why, again, sw, own) {
    const runs = runsIn(folder);
    const turnedOff = () => { const now = readAutoBuild(runs); return now && !now.on && now.at !== sw?.at; };
    busy.add(folder);
    // On an older speck, kept going from now on: its record says how long run.log was before it started.
    if (!own) last[folder] = { since: null, log: logSize(runs) };
    try {
      if (own && turnedOff()) return;
      // Its own speck records the switch: on, so a run that stops by itself is started again. One already on is left as it is.
      if (own && !sw?.on) { try { writeAutoBuild(runs, true, 'speck serve'); } catch { /* it still starts; a later stop is then not started again */ } }
      const got = await start(folder, env);
      if (got.pid && own && turnedOff()) {
        const gone = await stop(got.pid);
        const text = `Auto-build was turned off while speck serve was starting speck run (process ${got.pid}), so ${gone ? 'it was stopped' : `it was asked to stop but is still running: stop process ${got.pid} yourself`}.`;
        pipelineSays(runs, text);
        say(`${name(folder)}: ${text}`);
      } else if (got.pid) {
        const text = again ? `speck run ended without being turned off, so speck serve started it again (process ${got.pid}), ${again} of at most ${RESTARTS_AN_HOUR} times an hour.` : `started speck run (process ${got.pid}), as ${why}.`;
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
      if (run.on) {
        // How long run.log was when it was first seen on, so only what this run says after that is read when it stops.
        const since = lockSince(runs), prev = last[folder];
        if (!prev || prev.since === null) last[folder] = { since, log: prev ? prev.log : logSize(runs) }; // one it started: from before it did
        else if (prev.since !== since) last[folder] = { since, log: logSize(runs) };
        held.delete(folder);
        continue;
      }
      // An older speck's panel doesn't record its switch, so whatever is recorded there is speck serve's own, from before:
      // its run is kept going while speck serve's record has it, until it says it stopped as it was told to.
      const own = records(folder), sw = own ? readAutoBuild(runs) : null, was = last[folder];
      const told = !own && was && stoppedAsTold(runs, was.log);
      if (first) {
        delete last[folder];
        if (own && sw?.on) void launch(folder, 'its Auto-build switch was last turned on', 0, sw, own);
        else if (own && wantedAtStart(sw, atStart[folder])) void launch(folder, 'it was on when speck serve last stopped', 0, sw, own);
        else if (!own && was && !told) void launch(folder, 'it was on when speck serve last stopped', 0, sw, own);
        else if (!own && was && byShutdown(runs)) void launch(folder, 'it was on when the machine last stopped', 0, sw, own);
        continue;
      }
      const keep = own ? sw?.on : was && !told;
      if (!keep) { delete last[folder]; held.delete(folder); continue; }
      if (own) delete last[folder];
      const t = now(), times = (restarts.get(folder) ?? []).filter(at => t - at < HOUR_MS);
      restarts.set(folder, times);
      if (times.length >= RESTARTS_AN_HOUR) {
        const until = times[0] + HOUR_MS;
        if (held.get(folder) !== until) {
          held.set(folder, until);
          const text = `speck run ended without being turned off, but speck serve has started it again ${RESTARTS_AN_HOUR} times in the last hour, so it leaves it off until ${clock(until)}, then starts it again. Turn Auto-build off to stop it trying.`;
          pipelineSays(runs, text);
          say(`${name(folder)}: ${text}`);
        }
        continue;
      }
      times.push(t);
      void launch(folder, null, times.length, sw, own);
    }
    for (const f of Object.keys(last)) if (!listed.has(f)) delete last[f];
    for (const f of [...looked]) if (!listed.has(f)) { for (const m of [looked, restarts, held]) m.delete(f); } // a project put back on the list is looked at afresh
    save();
  }

  const stillOn = folders => folders.filter(f => { try { return state(runsIn(f)).on; } catch { return false; } });
  // speck serve has been told to stop: recorded, with the time, so the next one can tell a run the machine stopped as
  // it shut down from one turned off.
  const stopping = () => { stoppedAt = now(); save(); };
  return { check, stillOn, save, stopping };
}

// What speck serve says as it stops about the runs it leaves on.
export const stillOnSays = names => (names.length ? `speck run is still on in ${names.join(', ')}: turn it off with each project's Auto-build switch.` : '');

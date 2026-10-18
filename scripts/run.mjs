// speck run, pause, play and stop: start a build for each ready ticket, and hold, carry on or end one.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { builderSpend, waitFields, addPaused, pausedSince } from './core.mjs';
import { builderMismatch } from './install.mjs';
import { SpeckError, sh, findRepoRoot, loadConfig, parseTicket, setField, syncHeader, findTicket, splitCommand, worktreeList, readableLog, buildPaused, statusData, replaceSection, commitTicketOnly, shipQueue } from './speck.mjs';
import { resumeFor, handBackQueue } from './hand-back.mjs';
import { codexBuilds, codexStartWords, fillSession } from './codex-build.mjs';
import { countStop } from './stop-wait.mjs';
import { maxParallelBuilds } from './machine.mjs';
import { endBuild } from './stop-end.mjs';
import { buildEnv } from './build-env.mjs';
import { withBuilderModel, builderModelNote } from './build-model.mjs';
import { pidAlive, codeHash, launchedBefore, codeSwitch, awaitGo } from './run-switch.mjs';
export { pidAlive, runState } from './run-switch.mjs';
import { processRows, signalBuild, carryOn } from './build-procs.mjs';
export { processRows, buildProcesses, sessionInUse, runningPids } from './build-procs.mjs';
import { resumeHint, saveRecord, stoppedBySpeck, buildKilled, lastTicketCommit, buildTicket } from './build-records.mjs';
export { DEFAULT_RESUME_COMMAND, resumeHint, resumeCommandOf, buildKilled, buildTicket } from './build-records.mjs';

// ---------- run (start a non-interactive build for each ready ticket) ----------

const RUN_POLL_MS = 5000;
const DEFAULT_BUILD_COMMAND = 'claude -p "/speck-build {id}" --session-id {session} --output-format stream-json --verbose --dangerously-skip-permissions';

// The folder for speck run's records and logs, inside speck/.cache/, which git ignores.
export function runsDir(repo) {
  const root = path.join(repo, 'speck', '.cache');
  const dir = path.join(root, 'runs');
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return dir;
}

// One speck run per repo: a lock file holding its pid. The file is made complete and then linked into place, which
// is atomic, so no runner ever sees a half-written lock. A lock whose process is gone (killed outright) is taken
// over, but only while holding a second, short-lived recovery lock, so two runners can't both take over the same one.
function takeRunLock(repo) {
  const dir = runsDir(repo);
  const lock = path.join(dir, 'run.lock'), recover = path.join(dir, 'run.lock.recover');
  const mine = path.join(dir, `run.lock.${process.pid}.tmp`);
  fs.writeFileSync(mine, String(process.pid));
  const link = to => { try { fs.linkSync(mine, to); return true; } catch (e) { if (e.code === 'EEXIST') return false; throw e; } };
  const holder = f => { try { return fs.readFileSync(f, 'utf8').trim(); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  const busy = pid => { const n = Number(pid); return Number.isInteger(n) && n > 0 && n !== process.pid && pidAlive(n); };
  try {
    for (let tries = 0; tries < 5; tries++) {
      if (link(lock)) return lock;
      const pid = holder(lock);
      if (pid === null) continue; // removed just now: try again
      if (busy(pid))
        throw new SpeckError(`speck run is already running in this repo (process ${pid}). Stop that one first, or leave it running. If it isn't speck run, delete ${path.relative(repo, lock)}.`);
      // A stale lock. Take it over only while holding the recovery lock, and only if it's still the same stale one.
      if (!link(recover)) {
        const other = holder(recover);
        if (other !== null && !busy(other))
          throw new SpeckError(`A speck run was stopped while taking over a stale lock. If no speck run is running, delete ${path.relative(repo, recover)}, then run this again.`);
        throw new SpeckError(`Another speck run is starting in this repo (process ${other}). Leave that one running.`);
      }
      try {
        if (holder(lock) === pid) fs.rmSync(lock, { force: true });
        if (link(lock)) return lock;
      } finally { fs.rmSync(recover, { force: true }); }
    }
    throw new SpeckError('speck run couldn\'t take its lock file. Try again.');
  } finally { fs.rmSync(mine, { force: true }); }
}

// Takes the lock, and releases it as this process exits.
function holdRunLock(repo) {
  const lock = takeRunLock(repo);
  process.on('exit', () => { try { if (fs.readFileSync(lock, 'utf8').trim() === String(process.pid)) fs.rmSync(lock, { force: true }); } catch { /* already gone */ } });
}

// A file for the panel to hear one speck run's refusal in, and its text once read, deleting it (0220).
export const refusalFile = repo => path.join(runsDir(repo), `run.refusal.${crypto.randomUUID()}.tmp`);
export function takeRefusal(file) {
  try { return fs.readFileSync(file, 'utf8').trim(); } catch { return ''; } finally { fs.rmSync(file, { force: true }); }
}

// Writes a refusal to start to the file the panel named in SPECK_RUN_REFUSAL as well (0220), so the panel shows only this
// speck run's words. The variable is dropped first, so no build or ship this speck run starts inherits it.
export function cmdRun() {
  const refusal = process.env.SPECK_RUN_REFUSAL;
  delete process.env.SPECK_RUN_REFUSAL;
  try { runOn(false); } catch (e) {
    if (refusal && e instanceof SpeckError) try { fs.writeFileSync(refusal, e.message); } catch { /* the panel shows the exit code */ }
    throw e;
  }
}

export const runWorker = () => runOn(true); // speck run on new code, started by the one it replaces (0247)

// Watches the board: starts a build for each ready ticket that isn't waiting on another, up to max_parallel_builds at
// once, and ships approved ones (shipQueue). Each runs in its own process group, so stopping speck run leaves it running.
// When its code changes, it switches to the new code once nothing it started or adopted is running (run-switch.mjs).
function runOn(worker) {
  const code = process.env.SPECK_RUN_CODE || codeHash(), before = launchedBefore();
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const command = typeof cfg.build_command === 'string' ? cfg.build_command.trim() : '';
  const codex = codexBuilds(cfg); // 0289: builder codex with build_command blank builds with speck's own Codex command
  if (!command && !codex)
    throw new SpeckError(`No build_command is set in speck/config.yml, so speck run has nothing to start builds with. Add, for example:\n  build_command: '${cfg.builder === 'codex' ? '' : DEFAULT_BUILD_COMMAND}'${cfg.builder === 'codex' ? '\nA blank build_command starts each build with Codex.' : ''}`);
  let words;
  if (codex) words = codexStartWords(cfg);
  else try { words = splitCommand(command); } catch { throw new SpeckError(`build_command in speck/config.yml has a quote that isn't closed: ${command}`); }
  const mismatch = builderMismatch(cfg);
  if (mismatch) throw new SpeckError(`speck run won't start: ${mismatch.problem} ${mismatch.fix}`);
  words = withBuilderModel(words, cfg); // 0279: every build it starts, resumes or hands back runs on builder_model
  const max = maxParallelBuilds(cfg);
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    throw new SpeckError(`This checkout is on "${branch}", not ${cfg.base_branch}. speck run starts builds from ${cfg.base_branch}, so switch to it, then run this again.`);
  if (!worker) holdRunLock(repo); // the process you started holds it throughout: speck run on new code runs under it
  let started = false, loop = null;
  const stop = () => {
    if (!started) process.exit(0); // new code not yet watching: the speck run it was to replace says it has stopped
    console.log(`speck run stopped.${running.size ? ` ${running.size} build${running.size === 1 ? ' is' : 's are'} still running: ${[...running].join(', ')}.` : ''}${ships.note()}`);
    process.exit(0);
  };
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop);

  const launched = new Set(before); // every ticket this speck run, or the one it replaced, launched: none is launched twice
  const held = new Set(); // ready tickets whose last build speck stop ended, each reported once
  const uncommitted = new Set(); // ready tickets not yet committed as ready on the base branch, each reported once
  // The builds running, and the approved tickets to ship (0193), handing back each that needs work on it (0194).
  const running = new Set(), ships = shipQueue(repo, cfg, { handBack: h => handBacks.keep(h), waiting: id => handBacks.waiting(id) });
  const pollMs = Number(process.env.SPECK_RUN_POLL_MS) > 0 ? Number(process.env.SPECK_RUN_POLL_MS) : RUN_POLL_MS;
  let lastError = null;

  // Adds the exit to a build's run record, keeping what's there, so the board can tell a build that has finished, with
  // what its builder spent (builderSpend) when its log says. Written to a temporary file and renamed into place, so
  // nothing reading it sees half a record.
  const recordExit = (id, file, code) => {
    const tmp = `${file}.${process.pid}.tmp`;
    try {
      const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!rec || typeof rec !== 'object' || Array.isArray(rec)) throw new Error('it isn\'t a JSON object');
      let builder = null;
      try { builder = builderSpend(fs.readFileSync(path.join(path.dirname(file), `${id}.log`), 'utf8')); } catch { /* no log */ }
      const { builder: _, ...kept } = rec;
      fs.writeFileSync(tmp, `${JSON.stringify({ ...kept, exited: new Date().toISOString(), exit_code: code, ...(builder ? { builder } : {}) }, null, 2)}\n`);
      fs.renameSync(tmp, file);
    } catch (e) {
      fs.rmSync(tmp, { force: true, recursive: true });
      console.error(`${id}: couldn't save its exit in ${path.relative(repo, file)} (${e.message}), so the board won't show that this build has finished.`);
    }
  };

  // True for a build that was killed while its ticket is building or reviewing, which is left without an exit so the
  // next check resumes it. Any other build that has gone gets its exit recorded, as before.
  const killedInHand = id => {
    if (!buildKilled(runsDir(repo), id)) return false;
    try { return ['building', 'reviewing'].includes(statusData(repo).tickets.find(t => t.id === id)?.status); } catch { return true; }
  };

  const finished = (id, log, code, signal, failed, recordFile) => {
    running.delete(id);
    fill(id);
    if (failed) console.log(`${id} build couldn't start: ${failed}`);
    else if (stoppedBySpeck(recordFile)) {
      console.log(`${id} build ended by \`speck stop\`.`);
      recordExit(id, recordFile, signal ? null : code);
      return tick();
    } else {
      console.log(`${id} build exited with ${signal ? `signal ${signal}` : `code ${code}`}.`);
      // A build killed by a signal is left without an exit, so the next check can resume it.
      if (!signal || !killedInHand(id)) recordExit(id, recordFile, signal ? null : code);
    }
    if (!failed) reportIfStillReady(id, log);
    tick();
  };

  // A build that ended with its ticket still ready never started it: say so, with the end of its log.
  const reportIfStillReady = (id, log) => {
    let status = null;
    // From the same reading as the board, so a build's own worktree copy of the ticket counts.
    try { status = statusData(repo).tickets.find(t => t.id === id)?.status ?? null; } catch { /* unreadable: nothing to say */ }
    if (status !== 'ready') return;
    let tail = '';
    try { tail = readableLog(fs.readFileSync(log, 'utf8')).replace(/\s+$/, '').split('\n').slice(-5).join('\n'); } catch { /* no log */ }
    console.log(`${id} is still ready, so the build never started it. speck run won't launch it again. Last lines of ${path.relative(repo, log)}:\n${tail}`);
  };

  // Builds an earlier speck run launched: each run file with no exit recorded. One whose process is still running is
  // left alone and watched until it stops; it counts towards max_parallel_builds meanwhile. One whose process has
  // gone gets its exit recorded now. Its exit code can't be known, as it isn't this speck run's child.
  const adopted = new Map();
  const adoptEarlierBuilds = () => {
    const dir = runsDir(repo);
    for (const name of fs.readdirSync(dir).filter(f => /^[^.]+\.json$/.test(f)).sort()) {
      const id = name.slice(0, -'.json'.length), file = path.join(dir, name);
      fill(id);
      let rec;
      try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
      if (!rec || typeof rec !== 'object' || Array.isArray(rec) || Object.hasOwn(rec, 'exited')) continue;
      const pid = rec.pid;
      if (!(Number.isInteger(pid) && pid > 0 && pid !== process.pid && pidAlive(pid))) { if (!killedInHand(id)) recordExit(id, file, null); continue; }
      launched.add(id);
      running.add(id);
      const session = rec.session ?? 'unknown';
      adopted.set(id, { pid, session, file, log: path.join(dir, `${id}.log`) });
      console.log(`${id} is already being built (session ${session}, process ${pid}), so speck run won't launch it. It counts towards max_parallel_builds until it stops.${buildPaused(dir, id) ? ` It's paused: run \`speck play ${id}\` to carry it on.` : ''}`);
    }
  };
  const checkAdopted = () => {
    for (const [id, b] of adopted) {
      if (pidAlive(b.pid)) continue;
      b.session = fill(id)?.session ?? b.session;
      adopted.delete(id);
      running.delete(id);
      const byStop = stoppedBySpeck(b.file);
      if (!killedInHand(id)) recordExit(id, b.file, null);
      if (byStop) { console.log(`${id} build (session ${b.session}) ended by \`speck stop\`.`); continue; }
      console.log(`${id} build (session ${b.session}, process ${b.pid}) stopped.`);
      reportIfStillReady(id, b.log);
    }
  };

  // A Codex build (0289) chooses its own session, so its record has none until it's read from its log (fill). It's
  // marked `agent: codex`, and its processes are found by the fresh UUID in their environment (env_session).
  const launch = id => {
    const tag = crypto.randomUUID(), session = codex ? null : tag;
    const argv = words.map(w => w.replace(/\{id\}/g, id).replace(/\{session\}/g, tag));
    const started = new Date().toISOString();
    const own = codex ? { agent: 'codex', env_session: tag } : {};
    const record = pid => `${JSON.stringify({ id, session, ...own, cwd: repo, started, pid, command: argv }, null, 2)}\n`;
    startBuild(id, argv, repo, session, 'w', record, tag);
  };

  // 0289: a Codex build's session id, read from its log into its run record once Codex has written it. Its record.
  const fill = id => fillSession(runsDir(repo), id, saveRecord);

  // Carries on a build that was killed, once: its own session, from the folder it started in, logging to the end of
  // its log. Its record keeps everything, with the time it was resumed added, so it's never resumed a second time.
  const resumeKilled = (id, rec) => {
    const { argv, why } = resumeFor(words, cfg, id, rec);
    if (!argv) return reportStopped(id, rec, `speck run can't resume it: ${why}`);
    const recordFile = path.join(runsDir(repo), `${id}.json`);
    // 0217: the time it waited, stopped, is left out of its build time, counted while it can't be writing the ticket.
    const note = countStop(repo, id);
    if (note) console.log(`${id}:${note}`);
    const resumed = { ...rec, resumed: new Date().toISOString(), resume_command: argv };
    // Saved before the build carries on, so a record that can't be saved stops it being resumed at all.
    try { saveRecord(recordFile, resumed); } catch (e) { return reportStopped(id, rec, `speck run couldn't save its run record (${e.message}), so it wasn't resumed`); }
    const cwd = typeof rec.cwd === 'string' && fs.existsSync(rec.cwd) ? rec.cwd : repo;
    console.log(`${id} build (session ${rec.session}) stopped unexpectedly, so speck run is resuming it once.`);
    startBuild(id, argv, cwd, rec.session, 'a', pid => `${JSON.stringify({ ...resumed, pid: pid ?? rec.pid }, null, 2)}\n`, rec.env_session ?? rec.session);
  };

  // A killed build speck run won't resume, said once per speck run, with the command that resumes it by hand.
  const stoppedReported = new Set();
  const reportStopped = (id, rec, why) => {
    if (stoppedReported.has(id)) return;
    stoppedReported.add(id);
    console.log(`${id} build (session ${rec.session ?? 'unknown'}) stopped unexpectedly, and ${why}. ${resumeHint(cfg, rec)}`);
  };

  // Starts a build in its own process group, logging to <id>.log (opened with `flags`), and keeps its run record:
  // record(pid) is its text, written with pid null before it starts and again with its pid once it has. `env` is the
  // session in its environment (buildEnv): its own, unless it's a Codex build's (0289).
  const startBuild = (id, argv, cwd, session, flags, record, env = session) => {
    launched.add(id);
    running.add(id);
    const dir = runsDir(repo);
    const log = path.join(dir, `${id}.log`);
    const recordFile = path.join(dir, `${id}.json`);
    let fd = null, child;
    try {
      // Written before the build starts, so a record that can't be written stops the build from starting at all.
      if (flags === 'w') fs.writeFileSync(recordFile, record(null));
      fd = fs.openSync(log, flags);
      child = spawn(argv[0], argv.slice(1), { cwd, detached: true, stdio: ['ignore', fd, fd], env: buildEnv(argv, env) });
    } catch (e) { if (fd !== null) fs.closeSync(fd); return finished(id, log, null, null, e.message); }
    fs.closeSync(fd);
    let done = false;
    child.on('error', e => { if (!done) { done = true; finished(id, log, null, null, e.message); } });
    child.on('exit', (code, signal) => { if (!done) { done = true; finished(id, log, code, signal, null, recordFile); } });
    child.unref();
    if (child.pid) {
      try { fs.writeFileSync(recordFile, record(child.pid)); } catch (e) {
        console.error(`${id}: couldn't save its process id in ${path.relative(repo, recordFile)} (${e.message}). The build is running as process ${child.pid}, session ${session ?? 'not known yet'}.`);
      }
      console.log(`${flags === 'a' ? 'Resumed' : 'Launched'} ${id} (session ${session ?? 'read from its log once Codex writes it'}). Log: ${path.relative(repo, log)}`);
    }
  };

  const handBacks = handBackQueue({ repo, cfg, words, max, running, startBuild, saveRecord, resumeHint, runs: () => runsDir(repo), fill });

  const switchWhenIdle = codeSwitch({ worker, code, busy: () => [[...running], ships.running()], launched: () => [...launched], stopLoop: () => clearInterval(loop) });
  function tick() {
    for (const id of running) fill(id);
    checkAdopted();
    if (switchWhenIdle()) return;
    let tickets;
    try { tickets = statusData(repo).tickets; lastError = null; } catch (e) {
      const msg = e instanceof SpeckError ? e.message : String(e?.message || e);
      if (msg !== lastError) console.error(`speck run couldn't read the tickets, and will try again: ${msg}`);
      lastError = msg;
      return;
    }
    ships.check(tickets);
    // Builds that were killed with their ticket in hand: each resumed once.
    const runs = runsDir(repo);
    for (const t of tickets) {
      if (running.has(t.id) || (t.status !== 'building' && t.status !== 'reviewing')) continue;
      const rec = buildKilled(runs, t.id);
      if (!rec) continue;
      if (Object.hasOwn(rec, 'resumed')) { reportStopped(t.id, rec, 'speck run had already resumed it once, so it won\'t resume it again'); continue; }
      if (running.size < max) resumeKilled(t.id, rec);
    }
    handBacks.check(tickets);
    for (const t of tickets) {
      if (running.size >= max) break;
      if (t.status !== 'ready' || (t.waiting_on || []).length || launched.has(t.id)) continue;
      if (t.ship?.running === true) continue; // 0196: a ship of it is running, whatever its copy here says
      if (heldByStop(repo, t)) {
        if (!held.has(t.id)) console.log(`${t.id} was ended by \`speck stop\`, so speck run won't launch it again until its ticket is set ready again and committed.`);
        held.add(t.id);
        continue;
      }
      if (!readyOnBase(repo, cfg.base_branch, t.path)) {
        if (!uncommitted.has(t.id)) console.log(`${t.id} is ready but not committed as ready on ${cfg.base_branch}, so speck run is waiting for it to be committed before launching it.`);
        uncommitted.add(t.id);
        continue;
      }
      launch(t.id);
    }
  }

  const watchBoard = () => { started = true; tick(); loop = setInterval(tick, pollMs); };
  if (worker) return awaitGo(adoptEarlierBuilds, watchBoard, stop);
  const modelNote = builderModelNote(cfg);
  if (modelNote) console.log(modelNote);
  console.log(`speck run: watching for ready tickets every ${pollMs / 1000}s, up to ${max} build${max === 1 ? '' : 's'} at a time. Press Ctrl+C to stop.`);
  adoptEarlierBuilds();
  watchBoard();
}

// Whether the ticket at `rel` is ready in the base branch's latest commit. A ticket set ready but not committed, or
// never committed at all, isn't: `speck start` would refuse it.
function readyOnBase(repo, base, rel) {
  const r = sh('git', ['show', `refs/heads/${base}:${rel}`], { cwd: repo });
  if (r.status !== 0) return false;
  try { return parseTicket(r.stdout).fm.status === 'ready'; } catch { return false; }
}

// ---------- pause and play (hold a build speck run launched, then carry it on) ----------

// The run record of a ticket's build, from the main checkout's speck/.cache/runs/, with what pause and play need.
function runRecord(repo, args, usage) {
  if (!args[0]) throw new SpeckError(`Usage: speck ${usage} <id>`);
  if (process.platform === 'win32') throw new SpeckError(`speck ${usage} needs signals that Windows doesn't have, so it works on macOS and Linux only.`);
  const t = findTicket(repo, args[0]);
  const id = t.fm.id;
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const file = path.join(main, 'speck', '.cache', 'runs', `${id}.json`);
  let rec = null;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* no record */ }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) rec = null;
  const pid = rec?.pid;
  // Running: no exit recorded, and its pid still leads its own process group, as a build speck run launched does.
  const running = !!rec && !Object.hasOwn(rec, 'exited') && Number.isInteger(pid) && pid > 0 && pidAlive(pid)
    && processRows().some(([p, , g]) => p === pid && g === pid);
  return { id, rec, pid, running, mark: path.join(path.dirname(file), `${id}.paused`), paused: running && buildPaused(path.dirname(file), id) };
}

// Stops the build, then marks it paused. If either fails, whatever it stopped is carried on again. Returns what it
// did, for `speck pause` to print and the panel's pause icon to answer with.
export function pauseBuild(repo, args) {
  const b = runRecord(repo, args, 'pause');
  if (!b.running) throw new SpeckError(`${b.id} has no running build launched by speck run, so there's nothing to pause.`);
  if (b.paused) throw new SpeckError(`${b.id} is already paused. Run \`speck play ${b.id}\` to carry it on.`);
  const { sent, error } = signalBuild(b, 'SIGSTOP');
  if (error) { carryOn(sent); throw new SpeckError(`Couldn't pause ${b.id}: ${error} It's still running.`); }
  try { saveRecord(b.mark, { session: b.rec.session ?? null, pid: b.pid, paused: new Date().toISOString() }); } catch (e) {
    carryOn(sent);
    throw new SpeckError(`Couldn't mark ${b.id} paused in ${b.mark} (${e.message}), so it's still running.`);
  }
  return `${b.id} paused (session ${b.rec.session ?? 'unknown'}). Run \`speck play ${b.id}\` to carry it on.`;
}
export function cmdPause(args) { console.log(pauseBuild(findRepoRoot(), args)); }

// Adds the time a build has been paused to its ticket's waited_seconds and commits that, while the build is still
// stopped so it can't be writing the ticket too. The mark then starts from now, so a play run again after something
// failed counts only the time since. Returns a note for play to add when the time couldn't be recorded.
function countPause(repo, b) {
  let at, t;
  try { ({ at, t } = buildTicket(repo, loadConfig(repo), b.id)); } catch { return ' Its paused time couldn\'t be added to its ticket, which wasn\'t found.'; }
  const now = Date.now(), text = addPaused(t, pausedSince(b.mark), now);
  if (text === t.raw) return '';
  let commit;
  try { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, `speck(${b.id}): paused time`); } catch { commit = { status: 1 }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  if (commit.status !== 0) return ` Its paused time couldn't be recorded in ${at}, so its ticket is unchanged and the time will count as build time.`;
  try { saveRecord(b.mark, { ...JSON.parse(fs.readFileSync(b.mark, 'utf8')), paused: new Date(now).toISOString() }); } catch { /* play removes the mark next */ }
  return '';
}

// Counts the paused time, carries the build on, then drops the paused mark. Until all have worked it stays marked
// paused, so play can be run again.
export function playBuild(repo, args) {
  const b = runRecord(repo, args, 'play');
  if (!b.paused) throw new SpeckError(`${b.id} isn't paused, so there's nothing to play.`);
  const note = countPause(repo, b);
  const { error } = signalBuild(b, 'SIGCONT');
  if (error) throw new SpeckError(`Couldn't play ${b.id}: ${error} It may be only partly playing, so it's still marked paused. Run \`speck play ${b.id}\` again.`);
  try { fs.rmSync(b.mark, { force: true }); } catch (e) {
    throw new SpeckError(`${b.id} is playing, but its paused mark ${b.mark} couldn't be removed (${e.message}). Run \`speck play ${b.id}\` again.`);
  }
  return `${b.id} playing again (session ${b.rec.session ?? 'unknown'}).${note}`;
}
export function cmdPlay(args) { console.log(playBuild(findRepoRoot(), args)); }

// ---------- stop (end a build speck run launched for good, and block its ticket) ----------

// True for a ticket whose last build `speck stop` ended, until the ticket has a commit other than the one it had when
// it was stopped (set ready again, for example). A ticket still ready because blocking it failed isn't launched again.
function heldByStop(repo, t) {
  const file = path.join(runsDir(repo), `${t.id}.json`);
  if (!stoppedBySpeck(file)) return false;
  let mark = null;
  try { mark = JSON.parse(fs.readFileSync(file.replace(/\.json$/, '.stopped'), 'utf8')); } catch { /* unreadable: held */ }
  return typeof mark?.ticket_commit !== 'string' || mark.ticket_commit === lastTicketCommit(t.worktree || repo, t.path);
}

// Ends the build, then blocks its ticket and commits that where the build keeps it. A <id>.stopped mark is left first,
// so speck run knows the build ended because of this rather than reporting it as a build that stopped or failed.
// `say` gets each line it reports, for `speck stop` to print and the panel's Stop build button to answer with.
export function stopBuild(repo, args, say) {
  const cfg = loadConfig(repo);
  const b = runRecord(repo, args, 'stop');
  if (!b.running) throw new SpeckError(`${b.id} has no running or paused build launched by speck run, so there's nothing to stop.`);
  const stopMark = path.join(path.dirname(b.mark), `${b.id}.stopped`);
  const pausedAt = b.paused ? pausedSince(b.mark) : null;
  // The ticket's commit as the build ends, so speck run can tell when it has been committed again since.
  const ticketCommit = () => { try { const { at, t } = buildTicket(repo, cfg, b.id); return lastTicketCommit(at, path.relative(at, t.file)); } catch { return null; } };
  const mark = { session: b.rec.session ?? null, pid: b.pid, stopped: new Date().toISOString(), ticket_commit: ticketCommit() };
  try { saveRecord(stopMark, mark); } catch (e) {
    throw new SpeckError(`Couldn't mark ${b.id} stopped in ${stopMark} (${e.message}), so it's still ${b.paused ? 'paused' : 'running'}.`);
  }
  const { sent, error } = signalBuild(b, 'SIGSTOP');
  if (error) {
    if (!b.paused) carryOn(sent);
    fs.rmSync(stopMark, { force: true });
    throw new SpeckError(`Couldn't stop ${b.id}: ${error} It's still ${b.paused ? 'paused' : 'running'}.`);
  }
  let left;
  try { left = endBuild(b, sent); } catch (e) {
    throw new SpeckError(`${b.id}'s build may be only partly stopped: ${e.message} Its ticket is unchanged. Run \`speck stop ${b.id}\` again. If it says there's nothing to stop, end any of its processes still running yourself, then block its ticket with \`speck set ${b.id} status blocked\`.`);
  }
  if (left.length)
    throw new SpeckError(`Couldn't end all of ${b.id}'s build: process${left.length === 1 ? '' : 'es'} ${left.join(', ')} ${left.length === 1 ? 'is' : 'are'} still running. End ${left.length === 1 ? 'it' : 'them'} with \`kill -9 ${left.join(' ')}\`. Its ticket is unchanged.`);
  fs.rmSync(b.mark, { force: true });
  say(`${b.id} stopped (session ${b.rec.session ?? 'unknown'}).`);

  const now = ticketCommit();
  if (now !== mark.ticket_commit) try { saveRecord(stopMark, { ...mark, ticket_commit: now }); } catch { /* the earlier commit stays: it's still held */ }
  const { at, t } = buildTicket(repo, cfg, b.id);
  if (['approved', 'done', 'cancelled'].includes(t.fm.status)) { say(`Its ticket is ${t.fm.status}, so it was left as it is.`); return; }
  const d = new Date();
  const question = `Stopped by you on ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.`;
  const comments = old => (old.match(/<!--[\s\S]*?-->/g) || []).map(c => `${c}\n`).join('');
  // A pause ends where the block begins: its time is added, and the blocked time starts now (0166).
  let text = waitFields(setField(addPaused(t, pausedAt), 'status', 'blocked'), t.fm.status, 'blocked');
  text = /^## Blocked question[ \t]*$/m.test(text) ? replaceSection(text, 'Blocked question', old => `${comments(old)}${question}`, t.file)
    : `${text.replace(/\s*$/, '')}\n\n## Blocked question\n${question}\n`;
  fs.writeFileSync(t.file, syncHeader(text));
  const commit = commitTicketOnly(at, t.file, t.raw, `speck(${b.id}): stopped`);
  if (commit.status !== 0)
    throw new SpeckError(`${b.id}'s build is stopped, but its ticket couldn't be committed in ${at}, so it's unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}\nFix that, then run \`speck set ${b.id} status blocked\` there and commit it.`);
  // No branch: the build hadn't run speck start, so there's nothing kept, and speck start starts it again (0219).
  const branched = sh('git', ['for-each-ref', '--format=%(refname)', `refs/heads/${cfg.branch_prefix}${b.id}-*`], { cwd: repo }).stdout.trim();
  say(branched ? `${b.id} is blocked, with its branch and work kept. Resume its session, or run /speck-build ${b.id}, to carry on.`
    : `${b.id} is blocked. It was stopped before it started its ticket, so it has no branch or work yet. /speck-build ${b.id} starts it again.`);
}
export function cmdStop(args) { stopBuild(findRepoRoot(), args, line => console.log(line)); }

// speck run, pause, play and stop: start a build for each ready ticket, and hold, carry on or end one.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { builderSpend, waitFields, addPaused, pausedSince } from './core.mjs';
import { SpeckError, sh, findRepoRoot, loadConfig, parseTicket, setField, syncHeader, findTicket, splitCommand, worktreeList, readableLog, buildPaused, statusData, replaceSection, commitTicketOnly, shipQueue } from './speck.mjs';
import { resumeArgv, handBackQueue } from './hand-back.mjs';

// ---------- run (start a non-interactive build for each ready ticket) ----------

const RUN_POLL_MS = 5000;
export const DEFAULT_RESUME_COMMAND = 'claude --resume {session}';
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

export const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// Whether speck run is on, from its lock in the runs folder: on only while the pid the lock holds is alive. Only reads
// the lock, so it never takes, changes or deletes it. A lock left by a run that was killed outright shows as off.
export function runState(runs) {
  let text = '';
  try { text = fs.readFileSync(path.join(runs, 'run.lock'), 'utf8').trim(); } catch { /* no lock: off */ }
  const pid = /^[1-9]\d*$/.test(text) ? Number(text) : null;
  return pid !== null && pidAlive(pid) ? { on: true, pid } : { on: false, pid: null };
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

// Watches the board: starts a build for each ready ticket that isn't waiting on another, up to max_parallel_builds at
// once, and ships approved ones (shipQueue). Each runs in its own process group, so stopping speck run leaves it running.
export function cmdRun() {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const command = typeof cfg.build_command === 'string' ? cfg.build_command.trim() : '';
  if (!command)
    throw new SpeckError(`No build_command is set in speck/config.yml, so speck run has nothing to start builds with. Add, for example:\n  build_command: '${DEFAULT_BUILD_COMMAND}'`);
  let words;
  try { words = splitCommand(command); } catch { throw new SpeckError(`build_command in speck/config.yml has a quote that isn't closed: ${command}`); }
  const max = cfg.max_parallel_builds ?? 1;
  if (!Number.isInteger(max) || max < 1) throw new SpeckError(`max_parallel_builds in speck/config.yml must be a whole number of at least 1 (got "${max}").`);
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    throw new SpeckError(`This checkout is on "${branch}", not ${cfg.base_branch}. speck run starts builds from ${cfg.base_branch}, so switch to it, then run this again.`);
  const lock = takeRunLock(repo);
  const release = () => { try { if (fs.readFileSync(lock, 'utf8').trim() === String(process.pid)) fs.rmSync(lock, { force: true }); } catch { /* already gone */ } };
  process.on('exit', release);
  const stop = () => {
    console.log(`speck run stopped.${running.size ? ` ${running.size} build${running.size === 1 ? ' is' : 's are'} still running: ${[...running].join(', ')}.` : ''}${ships.note()}`);
    process.exit(0);
  };
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop);

  const launched = new Set(); // every ticket this speck run has launched, so none is launched twice
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
      adopted.delete(id);
      running.delete(id);
      const byStop = stoppedBySpeck(b.file);
      if (!killedInHand(id)) recordExit(id, b.file, null);
      if (byStop) { console.log(`${id} build (session ${b.session}) ended by \`speck stop\`.`); continue; }
      console.log(`${id} build (session ${b.session}, process ${b.pid}) stopped.`);
      reportIfStillReady(id, b.log);
    }
  };

  const launch = id => {
    const session = crypto.randomUUID();
    const argv = words.map(w => w.replace(/\{id\}/g, id).replace(/\{session\}/g, session));
    const started = new Date().toISOString();
    const record = pid => `${JSON.stringify({ id, session, cwd: repo, started, pid, command: argv }, null, 2)}\n`;
    startBuild(id, argv, repo, session, 'w', record);
  };

  // Carries on a build that was killed, once: its own session, from the folder it started in, logging to the end of
  // its log. Its record keeps everything, with the time it was resumed added, so it's never resumed a second time.
  const resumeKilled = (id, rec) => {
    const argv = resumeArgv(words, id, rec.session);
    if (!argv)
      return reportStopped(id, rec, `speck run can't resume it: ${typeof rec.session === 'string' && rec.session ? 'build_command needs --session-id {session} and one word with {id} in it' : 'its run record has no session'}`);
    const recordFile = path.join(runsDir(repo), `${id}.json`);
    const resumed = { ...rec, resumed: new Date().toISOString(), resume_command: argv };
    // Saved before the build carries on, so a record that can't be saved stops it being resumed at all.
    try { saveRecord(recordFile, resumed); } catch (e) { return reportStopped(id, rec, `speck run couldn't save its run record (${e.message}), so it wasn't resumed`); }
    const cwd = typeof rec.cwd === 'string' && fs.existsSync(rec.cwd) ? rec.cwd : repo;
    console.log(`${id} build (session ${rec.session}) stopped unexpectedly, so speck run is resuming it once.`);
    startBuild(id, argv, cwd, rec.session, 'a', pid => `${JSON.stringify({ ...resumed, pid: pid ?? rec.pid }, null, 2)}\n`);
  };

  // A killed build speck run won't resume, said once per speck run, with the command that resumes it by hand.
  const stoppedReported = new Set();
  const reportStopped = (id, rec, why) => {
    if (stoppedReported.has(id)) return;
    stoppedReported.add(id);
    console.log(`${id} build (session ${rec.session ?? 'unknown'}) stopped unexpectedly, and ${why}. ${resumeHint(cfg, rec)}`);
  };

  // Starts a build in its own process group, logging to <id>.log (opened with `flags`), and keeps its run record:
  // record(pid) is its text, written with pid null before it starts and again with its pid once it has.
  const startBuild = (id, argv, cwd, session, flags, record) => {
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
      child = spawn(argv[0], argv.slice(1), { cwd, detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, [BUILD_ENV]: session } });
    } catch (e) { if (fd !== null) fs.closeSync(fd); return finished(id, log, null, null, e.message); }
    fs.closeSync(fd);
    let done = false;
    child.on('error', e => { if (!done) { done = true; finished(id, log, null, null, e.message); } });
    child.on('exit', (code, signal) => { if (!done) { done = true; finished(id, log, code, signal, null, recordFile); } });
    child.unref();
    if (child.pid) {
      try { fs.writeFileSync(recordFile, record(child.pid)); } catch (e) {
        console.error(`${id}: couldn't save its process id in ${path.relative(repo, recordFile)} (${e.message}). The build is running as process ${child.pid}, session ${session}.`);
      }
      console.log(`${flags === 'a' ? 'Resumed' : 'Launched'} ${id} (session ${session}). Log: ${path.relative(repo, log)}`);
    }
  };

  const handBacks = handBackQueue({ repo, cfg, words, max, running, startBuild, saveRecord, resumeHint, runs: () => runsDir(repo) });

  function tick() {
    checkAdopted();
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

  console.log(`speck run: watching for ready tickets every ${pollMs / 1000}s, up to ${max} build${max === 1 ? '' : 's'} at a time. Press Ctrl+C to stop.`);
  adoptEarlierBuilds();
  tick();
  setInterval(tick, pollMs);
}

// A word for a POSIX shell: as it is when it's only letters, digits, /, ., _ and -, otherwise in single quotes.
const shellWord = w => (/^[A-Za-z0-9\/._-]+$/.test(w) ? w : `'${w.replace(/'/g, "'\\''")}'`);

// How to resume a killed build by hand, from resume_command in speck/config.yml (the default if it isn't set).
export function resumeHint(cfg, rec) {
  const session = typeof rec?.session === 'string' && rec.session ? rec.session : null;
  if (!session) return 'Run /speck-build to carry it on.';
  const cmd = !Object.hasOwn(cfg, 'resume_command') ? DEFAULT_RESUME_COMMAND : typeof cfg.resume_command === 'string' ? cfg.resume_command.trim() : '';
  if (!cmd) return `Resume session ${session} to carry it on.`;
  const cwd = typeof rec.cwd === 'string' && rec.cwd ? `cd ${shellWord(rec.cwd)} && ` : '';
  return `To carry it on, run: ${cwd}${cmd.split('{session}').join(shellWord(session))}`;
}

// Whether the ticket at `rel` is ready in the base branch's latest commit. A ticket set ready but not committed, or
// never committed at all, isn't: `speck start` would refuse it.
function readyOnBase(repo, base, rel) {
  const r = sh('git', ['show', `refs/heads/${base}:${rel}`], { cwd: repo });
  if (r.status !== 0) return false;
  try { return parseTicket(r.stdout).fm.status === 'ready'; } catch { return false; }
}

// ---------- pause and play (hold a build speck run launched, then carry it on) ----------

// Set in the environment of each build speck run launches, so every process the build starts inherits it.
const BUILD_ENV = 'SPECK_BUILD_SESSION';

// Every process, as [pid, ppid, pgid].
export function processRows() {
  const r = sh('ps', ['-A', '-o', 'pid=,ppid=,pgid=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}). Try again.`);
  return r.stdout.trim().split('\n').map(l => l.trim().split(/\s+/).map(Number)).filter(a => a.length === 3 && a.every(Number.isInteger));
}

// The processes whose environment holds `entry` (NAME=value). Linux reads /proc; macOS asks ps for each process's
// environment. Anywhere else, or for a process whose environment can't be read, it finds nothing.
function processesWithEnv(entry) {
  if (process.platform === 'linux') {
    const found = [];
    for (const d of fs.readdirSync('/proc').filter(d => /^\d+$/.test(d))) {
      try { if (fs.readFileSync(`/proc/${d}/environ`, 'utf8').split('\0').includes(entry)) found.push(Number(d)); } catch { /* gone, or not ours */ }
    }
    return found;
  }
  if (process.platform !== 'darwin') return [];
  const r = sh('ps', ['-A', '-E', '-ww', '-o', 'pid=,command=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}). Try again.`);
  const has = new RegExp(`(^|\\s)${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
  return r.stdout.split('\n').filter(l => has.test(l)).map(l => Number(l.trim().split(/\s+/)[0])).filter(Number.isInteger);
}

// A build and every process it started, still running: its process group, every process holding its session in
// BUILD_ENV, and everything descended from those. Claude Code runs each Bash command in a session of its own, and a
// background process whose parent has exited is no longer in the build's tree, so neither the group nor the tree
// alone would reach them all. This process and its own children are left out, so a build that pauses itself still
// finishes saying so.
function buildProcesses(pid, session) {
  const rows = processRows();
  const self = p => p === process.pid || rows.some(([q, pp]) => q === p && pp === process.pid);
  const found = new Set(rows.filter(([p, , g]) => p === pid || g === pid).map(([p]) => p));
  if (typeof session === 'string' && session) for (const p of processesWithEnv(`${BUILD_ENV}=${session}`)) found.add(p);
  for (let grew = true; grew;) {
    grew = false;
    for (const [p, pp] of rows) if (!found.has(p) && found.has(pp)) { found.add(p); grew = true; }
  }
  return [...found].filter(p => !self(p));
}

// Sends `signal` to a build and everything it started. Stopping goes round again for any process started meanwhile.
// A process that has gone meanwhile is skipped. Returns the processes it signalled, and the first error that stopped
// it (null if none), so the caller can undo what it did.
function signalBuild(b, signal) {
  const sent = [];
  try {
    for (let pass = 0; pass < 10; pass++) {
      const fresh = buildProcesses(b.pid, b.rec.session).filter(p => !sent.includes(p));
      if (!fresh.length) break;
      for (const p of fresh) {
        try { process.kill(p, signal); sent.push(p); }
        catch (e) { if (e.code !== 'ESRCH') throw new SpeckError(`Couldn't send ${signal} to process ${p} (${e.code || e.message}).`); }
      }
      if (signal !== 'SIGSTOP') break;
    }
  } catch (e) { return { sent, error: e instanceof SpeckError ? e.message : String(e?.message || e) }; }
  return { sent, error: null };
}
const carryOn = pids => { for (const p of pids) try { process.kill(p, 'SIGCONT'); } catch { /* gone */ } };

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

// Written to a temporary file and renamed into place, so nothing reading it sees half of it.
function saveRecord(file, rec) {
  const tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify(rec, null, 2)}\n`); fs.renameSync(tmp, file); }
  catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
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

const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// True if `speck stop` ended the build in this run record: a <id>.stopped file beside it names its session and pid.
function stoppedBySpeck(recordFile) {
  try {
    const rec = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
    const mark = JSON.parse(fs.readFileSync(recordFile.replace(/\.json$/, '.stopped'), 'utf8'));
    return !!rec && typeof rec === 'object' && !!mark && typeof mark === 'object' && Number.isInteger(mark.pid) && mark.pid === rec.pid && mark.session === rec.session;
  } catch { return false; }
}

// True if the build's log holds the result a stream-json build writes as it ends by itself. A build that was killed
// never writes one. A build_command without stream-json output writes none either, so each of its ends counts as a kill.
function logEnded(log) {
  let text;
  try { text = fs.readFileSync(log, 'utf8'); } catch { return false; }
  return text.split('\n').some(l => { if (!l.startsWith('{')) return false; try { return JSON.parse(l)?.type === 'result'; } catch { return false; } });
}

// The run record of a build that was killed: no exit recorded, a pid that has gone, not ended by `speck stop`, and
// no sign in its log that it ended by itself. null for any other build, or no readable record.
export function buildKilled(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  const file = path.join(runs, `${id}.json`);
  let rec;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec) || Object.hasOwn(rec, 'exited')) return null;
  if (!Number.isInteger(rec.pid) || rec.pid <= 0 || pidAlive(rec.pid)) return null;
  if (stoppedBySpeck(file) || logEnded(path.join(runs, `${id}.log`)) || sessionInUse(rec.session)) return null;
  return rec;
}

// True if a running process names the session as a word of its command line, as a build resumed by hand does
// (`claude --resume <session>`). If processes can't be listed it's taken as in use, so a session is never resumed twice.
function sessionInUse(session) {
  if (typeof session !== 'string' || !session) return false;
  const r = sh('ps', ['-A', '-ww', '-o', 'args=']);
  if (r.status !== 0) return true;
  return r.stdout.split('\n').some(l => l.split(/[\s=]+/).includes(session));
}

// The last commit that changed a ticket file, as a hash ('' if none), in the checkout `dir` it's read from.
const lastTicketCommit = (dir, rel) => { const r = sh('git', ['log', '-1', '--format=%H', '--', rel], { cwd: dir }); return r.status === 0 ? r.stdout.trim() : ''; };

// True for a ticket whose last build `speck stop` ended, until the ticket has a commit other than the one it had when
// it was stopped (set ready again, for example). A ticket still ready because blocking it failed isn't launched again.
function heldByStop(repo, t) {
  const file = path.join(runsDir(repo), `${t.id}.json`);
  if (!stoppedBySpeck(file)) return false;
  let mark = null;
  try { mark = JSON.parse(fs.readFileSync(file.replace(/\.json$/, '.stopped'), 'utf8')); } catch { /* unreadable: held */ }
  return typeof mark?.ticket_commit !== 'string' || mark.ticket_commit === lastTicketCommit(t.worktree || repo, t.path);
}

// Every process still running, as a set of pids. One that has exited and waits only for its parent to collect it is over.
function runningPids() {
  const r = sh('ps', ['-A', '-o', 'pid=,stat=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}).`);
  return new Set(r.stdout.trim().split('\n').map(l => l.trim().split(/\s+/)).filter(([p, s]) => /^\d+$/.test(p) && !/^Z/.test(s || '')).map(([p]) => Number(p)));
}

// Ends a build and everything it started, already held with SIGSTOP (`held`) so none can start anything more: asks each
// to end (SIGTERM, and SIGCONT so a held one hears it), and ends any still there after a few seconds with SIGKILL.
// Every process it has found stays on its list, so one that leaves the build's tree when its parent ends is still ended.
// Returns the processes still running at the end.
function endBuild(b, held) {
  const known = new Set(held);
  const left = () => {
    for (const p of buildProcesses(b.pid, b.rec.session)) known.add(p);
    const running = runningPids();
    return [...known].filter(p => running.has(p));
  };
  const each = (pids, signal) => { for (const p of pids) try { process.kill(p, signal); } catch { /* gone */ } };
  const asked = new Set();
  const ask = pids => { const fresh = pids.filter(p => !asked.has(p)); for (const p of fresh) asked.add(p); each(fresh, 'SIGTERM'); each(fresh, 'SIGCONT'); };
  let now = left();
  ask(now);
  for (let i = 0; i < 50 && now.length; i++) { sleep(100); now = left(); ask(now); }
  for (let i = 0; i < 20 && now.length; i++) { each(now, 'SIGKILL'); sleep(100); now = left(); }
  return now;
}

// Where the ticket's build keeps it: the checkout its branch is in, or the main checkout before the build has started it.
function buildTicket(repo, cfg, id) {
  const list = worktreeList(repo);
  const branch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${id}-`);
  const at = list.find(w => w.branch && branch.test(w.branch) && fs.existsSync(w.path))?.path || list[0].path;
  return { at, t: findTicket(at, id) };
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
  say(`${b.id} is blocked, with its branch and work kept. Resume its session, or run /speck-build ${b.id}, to carry on.`);
}
export function cmdStop(args) { stopBuild(findRepoRoot(), args, line => console.log(line)); }

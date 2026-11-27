// 0756: `speck serve`, one speck service per machine. It starts and looks after a panel for every project on `speck
// projects`' list (0755), each on that project's own copy of speck, whatever its version (its .speck/scripts/speck.mjs),
// on a free port of its own on 127.0.0.1. It reads the list every 2 seconds: it starts a panel for a project added to it,
// stops the one it started for a project taken off it and starts one of its panels that exits again. A project whose
// panel is already running, as `speck projects` says, is left as it is. Each panel's output goes to its project's
// speck/.cache/panel.log, as `speck panel --background`'s does. Only one runs per machine: its record in the home
// folder, ~/.config/speck/serve.json, is its lock and names the panels it started, so `speck serve --stop`, or the next
// speck serve after one was killed, finds them. --background runs it on its own, its output in ~/.config/speck/serve.log.
// 0757: it answers at one address too, 127.0.0.1:4777 unless --port gives another, and --url's https address, opening on
// All projects, from which each project's panel is shown there (serve-front.mjs). A speck serve that can't answer
// there starts nothing.
// 0758: it also keeps each listed project's speck run going (serve-runs.mjs), and never stops one.
// 0762: a project turned off with `speck projects off` is treated as one taken off the list, apart from what's said:
// the panel speck serve started for it is stopped, its panel and its speck run aren't started, and the address leaves
// it out. Turned on again, it's looked at afresh, as one just added.
// 0771: it switches to new code by itself (serve-switch.mjs): once its code has changed and settled, a worker process on
// the new code takes over, and the process you started, which keeps the record, hosts it from then on.

import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError } from './core.mjs';
import { homeSettingsDir } from './home-settings.mjs';
import { listedProjects, projectEntries, panelPorts } from './projects.mjs';
import { panelAnswers } from './panel-background.mjs';
import { pidAlive, runState, codeHash } from './run-switch.mjs';
import { timedMessage } from './run-times.mjs';
import { BUILD_ENV } from './build-env.mjs';
import { startFront, serveAddress, addressText } from './serve-front.mjs';
import { runKeeper, runsIn, stillOnSays } from './serve-runs.mjs'; // 0758
import { startSuccessor, hostWorkers, codeWatch, toHost, STOP_SIGNALS, pairsOf, stringsOf, retryOf, carriedRecord } from './serve-switch.mjs'; // 0771

const TICK_MS = 2000, START_MS = 15000, STOP_MS = 5000, POLL_MS = 100, SERVE_STOP_MS = 30000, BACKGROUND_MS = 60000;
// 0771: how often a worker looks at its code, and how long one handing over to new code waits for the answers it's
// giving before it closes what's left: long enough for a Ship passed on to a project's panel.
const CODE_MS = 500, HAND_OFF_MS = 60 * 60 * 1000;
// How long a panel has to answer once started, in ms. SPECK_SERVE_START_MS sets it directly, for speck's own tests.
const startMs = () => (Number(process.env.SPECK_SERVE_START_MS) > 0 ? Number(process.env.SPECK_SERVE_START_MS) : START_MS);
const RETRY_MS = [2000, 5000, 10000, 30000, 60000]; // before trying again after 1, 2, 3, 4, then 5 or more failed starts in a row
const AWAY = 'SPECK_SERVE_AWAY'; // set for the speck serve --background starts
const USAGE = 'speck serve [--port <n>] [--url https://<hostname>]   start a panel for every project on your list, and look after them and their speck runs\n                             until Ctrl+C, at one address that opens on All projects (http://127.0.0.1:4777 unless --port gives another)\n  speck serve --background   the same, on its own, after the shell that started it has ended\n  speck serve --stop         stop it, and every panel it started, leaving each speck run on\n  speck serve --install      start it by itself at boot or login, and again if it stops (with --port and --url, if given)\n  speck serve --uninstall    stop that, and remove what --install wrote';
const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const say = text => console.log(timedMessage(`speck serve: ${text}`));
const nameOf = folder => path.basename(folder);
const address = port => `http://127.0.0.1:${port}/`;
const listOf = names => names.join(', ');
const panels = n => `${n} panel${n === 1 ? '' : 's'}`;

// speck serve's files in the home folder, or null when there's no home folder.
export function serveFiles(env = process.env) {
  const dir = homeSettingsDir(env);
  return dir ? { dir, record: path.join(dir, 'serve.json'), log: path.join(dir, 'serve.log'), runs: path.join(dir, 'serve-runs.json') } : null;
}
// A file as messages name it: ~/.config/speck/<name> unless the tests moved it.
const shown = (env, file) => (env.SPECK_HOME_SETTINGS_DIR ? file : `~/.config/speck/${path.basename(file)}`);

const validPanel = p => p && typeof p.folder === 'string' && path.isAbsolute(p.folder) && Number.isInteger(p.pid) && p.pid > 0 && Number.isInteger(p.port) && p.port > 0 && p.port < 65536;
function readRecord(file) {
  try {
    const r = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!r || !Number.isInteger(r.pid) || r.pid <= 0) return null;
    return { ...r, panels: Array.isArray(r.panels) ? r.panels.filter(validPanel) : [] };
  } catch { return null; }
}
function writeRecord(file, record) {
  const tmp = `${file}.${process.pid}.w.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify(record)}\n`, { mode: 0o600 }); fs.renameSync(tmp, file); }
  catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
}
const forgetRecord = (file, pid) => { if (readRecord(file)?.pid === pid) fs.rmSync(file, { force: true }); };

// A process's command line, from ps, so a pid since reused by another program is never taken for ours: '' when it has
// gone or can't be read, as nothing is signalled that isn't known to be speck's. 0771: from /proc where there is one,
// as ps reads every process each time, and speck serve looks at each panel it took over, which after a switch to new
// code is every panel, each time it reads the list.
const PROC = fs.existsSync('/proc/self/cmdline');
export function argsOf(pid) {
  if (PROC) { try { return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0+$/, '').replace(/[\0-\x1f\x7f]/g, ' '); } catch { return ''; } } // as ps shows it
  const r = spawnSync('ps', ['-ww', '-o', 'args=', '-p', String(pid)], { encoding: 'utf8' });
  return !r.error && r.status === 0 ? r.stdout.trim() : '';
}
const isServe = pid => pid !== process.pid && pidAlive(pid) && /speck(\.mjs)?\s+serve(\s|$)/.test(argsOf(pid));
const scriptOf = folder => path.join(folder, '.speck', 'scripts', 'speck.mjs');
// The panel speck serve started for `folder` on `port`, still running: its own speck's panel command, on that port.
function isOurPanel({ pid, port, folder }) {
  if (!pidAlive(pid)) return false;
  const a = argsOf(pid);
  return a.includes(scriptOf(folder)) && new RegExp(`\\spanel\\s(.*\\s)?--port ${port}(\\s|$)`).test(a);
}

// Takes the record as this speck serve's lock, linking a complete file into place so nobody sees half of it: { was },
// the record of a speck serve that has gone, which it replaces, or null; or { holder }, a speck serve still running.
// A record that's gone stale is replaced only while holding a second, short-lived lock, so two can't both replace it.
function takeRecord(file, mine, show) {
  try { return takeRecordOnce(file, mine); } catch (e) {
    if (e instanceof SpeckError) throw e;
    throw new SpeckError(`speck serve can't write its record, ${show} (${e.code || e.message}). Make sure you can write to that folder, then run it again.`);
  }
}
function takeRecordOnce(file, mine) {
  const recover = `${file}.recover`, tmp = `${file}.${process.pid}.tmp`;
  const text = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  const link = to => { try { fs.linkSync(tmp, to); return true; } catch (e) { if (e.code === 'EEXIST') return false; throw e; } };
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(tmp, `${JSON.stringify(mine)}\n`, { mode: 0o600 });
  try {
    for (let tries = 0; tries < 5; tries++) {
      if (link(file)) return { was: null };
      const before = text(file);
      if (before === null) continue; // removed just now: try again
      const held = readRecord(file);
      if (held && isServe(held.pid)) return { holder: held };
      if (!link(recover)) {
        const other = readRecord(recover);
        if (other && other.pid !== mine.pid && pidAlive(other.pid)) throw new SpeckError(`Another speck serve is starting on this machine (process ${other.pid}). Leave that one running.`);
        throw new SpeckError(`A speck serve was stopped while taking over a record it had left. If no speck serve is running, delete ${recover}, then run this again.`);
      }
      try {
        if (text(file) === before) fs.rmSync(file, { force: true });
        if (link(file)) return { was: held };
      } finally { fs.rmSync(recover, { force: true }); }
    }
    throw new SpeckError(`speck serve couldn't take its record, ${file}. Run it again.`);
  } finally { fs.rmSync(tmp, { force: true }); }
}

const when = iso => { const d = new Date(iso); if (Number.isNaN(+d)) return 'a while ago'; const two = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`; };
// 0757: and where it answers, as its record says.
const recordedAddress = held => (Number.isInteger(held.port) && held.port > 0 && held.port < 65536 ? `, at ${addressText(held.port, typeof held.url === 'string' ? held.url : null)}` : '');
const alreadyRunning = (held, env) => `speck serve is already running on this machine (process ${held.pid}), since ${when(held.started)}${recordedAddress(held)}${held.log ? `, with its output in ${shown(env, held.log)}` : ''}. Stop it with speck serve --stop, or leave it running.`;

// A port on 127.0.0.1 that was free just now: `port` itself, or any when it's 0. null when it can't be had.
const listenOn = port => new Promise(resolve => {
  const s = net.createServer();
  s.once('error', () => resolve(null));
  s.listen(port, '127.0.0.1', () => { const got = s.address().port; s.close(() => resolve(got)); });
});

// Stops one panel speck serve started, as speck panel --stop stops one: SIGTERM to the process it started, which ends
// the rest of the panel, then SIGKILL to all of it, in its own process group, if it hasn't gone within STOP_MS. `ours`
// says whether its pid is still that process, so a pid since reused by another program is never signalled. Its group
// is signalled only while that process, or a part of the panel still answering on its port, keeps the group's id its.
async function stopPanel(p, ours) {
  const goneWithin = async ms => {
    for (const until = Date.now() + ms; Date.now() < until; await sleep(POLL_MS)) if (!ours(p) && !(await panelAnswers(p.folder, p.port))) return true;
    return false;
  };
  if (ours(p)) { try { process.kill(p.pid, 'SIGTERM'); } catch { /* gone already */ } }
  if (await goneWithin(STOP_MS)) return true;
  if (ours(p) || (await panelAnswers(p.folder, p.port))) { try { process.kill(-p.pid, 'SIGKILL'); } catch { /* gone already */ } }
  return goneWithin(STOP_MS);
}

// The last line a panel wrote to its log since `from`, without its full stop, as a message goes on after it, or ''.
function lastWords(file, from) {
  try { return (fs.readFileSync(file).subarray(from).toString('utf8').trim().split('\n').filter(l => l.trim()).pop()?.trim().slice(0, 300) || '').replace(/\.$/, ''); } catch { return ''; }
}
// The project's speck/.cache/panel.log, making the folder, which git ignores, when it's missing.
function panelLog(folder) {
  const root = path.join(folder, 'speck', '.cache');
  fs.mkdirSync(root, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return path.join(root, 'panel.log');
}

// Why a listed project's panel can't start, or null when it can.
function cannotStart(folder) {
  const name = nameOf(folder);
  let dir = false;
  try { dir = fs.statSync(folder).isDirectory(); } catch { /* not there */ }
  if (!dir) return `${name} isn't there any more (${folder}), so its panel can't start. \`speck projects remove ${folder}\` takes it off the list.`;
  if (!fs.existsSync(scriptOf(folder))) return `${name} (${folder}) has no .speck/scripts/speck.mjs, so its panel can't start. Set speck up there again, or take it off the list with \`speck projects remove ${folder}\`.`;
  return null;
}

// `speck serve` in the foreground, until Ctrl+C, SIGTERM or speck serve --stop. `served` is its --port and --url, from
// `args`. 0771: `host` is the pid of the process you started, which its record holds, and `running` the hash of the
// code it runs. `worker`: it runs in a worker that process started on new code (serveWorker), `carried` being what the
// one before it looked after and `handle` the socket that one answered on, which this one answers on from then on.
async function serve(env, { away, served, args, host, running, worker = false, carried = null, handle = null }) {
  const files = serveFiles(env);
  if (!files) throw new SpeckError('There\'s no home folder for speck serve to keep its record in, so it can\'t run.');
  const panelEnv = { ...env };
  delete panelEnv[BUILD_ENV]; // each panel is yours, listed where speck projects looks, even when a build starts speck serve
  const me = carried ? carriedRecord(carried.record, host) : { pid: host, started: new Date().toISOString(), log: away ? files.log : null, ready: false, panels: [] };
  let was = null;
  if (!carried) {
    const took = takeRecord(files.record, me, shown(env, files.record));
    if (took.holder) throw new SpeckError(alreadyRunning(took.holder, env));
    was = took.was;
  }

  const owned = new Map(); // folder → { folder, name, port, pid, child, state: starting | running | stopping }
  const retry = new Map(pairsOf(carried?.retry).map(([f, r]) => [f, retryOf(r)])); // folder → { fails, at, port, said }: when to start its panel again, and on which port
  const noted = new Map(pairsOf(carried?.noted).filter(([, t]) => typeof t === 'string')); // folder → what was last said about a project it has no panel of its own for
  const offSaid = new Set(stringsOf(carried?.offSaid)); // 0762: the projects turned off it has said it leaves out, until they're turned on again
  const keeper = runKeeper({ file: files.runs, env: panelEnv, say, carried: carried?.keeper }); // 0758: each project's speck run
  let stopping = false, ticking = false, again = false, listError = null, timer = null, saved = null, saveError = null, front = null;
  let handing = false, codeTimer = null, successor = null; // 0771: handing over to a worker on new code, from asking for one until it stays or exits, and that worker while it starts, when this process started it
  // Its record, with the panels it has started, when that has changed. Never over another speck serve's, after this
  // one's was deleted by hand, and not again once it has been forgotten as this one stops. 0771: nor while it's handing
  // over, as the worker on the new code writes it from then on.
  const save = () => {
    if (handing) return;
    const record = { ...me, panels: [...owned.values()].filter(p => p.pid).map(({ folder, port, pid }) => ({ folder, port, pid })) };
    const now = readRecord(files.record);
    if ((now && now.pid !== me.pid) || (stopping && !now) || (now && JSON.stringify(record) === saved)) return;
    try { writeRecord(files.record, record); saved = JSON.stringify(record); saveError = null; } catch (e) {
      if (saveError !== e.code) say(`can't write its record, ${shown(env, files.record)} (${saveError = e.code || e.message}), so speck serve --stop may not find the panels it starts. It tries again as they change.`);
    }
  };
  const note = (folder, text) => { if (noted.get(folder) !== text) { noted.set(folder, text); say(text); } };
  // Whether a panel it has is still running as that panel: its child until it has exited, or, for one it took over from
  // a speck serve that was killed, a process ps still shows as that project's panel, as its pid may since be another's.
  const alive = p => (p.child ? p.child.exitCode === null && p.child.signalCode === null : isOurPanel(p));

  function failed(folder, why, logFile) {
    const r = retry.get(folder) ?? { fails: 0, said: null };
    const wait = RETRY_MS[Math.min(r.fails, RETRY_MS.length - 1)];
    retry.set(folder, { fails: r.fails + 1, at: Date.now() + wait, port: null, said: why });
    setTimeout(queueTick, wait + 10).unref(); // a look at the list when it's due, rather than at the check after
    if (why !== r.said) say(`${nameOf(folder)}'s panel didn't start: ${why}. speck serve tries again in ${wait / 1000} seconds, then less and less often, saying so again only if it fails another way.${logFile ? ` The panel's output is in ${logFile}.` : ''}`);
  }

  // Its panel `p` has exited. That attempt is over, whatever it was doing, so its start() stops waiting for it to answer
  // and only the next attempt changes when to try again.
  function exited(p, code, signal, logFile, from) {
    const was = p.state;
    p.state = 'gone';
    if (owned.get(p.folder) === p) owned.delete(p.folder);
    if (was === 'gone') return;
    if (was === 'stopping') return save();
    // Anything of it still answering on its port, which keeps its process group's id its: ended with it.
    void panelAnswers(p.folder, p.port).then(up => { if (up) try { process.kill(-p.pid, 'SIGKILL'); } catch { /* gone meanwhile */ } });
    // What it said last, when it ended with an error by itself: what went wrong, rather than how it started.
    const said = !signal && code ? lastWords(logFile, from) : '', how = `stopped (${signal ? `by ${signal}` : `exit code ${code}`})${said ? `, saying: ${said}` : ''}`;
    if (was === 'starting') failed(p.folder, `it ${how}`, logFile);
    else { retry.set(p.folder, { fails: 0, at: 0, port: p.port, said: null }); say(`${p.name}'s panel ${how}. Starting it again.`); }
    save();
    queueTick();
  }

  async function start(folder) {
    const name = nameOf(folder), last = retry.get(folder);
    const p = { folder, name, port: null, pid: null, child: null, state: 'starting' };
    owned.set(folder, p);
    noted.delete(folder);
    // The port it had, so an open page finds it again, unless something else has taken it.
    p.port = (last?.port && (await listenOn(last.port))) || (await listenOn(0));
    if (p.state !== 'starting') return;
    if (!p.port) { owned.delete(folder); return failed(folder, 'no port on 127.0.0.1 was free'); }
    let logFile, from = 0, fd;
    try {
      logFile = panelLog(folder);
      try { from = fs.statSync(logFile).size; } catch { /* no log yet */ }
      fd = fs.openSync(logFile, 'a');
      p.child = spawn(process.execPath, [scriptOf(folder), 'panel', '--port', String(p.port)], { cwd: folder, detached: true, stdio: ['ignore', fd, fd], env: panelEnv });
    } catch (e) { owned.delete(folder); return failed(folder, `it couldn't be started (${e.code || e.message})`); }
    finally { if (fd !== undefined) fs.closeSync(fd); }
    p.pid = p.child.pid;
    p.child.on('error', e => {
      const was = p.state;
      p.state = 'gone';
      if (owned.get(folder) === p) owned.delete(folder);
      if (was === 'starting') failed(folder, `it couldn't be started (${e.code || e.message})`);
      save();
    });
    p.child.on('exit', (code, signal) => exited(p, code, signal, logFile, from));
    save();
    for (const until = Date.now() + startMs(); Date.now() < until && p.state === 'starting'; await sleep(POLL_MS)) {
      if (!(await panelAnswers(folder, p.port)) || p.state !== 'starting') continue;
      p.state = 'running';
      retry.set(folder, { fails: 0, at: 0, port: p.port, said: null });
      save();
      return say(`${name}: ${address(p.port)}`);
    }
    if (p.state !== 'starting') return;
    await stopOne(p);
    failed(folder, `it didn't answer at ${address(p.port)} within ${startMs() / 1000} seconds, so it was stopped`, logFile);
  }

  function stopOne(p, message) {
    if (p.state === 'stopping') return p.stopped;
    if (p.state === 'gone') return Promise.resolve();
    p.state = 'stopping';
    p.stopped = (async () => {
      if (p.pid && alive(p)) await stopPanel(p, alive);
      if (owned.get(p.folder) === p) owned.delete(p.folder);
      save();
      if (message) say(message);
    })();
    return p.stopped;
  }

  // One look at the list: stops the panels of projects taken off it, or turned off, and starts one for each project on
  // it with none.
  function pass() {
    let entries;
    try { entries = projectEntries(env); listError = null; } catch (e) {
      if (e.message !== listError) say(`${listError = e.message} The panels it started keep running, and it reads the list again every ${TICK_MS / 1000} seconds.`);
      return [];
    }
    const folders = entries.filter(p => !p.off).map(p => p.folder), listed = new Set(folders), starts = [];
    const off = new Set(entries.filter(p => p.off).map(p => p.folder));
    for (const p of owned.values()) {
      if (off.has(p.folder)) { offSaid.add(p.folder); void stopOne(p, `${p.name} was turned off, so the panel speck serve started for it was stopped. It's left out until \`speck projects on ${p.name}\`.`); }
      else if (!listed.has(p.folder)) void stopOne(p, `${p.name} was taken off your list, so the panel speck serve started for it was stopped.`);
      // One it took over from an earlier speck serve isn't its child, so it's missed here rather than by its exit: once
      // its pid has gone, or is another program's, it's forgotten, never signalled, and the project gets a panel again.
      else if (!p.child && p.state === 'running' && !alive(p)) { p.state = 'gone'; owned.delete(p.folder); retry.set(p.folder, { fails: 0, at: 0, port: p.port, said: null }); say(`${p.name}'s panel stopped. Starting it again.`); }
    }
    for (const folder of folders) {
      if (owned.has(folder)) continue;
      const why = cannotStart(folder);
      if (why) { note(folder, why); continue; }
      // A panel on the port its own last panel had is that one still going away, not one started by hand.
      const running = panelPorts(folder, env).filter(port => port !== retry.get(folder)?.port);
      if (running.length) { note(folder, `${nameOf(folder)}: ${address(running[0])} (already running, so left as it is)`); continue; }
      if ((retry.get(folder)?.at ?? 0) > Date.now()) continue;
      starts.push(start(folder).catch(e => say(`${nameOf(folder)}'s panel couldn't be started: ${e?.message || e}`)));
    }
    for (const m of [noted, retry]) for (const f of m.keys()) if (!listed.has(f)) m.delete(f);
    for (const f of off) if (!offSaid.has(f)) { offSaid.add(f); say(`${nameOf(f)} is turned off, so speck serve leaves it out until \`speck projects on ${nameOf(f)}\`.`); }
    for (const f of offSaid) if (!off.has(f)) offSaid.delete(f);
    save();
    keeper.check(folders.filter(f => !cannotStart(f)), [...off]);
    return starts;
  }
  function queueTick() {
    if (stopping || handing) return; // 0771: nothing starts or stops while it hands over
    if (ticking) { again = true; return; }
    ticking = true;
    try { do { again = false; pass(); } while (again && !stopping && !handing); } finally { ticking = false; }
  }

  async function shutdown() {
    if (stopping) return;
    stopping = true;
    clearInterval(timer);
    clearInterval(codeTimer); // 0771
    successor?.kill('SIGKILL'); // 0771: new code still starting, which mustn't take over the panels this stops
    keeper.stopping(); // 0758
    front?.close(); // 0757: the address goes first, with every page's connection
    const mine = [...owned.values()];
    await Promise.all(mine.map(p => stopOne(p)));
    try { forgetRecord(files.record, me.pid); } catch { /* the next speck serve or --stop finds nothing of it running */ }
    say(`stopped${mine.length ? `, with the ${panels(mine.length)} it started: ${listOf(mine.map(p => p.name))}` : ''}.`);
    const on = runsLeftOn(env);
    if (on) say(on);
    process.exit(0);
  }
  // 0757: each project on the list, for All projects at the address, with the port of its panel running, started by
  // speck serve or by hand, or none.
  // 0762: only those that aren't turned off.
  const shownProjects = () => projectEntries(env).filter(p => !p.off).map(({ folder }) => ({ folder, name: nameOf(folder), port: panelPorts(folder, env)[0] ?? null }));
  // 0762: the ports of every panel running for those, read afresh for each answer at the address, which names them, so a
  // panel just started can be chosen at once. A list it can't read shows none.
  const shownPanels = () => { try { return new Set(projectEntries(env).filter(p => !p.off).flatMap(p => panelPorts(p.folder, env))); } catch { return new Set(); } };

  // 0771: its code, watched. Once a change has settled and nothing is starting or stopping, a worker on the new code is
  // started, with the socket this answers on and what it looks after (carry), and this starts and stops nothing more
  // until that one is ready, when it steps down, or has failed, when it stays, saying why.
  const code = codeWatch(running);
  let switchingTo = null;
  const carry = () => ({ args, away, record: { started: me.started, log: me.log, ready: me.ready },
    panels: [...owned.values()].filter(p => p.pid).map(({ folder, port, pid }) => ({ folder, port, pid })),
    retry: [...retry], noted: [...noted], offSaid: [...offSaid], keeper: keeper.carry() });
  function checkCode() {
    if (stopping || handing) return;
    const next = code.next(), socket = front?.handle();
    if (!next || !socket || keeper.busy() || [...owned.values()].some(p => p.state !== 'running')) return;
    handing = true;
    switchingTo = next;
    const m = { running: next, state: carry() };
    if (worker) return toHost({ type: 'switch', ...m }, socket, e => { if (e) stayed(`the process you started couldn't be asked for it (${e.message})`); }); // the host starts it
    // The process you started starts it itself, then hosts it in its place.
    successor = startSuccessor(m, socket, { own: true,
      ready: w => { successor = null; if (stopping) return void w.kill('SIGKILL'); hostWorkers(w); void stepDown(); },
      failed: why => { successor = null; stayed(why); } });
  }
  function stayed(why) {
    if (!handing || stopping) return;
    handing = false;
    code.failed(switchingTo);
    front.register(); // its record among the panels', which the new one may have written its own over
    say(`couldn't switch to the new code: ${String(why).replace(/\.$/, '')}. It's still running the code it had, and tries again at the next change.`);
    queueTick();
  }
  // The new one answers on the socket and looks after the panels: this stops taking connections and gives the answers
  // it's giving, saying nothing of a panel that exits. A worker then exits; the process you started stays, as the host.
  async function stepDown() {
    clearInterval(timer);
    clearInterval(codeTimer);
    for (const p of owned.values()) p.state = 'gone'; // the new code's from now on
    owned.clear();
    if (worker) for (const sig of STOP_SIGNALS) { process.removeAllListeners(sig); process.on(sig, () => process.exit(0)); }
    await front.handOff(HAND_OFF_MS);
    if (worker) process.exit(0);
  }
  function watchCode() {
    if (worker) process.on('message', m => { if (m?.type === 'stay') stayed(m.why || 'it didn\'t start'); else if (m === 'exit' && handing && !stopping) void stepDown(); });
    codeTimer = setInterval(checkCode, CODE_MS);
  }
  // A worker taking over, ready: the one before it stops looking after anything once the host has this, and this carries
  // on from there once told to go. Told to stop before then, it stops once it has gone on, as the panels are its then.
  async function takeOver() {
    let going = false, stopAfter = false;
    for (const sig of STOP_SIGNALS) process.on(sig, () => { if (going) void shutdown(); else stopAfter = true; });
    await new Promise(resolve => { const go = m => { if (m === 'go') { process.off('message', go); resolve(); } }; process.on('message', go); toHost('ready'); });
    going = true;
    if (stopAfter) return void shutdown();
    save();
    say('its code changed, so it switched to the new code.');
    timer = setInterval(queueTick, TICK_MS);
    watchCode();
    queueTick();
  }

  // 0757: its one address, before any panel starts: when it can't answer there, the record is put back as it was.
  // 0771: one taking over answers on the socket handed over, looking after the panels the worker before it did.
  if (carried) for (const p of (Array.isArray(carried.panels) ? carried.panels : []).filter(validPanel)) owned.set(p.folder, { ...p, name: nameOf(p.folder), child: null, state: 'running' });
  try { front = await startFront({ port: served.port, url: served.url, env, projects: shownProjects, shown: shownPanels, handle }); } catch (e) {
    if (!carried) try { if (was) writeRecord(files.record, was); else forgetRecord(files.record, me.pid); } catch { /* the next speck serve finds a record of a process that has gone */ }
    throw e;
  }
  me.port = front.port;
  me.url = served.url ? served.url.origin : null;
  if (carried) return takeOver();
  save();
  say(`All projects: ${addressText(me.port, me.url)}`);
  for (const sig of STOP_SIGNALS) process.on(sig, () => void shutdown());

  // The panels an earlier speck serve started and left running when it was killed: looked after again.
  for (const p of was?.panels ?? []) {
    if (owned.has(p.folder) || !isOurPanel(p) || !(await panelAnswers(p.folder, p.port))) continue;
    owned.set(p.folder, { ...p, name: nameOf(p.folder), child: null, state: 'running' });
    retry.set(p.folder, { fails: 0, at: 0, port: p.port, said: null });
    say(`${nameOf(p.folder)}: ${address(p.port)} (started by the last speck serve, looked after again)`);
  }
  let count = 0;
  try { count = projectEntries(env).filter(p => !p.off).length; } catch { /* said by the first pass */ }
  say(count
    ? `looking after a panel for each of the ${count} project${count === 1 ? '' : 's'} on your list, reading it again every ${TICK_MS / 1000} seconds. ${away ? 'It runs in the background: stop it with speck serve --stop.' : 'Stop it with Ctrl+C or speck serve --stop.'}`
    : `there are no projects on your list yet. Add one with \`speck projects add [<folder>]\` and its panel starts within ${TICK_MS / 1000} seconds.`);
  timer = setInterval(queueTick, TICK_MS);
  await Promise.all(pass());
  me.ready = true;
  save();
  watchCode(); // 0771
}

// 0771: speck serve in a worker on new code, which the process you started starts (startSuccessor, serve-switch.mjs). It's
// told to take over from the one before it, on older code, with the socket that one answers on and what it looks
// after. One that can't is ended, saying why to the host, which has the old one say it.
export async function serveWorker() {
  const env = process.env, host = Number(env.SPECK_SERVE_HOST);
  for (const k of ['SPECK_SERVE_CODE_URL', 'SPECK_SERVE_HOST']) delete env[k]; // not passed on to anything it runs
  if (!Number.isInteger(host) || host <= 0 || !process.send) throw new SpeckError('Start speck serve with: speck serve');
  // The host has gone, killed outright: so does this, leaving its panels running and its record, from which the next
  // speck serve takes them over, as after a speck serve that was killed.
  process.on('disconnect', () => process.exit(0));
  const [m, handle] = await new Promise(resolve => {
    const told = (msg, h) => { if (msg?.type === 'take') { process.off('message', told); resolve([msg, h]); } };
    process.on('message', told);
    toHost('hello');
  });
  const carried = m.state && typeof m.state === 'object' ? m.state : {}, args = stringsOf(carried.args);
  try {
    if (!handle) throw new SpeckError('the socket to answer on wasn\'t handed over');
    await serve(env, { away: carried.away === true, served: serveAddress(args), args, host, running: typeof m.running === 'string' ? m.running : codeHash(), worker: true, carried, handle });
  } catch (e) {
    const why = e instanceof SpeckError ? e.message.split('\n')[0] : `${e?.name || 'Error'}: ${String(e?.message ?? e).split('\n')[0]}`;
    toHost({ type: 'failed', why }, null, () => process.exit(1));
  }
}

// `speck serve --background`: speck serve on its own, in its own process group and session, with its output added to
// ~/.config/speck/serve.log. It returns once speck serve has started the first panels, with what it said about them.
// `args` are the rest of its arguments, its --port and --url (0757).
async function serveBackground(env, args) {
  const files = serveFiles(env);
  if (!files) throw new SpeckError('There\'s no home folder for speck serve to keep its record and log in, so it can\'t run.');
  const held = readRecord(files.record);
  if (held && isServe(held.pid)) return console.log(alreadyRunning(held, env));
  let from = 0, fd, child;
  try { fs.mkdirSync(files.dir, { recursive: true, mode: 0o700 }); } catch { /* said as the log can't be opened */ }
  try { from = fs.statSync(files.log).size; } catch { /* no log yet */ }
  try {
    fd = fs.openSync(files.log, 'a', 0o600);
    child = spawn(process.execPath, [CLI, 'serve', ...args], { cwd: files.dir, detached: true, stdio: ['ignore', fd, fd], env: { ...env, [AWAY]: '1' } });
  } catch (e) {
    throw new SpeckError(`speck serve can't write its log, ${shown(env, files.log)} (${e.code || e.message}), so it didn't start. Make sure you can write to that folder, then run it again.`);
  } finally { if (fd !== undefined) fs.closeSync(fd); }
  child.unref();
  let exited = null;
  child.on('error', e => { exited = { message: `speck serve couldn't start: ${e.message}` }; });
  child.on('exit', code => { exited = { code }; });
  const said = () => { try { return fs.readFileSync(files.log).subarray(from).toString('utf8').trimEnd(); } catch { return ''; } };
  const log = shown(env, files.log);
  for (const until = Date.now() + BACKGROUND_MS; Date.now() < until; await sleep(POLL_MS)) {
    const now = readRecord(files.record);
    if (exited) {
      if (now && isServe(now.pid)) return console.log(alreadyRunning(now, env)); // another started meanwhile
      throw new SpeckError(exited.message || said() || `speck serve stopped with exit code ${exited.code} before it was running. Its output is in ${log}.`);
    }
    if (now?.pid === child.pid && now.ready) {
      if (said()) console.log(said());
      console.log(`speck serve: running in the background (process ${child.pid}): stop it with speck serve --stop. Its output is in ${log}.`);
      process.exit(0); // the child's listeners would otherwise hold this process
    }
  }
  console.log(`${said() ? `${said()}\n` : ''}speck serve: running in the background (process ${child.pid}), still starting panels: stop it with speck serve --stop. Its output is in ${log}.`);
  process.exit(0);
}

// 0758: what speck serve says as it stops about the listed projects whose speck run it leaves on, or ''.
function runsLeftOn(env) {
  let folders = [];
  try { folders = listedProjects(env); } catch { return ''; }
  return stillOnSays(folders.filter(f => runState(runsIn(f)).on).map(nameOf));
}

// `speck serve --stop`: stops the speck serve running on this machine, which stops every panel it started, and then
// any of those it didn't get to, as when it was killed. Nothing else is stopped.
async function serveStop(env) {
  const files = serveFiles(env), held = files && readRecord(files.record);
  if (!held) return console.log('speck serve isn\'t running on this machine.');
  const names = ps => listOf(ps.map(p => nameOf(p.folder)));
  // The panels its record names, as --stop first read it and as it was left: it may have started one since.
  const started = () => {
    const later = readRecord(files.record), all = [...held.panels, ...(later?.pid === held.pid ? later.panels : [])];
    return all.filter((p, i) => all.findIndex(q => q.pid === p.pid) === i);
  };
  // Stops those still running, which it didn't get to: all of them, when it was killed.
  const stopLeft = async all => {
    const left = all.filter(isOurPanel), stopped = await Promise.all(left.map(p => stopPanel(p, isOurPanel)));
    const stuck = left.filter((p, i) => !stopped[i]);
    if (stuck.length) throw new SpeckError(`These panels speck serve started didn't stop: ${stuck.map(p => `${nameOf(p.folder)} (process ${p.pid})`).join(', ')}. Stop those processes yourself.`);
    return left;
  };
  if (isServe(held.pid)) {
    // Gone once its pid is no longer speck serve's, so one since reused by another program is never signalled.
    const goneWithin = async ms => { for (const until = Date.now() + ms; Date.now() < until; await sleep(POLL_MS)) if (!isServe(held.pid)) return true; return false; };
    try { process.kill(held.pid, 'SIGTERM'); } catch { /* gone already */ }
    if (!(await goneWithin(SERVE_STOP_MS)) && isServe(held.pid)) { try { process.kill(held.pid, 'SIGKILL'); } catch { /* gone already */ } }
    if (!(await goneWithin(STOP_MS))) throw new SpeckError(`speck serve (process ${held.pid}) didn't stop. Stop that process yourself.`);
    const all = started();
    await stopLeft(all);
    forgetRecord(files.record, held.pid);
    console.log(`speck serve: stopped (process ${held.pid})${all.length ? ` and the ${panels(all.length)} it started: ${names(all)}` : ''}.`);
    const on = runsLeftOn(env);
    return on && console.log(on);
  }
  const left = await stopLeft(started());
  forgetRecord(files.record, held.pid);
  console.log(left.length ? `speck serve isn't running on this machine, but ${panels(left.length)} it started ${left.length === 1 ? 'was' : 'were'}: stopped ${names(left)}.` : 'speck serve isn\'t running on this machine.');
}

export function cmdServe(args = []) {
  const env = process.env;
  // 0759: --install and --uninstall make it start by itself, as a service, or stop that.
  for (const flag of ['--install', '--uninstall']) {
    if (!args.includes(flag)) continue;
    const other = ['--install', '--uninstall', '--background', '--stop'].find(f => f !== flag && args.includes(f));
    if (other) throw new SpeckError(`Give ${flag} or ${other}, not both.`);
    return import('./serve-install.mjs').then(m => { for (const line of (flag === '--install' ? m.serveInstall : m.serveUninstall)(args)) console.log(line); })
      .catch(e => { console.error(e instanceof SpeckError ? e.message : `speck serve: ${e?.message || e}`); process.exit(1); });
  }
  // --background, --stop, and --port and --url (0757) with a value after each, or after =.
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--background' || args[i] === '--stop' || /^--(port|url)=/.test(args[i])) continue;
    if (args[i] === '--port' || args[i] === '--url') { i++; continue; }
    throw new SpeckError(`speck serve doesn't take ${args[i]}. Use one of:\n  ${USAGE}`);
  }
  if (args.includes('--background') && args.includes('--stop')) throw new SpeckError('Give --background or --stop, not both.');
  if (args.includes('--stop') && args.some(a => /^--(port|url)(=|$)/.test(a))) throw new SpeckError('speck serve --stop stops the speck serve running on this machine, wherever it answers, so it doesn\'t take --port or --url.');
  const served = args.includes('--stop') ? null : serveAddress(args); // checked before anything starts
  const fail = e => { console.error(e instanceof SpeckError ? e.message : `speck serve: ${e?.message || e}`); process.exit(e instanceof SpeckError && e.code > 0 ? e.code : 1); };
  if (args.includes('--stop')) return serveStop(env).catch(fail);
  if (args.includes('--background')) return serveBackground(env, args.filter(a => a !== '--background')).catch(fail);
  const away = env[AWAY] === '1';
  delete process.env[AWAY]; // not passed on to anything it runs
  return serve(env, { away, served, args, host: process.pid, running: codeHash() }).catch(fail);
}

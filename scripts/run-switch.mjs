// speck run's lock, and its switch to new code once no ship is running (0247), with builds carrying on through it (0301).
// The process you start holds the lock throughout. It runs speck run itself until its code changes; from the first switch on, it only waits on a speck run it started on
// the new code, passing it Ctrl+C, and starts the next one on each later change. So the lock's pid, the terminal and
// run.log stay the same, and only one speck run is ever watching the board.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SWITCH_START_MS = 10000;

export const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// Whether speck run is on, from its lock in the runs folder: on only while the pid the lock holds is alive. Only reads
// the lock, so it never takes, changes or deletes it. A lock left by a run that was killed outright shows as off.
export function runState(runs) {
  let text = '';
  try { text = fs.readFileSync(path.join(runs, 'run.lock'), 'utf8').trim(); } catch { /* no lock: off */ }
  const pid = /^[1-9]\d*$/.test(text) ? Number(text) : null;
  return pid !== null && pidAlive(pid) ? { on: true, pid } : { on: false, pid: null };
}

// speck run's code: every .mjs file in the folder it was started from. The stamp is cheap, to notice a change; the
// hash is the content, to tell a real change from a file saved again as it was.
const runCode = () => { try { return fs.readdirSync(DIR).filter(n => n.endsWith('.mjs')).sort().map(n => path.join(DIR, n)); } catch { return []; } };
const codeStamp = () => runCode().map(f => { try { const st = fs.statSync(f); return `${f}:${st.size}:${st.mtimeMs}:${st.ino}`; } catch { return `${f}:-`; } }).join('|');
export function codeHash() {
  const h = crypto.createHash('sha256');
  for (const f of runCode()) { h.update(f); h.update('\0'); try { h.update(fs.readFileSync(f)); } catch { h.update('-'); } h.update('\0'); }
  return h.digest('hex');
}

// Watches the code on each of speck run's checks. changed() gives the hash of new code to switch to, once a change
// has stayed for a check, or null: none, the code it runs, or code that has already failed to start (failed(hash)).
export function codeWatch(running) {
  let last = codeStamp(), hashed = last, next = null, failed = null;
  return {
    changed() {
      const now = codeStamp();
      if (now !== last) { last = now; return next; }
      if (now !== hashed) { hashed = now; const h = codeHash(); next = h !== running && h !== failed ? h : null; }
      return next;
    },
    failed(hash) { failed = hash; next = null; },
  };
}

// What the speck run this one replaced handed over: the tickets it had launched, and the builds it had running, which
// carry on (0301). Takes the switch's variables out of the environment, so no build or ship it starts gets them.
export function handedOver() {
  const ids = name => {
    let v = [];
    try { v = JSON.parse(process.env[name] || '[]'); } catch { /* none */ }
    return Array.isArray(v) ? v.filter(id => typeof id === 'string') : [];
  };
  const got = { launched: ids('SPECK_RUN_LAUNCHED'), running: ids('SPECK_RUN_RUNNING') };
  for (const k of ['SPECK_RUN_CODE', 'SPECK_RUN_CODE_URL', 'SPECK_RUN_LAUNCHED', 'SPECK_RUN_RUNNING']) delete process.env[k];
  return got;
}

// What speck run says once as it waits to switch: the ship it's waiting for, if any.
export function waitingSays(ship) {
  if (!ship) return 'speck run\'s code has changed, so it\'s switching to the new code.';
  return `speck run's code has changed, so it will switch to the new code when the ship of ${ship} has ended. It starts no new ship until then, and new builds may still start.`;
}
export const failedSays = reason => `speck run couldn't switch to the new code: ${reason}\nIt carries on with the code it has, and tries again at the next change.`;

// Why speck run on new code couldn't start, in one line unless speck said it in more.
const whyFailed = e => (e && e.name === 'SpeckError' ? e.message : `${(e && e.name) || 'Error'}: ${String((e && e.message) || e).split('\n')[0]}`);

// Starts speck run on the code as it is now (`hash`), writing where this one does, with the tickets launched so far, so
// it doesn't launch them again, and the builds running, which it watches from then on. It loads, checks its settings
// and adopts earlier builds, launching nothing, says 'ready' and waits for 'go' to start watching. Calls ready(child)
// once, or failed(reason) if it can't start, having stopped it.
export function startSuccessor(hash, { launched, running }, { ready, failed }) {
  const loader = `try { const m = await import(process.env.SPECK_RUN_CODE_URL); m.runWorker(); }
catch (e) { process.send({ type: 'failed', reason: e && e.name === 'SpeckError' ? e.message : (e && e.name || 'Error') + ': ' + String(e && e.message || e).split('\\n')[0] }, () => process.exit(1)); }`;
  let child, settled = false;
  const settle = (fn, arg) => { if (settled) return; settled = true; clearTimeout(timer); fn(arg); };
  const fail = reason => { if (settled) return; child?.kill('SIGKILL'); settle(failed, reason); };
  const timer = setTimeout(() => fail(`it wasn't ready within ${SWITCH_START_MS / 1000} seconds.`), SWITCH_START_MS);
  try {
    child = spawn(process.execPath, ['--input-type=module', '-e', loader], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      env: { ...process.env, SPECK_RUN_CODE: hash, SPECK_RUN_LAUNCHED: JSON.stringify(launched), SPECK_RUN_RUNNING: JSON.stringify(running), SPECK_RUN_CODE_URL: pathToFileURL(path.join(DIR, 'speck.mjs')).href } });
  } catch (e) { fail(`${e.message}.`); return null; }
  child.on('error', e => fail(`${e.message}.`));
  child.on('exit', code => fail(`it stopped with exit code ${code} before it was ready.`));
  child.on('message', m => {
    if (m?.type === 'failed') fail(m.reason);
    else if (m === 'ready') { child.removeAllListeners('exit'); child.removeAllListeners('error'); settle(ready, child); }
  });
  return child;
}

// speck run's side of the switch, called on each of its checks. From a change, it says once that it's switching, naming
// the ship busy() gives (its id or null), and while that runs speck run carries on as usual: it starts no other ship,
// as only one runs at a time, but may start builds. Once no ship is running it hands over, giving the new code the
// builds running (running()), which carry on. True from then until it has switched or the switch has failed, and
// speck run starts nothing meanwhile. handOver() is called as it hands over and stayed() if the new code can't start.
// A `worker` (on new code) asks the process you started to switch; that process itself starts its successor, stops
// its loop and becomes its host. If the new code can't start, it says why once and carries on, until the next change.
export function codeSwitch({ worker, code, busy, launched, running, stopLoop, handOver = () => {}, stayed = () => {} }) {
  const watch = codeWatch(code);
  let waiting = false, handing = false, stay = null;
  if (worker) process.on('message', m => { if (m?.type === 'stay') stay?.(m.reason); });
  return () => {
    const next = watch.changed();
    if (!next) { waiting = false; return false; }
    if (handing) return true;
    const ship = busy();
    if (!waiting) console.log(waitingSays(ship));
    waiting = true;
    if (ship) return false;
    handing = true;
    handOver();
    const failed = reason => { handing = waiting = false; watch.failed(next); console.log(failedSays(reason)); stayed(); };
    const given = { launched: launched(), running: running() };
    if (worker) { stay = failed; process.send({ type: 'switch', code: next, ...given }); }
    else startSuccessor(next, given, { ready: child => { stopLoop(); hostRuns(child, ['SIGINT', 'SIGTERM']); }, failed });
    return true;
  };
}

// speck run on new code, once it has checked its settings: runs prepare(), which launches nothing, then says it's
// ready, or why it failed, and on 'go' starts watching (start). It exits on 'exit' (the one replacing it is ready),
// and stops if the process you started has gone.
export function awaitGo(prepare, start, stop) {
  try { prepare(); } catch (e) { process.send({ type: 'failed', reason: whyFailed(e) }, () => process.exit(1)); return; }
  process.on('disconnect', stop);
  process.on('message', m => {
    if (m === 'go') { console.log('speck run switched to the new code.'); start(); }
    else if (m === 'exit') process.exit(0);
  });
  process.send('ready');
}

// The process you started, once it has handed over to `worker`: it starts the worker, passes Ctrl+C and the panel's
// off switch on to it, starts its successor when it asks to switch, and exits as the last one does.
export function hostRuns(worker, stopSignals) {
  let starting = null, stopping = false;
  for (const s of stopSignals) {
    process.removeAllListeners(s);
    process.on(s, () => { stopping = true; starting?.kill('SIGKILL'); try { worker.kill(s); } catch { /* gone */ } });
  }
  const watch = w => {
    w.on('exit', (code, signal) => { starting?.kill('SIGKILL'); process.exit(code ?? (signal ? 0 : 1)); });
    w.on('message', m => {
      if (m?.type !== 'switch' || starting || stopping) return;
      const list = v => (Array.isArray(v) ? v : []);
      starting = startSuccessor(m.code, { launched: list(m.launched), running: list(m.running) }, {
        // The old one exits before the new one starts watching, so only one is ever watching.
        ready: next => {
          starting = null;
          w.removeAllListeners('exit');
          w.once('exit', code => { if (stopping) { next.kill('SIGKILL'); process.exit(code ?? 0); } worker = next; watch(next); next.send('go'); });
          w.send('exit');
        },
        failed: reason => { starting = null; if (!stopping) w.send({ type: 'stay', reason }); },
      });
    });
  };
  watch(worker);
  worker.send('go');
}

// 0771: speck serve switches to new code by itself. The process you start serves as it always has, and watches the code
// it runs from, every .mjs file beside this one. Once a change has settled and nothing is starting or stopping, it
// starts a worker process on the new code, handing it the socket it answers on and what it looks after. Both answer on
// that socket until the new one is ready: then the old one stops taking connections, gives the answers it's giving and
// leaves the panels it started running for the new one to look after. A new one that can't start is stopped, and the old
// one says why and carries on, until the next change. The process you start keeps speck serve's record throughout, so
// its pid never changes: from its first switch on it only hosts the worker serving (hostWorkers), which asks it for the
// next worker when its own code changes, and steps down and exits once that one is ready.
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { codeHash, codeStamp } from './run-switch.mjs';

const CODE_URL = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs')).href;
const SETTLE_MS = 1000, READY_MS = 10000;
export const STOP_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'];
// How long a worker on new code has to be ready, in ms. SPECK_SERVE_SWITCH_MS sets it, for speck's own tests.
const readyMs = () => (Number(process.env.SPECK_SERVE_SWITCH_MS) > 0 ? Number(process.env.SPECK_SERVE_SWITCH_MS) : READY_MS);

// What a worker on older code handed over, read with care, as it comes from another version of speck: lists of
// [key, value] pairs and of strings, the record's own facts and a project's next try at starting its panel.
export const pairsOf = v => (Array.isArray(v) ? v.filter(e => Array.isArray(e) && e.length === 2 && typeof e[0] === 'string') : []);
export const stringsOf = v => (Array.isArray(v) ? v.filter(s => typeof s === 'string') : []);
export const retryOf = r => ({ fails: Number.isInteger(r?.fails) && r.fails >= 0 ? r.fails : 0, at: Number.isFinite(r?.at) ? r.at : 0,
  port: Number.isInteger(r?.port) && r.port > 0 && r.port < 65536 ? r.port : null, said: typeof r?.said === 'string' ? r.said : null });
export const carriedRecord = (r, host) => ({ pid: host, started: typeof r?.started === 'string' ? r.started : new Date().toISOString(),
  log: typeof r?.log === 'string' ? r.log : null, ready: r?.ready === true, panels: [] });

// In a worker: a message to the host, which `done` hears the end of; one it can't take is passed to `done` as an error.
export function toHost(message, handle = null, done = () => {}) {
  try { if (handle) process.send(message, handle, done); else process.send(message, done); } catch (e) { done(e); }
}

// Watches the code speck serve runs from. next() gives the hash of the code to switch to once a change has settled, its
// files unchanged for SETTLE_MS, or null: no change, the code it runs (`running`), or code that has failed to start
// (failed(hash)). The first look always compares, in case the code changed as it was starting.
export function codeWatch(running, settleMs = SETTLE_MS) {
  let stamp = null, since = 0, pending = null, failed = null;
  return {
    next() {
      const now = codeStamp();
      if (now !== stamp) { stamp = now; since = Date.now(); pending = null; return null; }
      if (since && Date.now() - since >= settleMs) { since = 0; const h = codeHash(); pending = h !== running && h !== failed ? h : null; }
      return pending;
    },
    failed(hash) { failed = hash; pending = null; },
  };
}

// What a worker runs: serveWorker() from speck.mjs, as the code is when it starts. Code that can't be loaded is
// reported to the host in one line, and the worker exits.
const LOADER = `try { const m = await import(process.env.SPECK_SERVE_CODE_URL); await m.serveWorker(); }
catch (e) { const why = (e && e.name === 'SpeckError' ? '' : (e && e.name || 'Error') + ': ') + String(e && e.message || e).split('\\n')[0];
  process.send({ type: 'failed', why }, () => process.exit(1)); }`;

// Starts a worker on the code as it is now. It says 'hello' once it has loaded, and is then told what to do.
function startWorker() {
  const w = spawn(process.execPath, ['--input-type=module', '-e', LOADER], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    env: { ...process.env, SPECK_SERVE_CODE_URL: CODE_URL, SPECK_SERVE_HOST: String(process.pid) } });
  w.on('error', () => {}); // each is handled where it matters: a send to a worker that has gone, or one that couldn't start
  return w;
}
// A message to a worker, unless it has gone.
const tell = (w, message, handle) => { try { (handle ? w.send(message, handle, () => {}) : w.send(message, () => {})); } catch { /* gone */ } };

// Starts a worker on the code as it is now, to take over with what `m` gives (running, the hash of that code, and state,
// what the one it replaces looks after) and `handle`, the socket that one answers on. Calls ready(w) once it's ready,
// or failed(why) once it has failed, having stopped it. `own`: the handle is this process's own socket, which stays
// open; otherwise it's a copy a worker handed over, closed here once it's handed on. Returns the worker, which can be
// stopped meanwhile.
export function startSuccessor(m, handle, { ready, failed, own = false }) {
  const w = startWorker();
  let settled = false;
  const settle = () => { settled = true; clearTimeout(timer); if (!own) try { handle.close(); } catch { /* closed */ } };
  const fail = why => { if (settled) return; settle(); w.kill('SIGKILL'); failed(why); };
  const onError = e => fail(`it couldn't be started (${e.code || e.message})`);
  const onExit = (code, signal) => fail(`it stopped (${signal ? `by ${signal}` : `exit code ${code}`}) before it was ready`);
  const onMessage = msg => {
    if (settled) return;
    if (msg === 'hello') return tell(w, { type: 'take', running: m.running, state: m.state }, handle);
    if (msg?.type === 'failed') return fail(msg.why);
    if (msg !== 'ready') return;
    settle();
    w.off('error', onError); w.off('exit', onExit); w.off('message', onMessage);
    ready(w);
  };
  const timer = setTimeout(() => fail(`it wasn't ready within ${readyMs() / 1000} seconds`), readyMs());
  w.on('error', onError);
  w.on('exit', onExit);
  w.on('message', onMessage);
  return w;
}

// The process you started, from its first switch on, once `first`, a worker on the new code, is ready to serve in its
// place: it tells it to go, passes the stop signals on to the worker serving, starts a worker on new code when that one
// asks, handing it the socket that one answers on, and ends as it does, with its exit code. The one it replaces is told
// to exit once the new one is ready, or to stay, with why, if it isn't.
export function hostWorkers(first) {
  let current = null, starting = null, stopping = false;
  for (const sig of STOP_SIGNALS) {
    process.removeAllListeners(sig);
    process.on(sig, () => { stopping = true; starting?.kill('SIGKILL'); try { current.kill(sig); } catch { /* gone */ } });
  }
  const serving = w => {
    current = w;
    w.on('exit', code => { if (w !== current) return; starting?.kill('SIGKILL'); process.exit(code ?? 1); });
    w.on('message', (m, handle) => {
      if (w !== current || m?.type !== 'switch') return;
      const stay = why => { try { handle?.close(); } catch { /* closed */ } tell(w, { type: 'stay', why }); };
      if (stopping) return stay('speck serve is stopping');
      if (starting || !handle) return stay(starting ? 'another switch is under way' : 'the socket it answers on wasn\'t handed over');
      starting = startSuccessor(m, handle, {
        // The old one is stopping its panels when speck serve is, so the new one mustn't take them over then.
        ready: next => { starting = null; if (stopping) return void next.kill('SIGKILL'); serving(next); tell(w, 'exit'); tell(next, 'go'); },
        failed: why => { starting = null; if (!stopping) tell(w, { type: 'stay', why }); },
      });
    });
  };
  serving(first);
  tell(first, 'go');
}

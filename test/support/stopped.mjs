// 0173: a process that has just been stopped can take a moment to exit, longer on a busy machine. Tests that check a
// stopped process has gone poll for up to STOP_MS rather than checking once, and still fail if it hasn't gone by then.
import { request } from './panel.mjs';

export const STOP_MS = 10000;

// Polls `check` every 50 ms until it's true. Resolves true, or false once `ms` have passed, even if a check that is
// still running would have said true later.
export async function hasStopped(check, ms = STOP_MS) {
  const end = Date.now() + ms;
  for (;;) {
    let timer;
    const timeUp = new Promise(r => { timer = setTimeout(() => r(false), Math.max(0, end - Date.now())); });
    const ok = await Promise.race([Promise.resolve().then(check), timeUp]).finally(() => clearTimeout(timer));
    if (ok && Date.now() <= end) return true;
    if (Date.now() >= end) return false;
    await new Promise(r => setTimeout(r, 50));
  }
}

// True once connections to `port` are refused. A server that accepts a connection but doesn't answer is still running.
export const portClosed = port => async () => {
  try { await request(port, { timeout: 1000 }); return false; } catch (e) { return e.code === 'ECONNREFUSED'; }
};

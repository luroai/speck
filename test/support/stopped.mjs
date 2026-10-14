// 0173: a process that has just been stopped can take a moment to exit, longer on a busy machine. Tests that check a
// stopped process has gone poll for up to STOP_MS rather than checking once, and still fail if it hasn't gone by then.
export const STOP_MS = 10000;

// Polls `check` every 50 ms until it's true. Resolves true, or false once `ms` have passed.
export async function hasStopped(check, ms = STOP_MS) {
  const end = Date.now() + ms;
  for (;;) {
    if (await check()) return true;
    if (Date.now() >= end) return false;
    await new Promise(r => setTimeout(r, 50));
  }
}


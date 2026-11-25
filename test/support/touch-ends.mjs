// 0738: a busy machine can starve a real browser's page so long that Chromium drops the rest of a touch: its last
// moves and its touchend never reach the page, which is left with a finger it thinks is still down. That's the browser
// giving up on the page, not the panel getting a swipe wrong, so a test that swipes checks the page got each gesture's
// end and, when it didn't, does the gesture again.

// Counts every touchend the page gets, in window.touchEnds, on this page and on every page loaded in it after.
export const COUNT_ENDS = `(() => { if (window.touchEnds !== undefined) return 1; window.touchEnds = 0;
  document.addEventListener('touchend', () => { window.touchEnds++; }, { capture: true, passive: true }); return 1; })()`;
export async function countEnds(b) {
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: COUNT_ENDS });
  await b.js(COUNT_ENDS);
}

// 0754: the page has caught up once it has drawn two frames, waited for in the page itself: everything sent to it
// before has been handled by then.
export const CAUGHT_UP = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1))))';
const sleep = ms => new Promise(r => setTimeout(r, ms));
// For delivered()'s `ready`, 0754: a busy page that is still behind with the gesture before is the one whose next
// gesture Chromium drops, so each try waits for the page to catch up first, giving it up to 30 s, and a retry waits a
// second longer each time before that (1 s before the 2nd try, 2 s before the 3rd).
export async function steady(b, n, { pause = sleep } = {}) {
  if (n > 1) await pause(1000 * (n - 1));
  await b.js(CAUGHT_UP, 30000);
}

// Runs `gesture`, which ends with the finger lifting, then waits up to `ms` for the page to get its touchend. When it
// doesn't, the browser dropped it, so the gesture runs again, up to `tries` times in all, and then fails saying so.
// `ready(b, n)` runs before the nth try (0754: steady() above).
export async function delivered(b, gesture, { ms = 10000, tries = 3, ready = async () => {} } = {}) {
  for (let n = 1; ; n++) {
    await ready(b, n);
    const before = await b.js('window.touchEnds || 0');
    await gesture();
    try {
      await b.until(`(window.touchEnds || 0) > ${before}`, 'the touch to end on the page', ms);
      return n;
    } catch (e) {
      if (n >= tries) throw new Error(`the browser dropped the end of the touch ${tries} times in a row, so the page never saw the finger lift`);
    }
  }
}

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

// Runs `gesture`, which ends with the finger lifting, then waits up to `ms` for the page to get its touchend. When it
// doesn't, the browser dropped it, so the gesture runs again, up to `tries` times in all, and then fails saying so.
export async function delivered(b, gesture, { ms = 10000, tries = 3 } = {}) {
  for (let n = 1; ; n++) {
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

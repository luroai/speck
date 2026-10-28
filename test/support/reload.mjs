// 0542: reloads a real browser's page from browserPage() and waits, up to `ms`, until `ready` holds on the reloaded
// page. The page is marked first, so the page from before the reload never counts. It reloads through DevTools rather
// than the page's own script, whose answer can be lost as the page goes, and a check made while the page is changing
// over, which can fail with "Inspected target navigated or closed" or a lost context, is made again.
import { UNTIL_MS } from './panel.mjs';

const CHANGING = /Inspected target navigated or closed|Execution context was destroyed|Cannot find (default )?(execution )?context/i;
const MARK = '__speckBeforeReload';
export async function reload(b, ready, what, ms = UNTIL_MS) {
  await b.js(`window.${MARK} = true`);
  await b.send('Page.reload', {});
  const end = Date.now() + ms;
  let last = null;
  for (;;) {
    try {
      if (await b.js(`!window.${MARK} && document.readyState === 'complete' && !!(${ready})`)) return;
      last = null;
    } catch (e) {
      if (!CHANGING.test(e.message)) throw e;
      last = e;
    }
    if (Date.now() >= end) throw new Error(`timed out waiting for ${what}${last ? ` (last: ${last.message})` : ''}`);
    await new Promise(r => setTimeout(r, 100));
  }
}

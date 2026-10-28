import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reload } from './support/reload.mjs';

// ---------- 0542: a real browser's page reloaded, waited for with a time limit ----------

// A stand-in for browserPage(): `answers` is what each js() call after the reload does in turn, a value or an error to
// throw, and the last one repeats.
function fakeBrowser(answers) {
  const calls = [];
  let i = 0;
  return {
    calls,
    send: async (method, params) => { calls.push(['send', method, params]); return {}; },
    js: async expr => {
      calls.push(['js', expr]);
      if (/= true/.test(expr)) return true; // marking the page before the reload
      const a = answers[Math.min(i++, answers.length - 1)];
      if (a instanceof Error) throw a;
      return a;
    },
  };
}

test('0542 AC1: reload() marks the page, reloads it through DevTools and waits for the reloaded page, not the one before, to be ready', async () => {
  const b = fakeBrowser([false, false, true]);
  await reload(b, `!!document.querySelector('#run canvas')`, 'the panel', 10000);
  assert.deepEqual(b.calls.filter(c => c[0] === 'send').map(c => c[1]), ['Page.reload'], 'reloaded with Page.reload, not from the page\'s own script');
  const [mark, ...waits] = b.calls.filter(c => c[0] === 'js').map(c => c[1]);
  const flag = mark.match(/window\.(\w+) = true/)[1];
  assert.ok(b.calls.indexOf(b.calls.find(c => c[1] === mark)) < b.calls.findIndex(c => c[1] === 'Page.reload'), 'the page is marked before it reloads');
  assert.equal(waits.length, 3, 'it asks until the page is ready');
  for (const w of waits) {
    assert.match(w, new RegExp(`!window\\.${flag}`), 'only the reloaded page, which has no mark, counts');
    assert.match(w, /document\.readyState === 'complete'/, 'once it has loaded');
    assert.ok(w.includes(`!!document.querySelector('#run canvas')`), 'and the caller\'s own check holds');
  }
});

test('0542 AC1: reload() rides out the errors a page gives while it is changing over to the reloaded one', async () => {
  const b = fakeBrowser([
    new Error('Runtime.evaluate: Inspected target navigated or closed'),
    new Error('Runtime.evaluate: Execution context was destroyed.'),
    new Error('Runtime.evaluate: Cannot find default execution context'),
    true,
  ]);
  await reload(b, 'true', 'the panel', 10000);
  assert.equal(b.calls.filter(c => c[0] === 'js').length, 5);
});

test('0542 AC1: reload() gives up after its time limit with a plain error naming what it waited for, and passes on any other error', async () => {
  const started = Date.now();
  await assert.rejects(reload(fakeBrowser([new Error('Runtime.evaluate: Inspected target navigated or closed')]), 'true', 'dark after a reload', 300),
    /timed out waiting for dark after a reload \(last: Runtime\.evaluate: Inspected target navigated or closed\)/);
  assert.ok(Date.now() - started < 5000, 'within its time limit, not the 10 s browserPage() waits by default');
  await assert.rejects(reload(fakeBrowser([false]), 'true', 'the panel', 300), /^Error: timed out waiting for the panel$/);
  await assert.rejects(reload(fakeBrowser([new Error('x: ReferenceError: nope is not defined')]), 'nope', 'the panel', 10000), /ReferenceError: nope is not defined/);
});

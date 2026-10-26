import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { rules, get, selectors } from './support/css.mjs';
import { screenPage, foreman, state } from './support/screen.mjs';

// ---------- 0513: the dot by speck's name is grey while Auto-build is off ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const OFF = '.bezel[data-run="off"] .name::before';
const decl = (sel, prop) => rules().filter(r => !r.at.length && selectors(r).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();
// Every rule, in any at-rule, that styles the dot before speck's name.
const dotRules = () => rules().filter(r => selectors(r).some(s => /\.name::before$/.test(s) && s.startsWith('.bezel')));

test('0513 AC1: the frame says whether speck run is off, from the screen\'s word', async () => {
  for (const [word, run] of [['Off', 'off'], ['Idle', 'on'], ['Building 2', 'on'], ['Needs you 1', 'on'], ['Waiting for review', 'on'], ['Shipping 0401', 'on']]) {
    const p = screenPage([state(foreman({ word }))]);
    await p.settle();
    assert.equal(p.byId('bezel').attrs['data-run'], run, word);
  }
});

test('0513 AC1: while it\'s off the dot is in the frame\'s muted colour, and red otherwise, in both looks', () => {
  assert.equal(decl(OFF, 'background'), 'var(--bezel-muted)');
  assert.equal(decl('.bezel .name::before', 'background'), 'var(--lcd-red)', 'red as today');
  // nothing else colours the dot, in a look of its own or otherwise
  for (const r of dotRules()) {
    assert.deepEqual(r.at, [], `${r.sel} is in no at-rule`);
    assert.ok([OFF, '.bezel .name::before'].includes(r.sel), `no other rule for the dot: ${r.sel}`);
  }
});

test('0513 AC3: the dot\'s size and place and the needs-you edge are as they were', async () => {
  const off = rules().find(r => r.sel === OFF);
  assert.deepEqual(off.decls.map(([k]) => k), ['background'], 'the off rule only changes its colour');
  const dot = decl('.bezel .name::before', 'width');
  assert.equal(dot, '.375em');
  assert.equal(decl('.bezel .name::before', 'height'), '.375em');
  for (const [word, cls] of [['Off', 'bezel'], ['Needs you 1', 'bezel needs'], ['Idle', 'bezel']]) {
    const p = screenPage([state(foreman({ word }))]);
    await p.settle();
    assert.equal(p.byId('bezel').className, cls, word);
  }
});

test('0513 AC2: in a real browser the dot turns grey and red again as Auto-build goes off and on, without a reload, in both looks', skip, async () => {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    const on = { tickets: [T('5000', 'ready')], ideas: [], run: { on: true, pid: 1 }, foreman: foreman({ word: 'Idle', tone: 'idle' }) };
    const off = { ...on, run: { on: false }, foreman: foreman({ word: 'Off', tone: 'off' }) };
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      window.__state = ${JSON.stringify(on)}; const real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(window.__state), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
      // the panel's stream, as in 0479: __refresh() is one refresh, the board's next version
      let n = 0;
      window.EventSource = class { constructor() { this.l = {}; this.readyState = 1; window.__refresh = () => this.l.message && this.l.message({ data: String(++n) }); setTimeout(window.__refresh, 10); } addEventListener(t, f) { this.l[t] = f; } close() {} };
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === 1`, 'the panel');
    const dot = `getComputedStyle(document.querySelector('.bezel .name'), '::before').backgroundColor`;
    const colour = v => `(() => { const s = document.createElement('i'); s.style.background = 'var(${v})'; document.querySelector('.bezel').append(s); const c = getComputedStyle(s).backgroundColor; s.remove(); return c; })()`;
    await b.js('(window.__same = true)'); // gone if the page reloads
    for (const look of ['light', 'dark']) {
      await b.js(`(document.documentElement.setAttribute('data-theme', '${look}'), true)`);
      const red = await b.js(colour('--lcd-red')), grey = await b.js(colour('--bezel-muted'));
      assert.notEqual(red, grey);
      await b.js(`(window.__state = ${JSON.stringify(on)}, window.__refresh(), true)`);
      await b.until(`${dot} === ${JSON.stringify(red)}`, `the dot red while on, ${look}`);
      await b.js(`(window.__state = ${JSON.stringify(off)}, window.__refresh(), true)`);
      await b.until(`${dot} === ${JSON.stringify(grey)}`, `the dot grey once off, ${look}`);
      await b.js(`(window.__state = ${JSON.stringify(on)}, window.__refresh(), true)`);
      await b.until(`${dot} === ${JSON.stringify(red)}`, `the dot red again once on, ${look}`);
    }
    assert.equal(await b.js('window.__same === true'), true, 'no reload');
  } finally { await b.close(); }
});

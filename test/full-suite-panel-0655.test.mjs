// 0655: a failing full suite on the base branch is a row of its own under Build's Needs you, which opens a view of it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { T, boardPage, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { fullSuiteQueue, fullDir } from '../scripts/full-suite.mjs';
import { foremanView } from '../scripts/foreman.mjs';
import { loadConfig } from '../scripts/core.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const COMMIT = 'abcdef1234567890abcdef1234567890abcdef12';
const AT = '2026-11-11T09:30:00.000Z';
const FULL = { base: 'main', commit: COMMIT, status: 1, tests: ['test/widgets.test.mjs', 'test/gadgets.test.mjs'], at: AT, log: 'speck/.cache/full/run.log' };
const board = (full, tickets = []) => ({ run: { on: true }, ideas: [], tickets, foreman: { word: 'Needs you 1', tone: 'bad', base: 'main', ...(full ? { full } : {}) } });
const show = async (...boards) => { const p = boardPage(boards, { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const fullRow = p => p.byId('queue').children.find(n => /\bfull-suite-row\b/.test(n.className || '')) || null;
const listed = p => p.byId('queue').children.map(n => (/\bfull-suite-row\b/.test(n.className || '') ? 'full' : /\bq\b/.test(n.className || '') ? p.all(n).find(c => c.className === 'id')._text : n.textContent));
const find = (p, n, re) => p.all(n).find(c => re.test(c.className || '')) || null;

// ---------- AC1: a row under Needs you ----------

test('0655 AC1: a failing full suite is a row under Build\'s Needs you, with the orange dot, the commit\'s short id and how many tests fail', async () => {
  const p = await show(board(FULL, [T('0701', 'ready')]));
  assert.deepEqual(listed(p), ['Needs you 1', 'full', 'Queued 1', '0701']);
  const row = fullRow(p), where = find(p, row, /^where\b/);
  assert.match(find(p, row, /^title$/).textContent, /^Full suite fails on main$/);
  assert.match(where.className, /\bneeds\b/, 'the orange dot');
  assert.equal(where.textContent, 'abcdef1 · 2 tests fail');
});

test('0655 AC1: it counts with blocked tickets under Needs you, and says one failing test, or the exit code when the output names none', async () => {
  const p = await show(board({ ...FULL, tests: ['test/one.test.mjs'] }, [T('0702', 'blocked', { blocked_question: 'Which?' })]));
  assert.deepEqual(listed(p), ['Needs you 2', 'full', '0702']);
  assert.equal(find(p, fullRow(p), /^where\b/).textContent, 'abcdef1 · 1 test fails');
  const none = await show(board({ ...FULL, status: 3, tests: [] }));
  assert.deepEqual(listed(none), ['Needs you 1', 'full'], 'with no tickets at all, the row, not the empty lane');
  assert.equal(find(none, fullRow(none), /^where\b/).textContent, 'abcdef1 · exit code 3');
});

test('0655 AC1: foremanView gives the failing run with when it ran and where its log is, counted under Needs you', () => {
  const v = foremanView({ run: { on: true, pid: 7 }, record: { lock: 7, full: { ...FULL } }, tickets: [] });
  assert.equal(v.word, 'Needs you 1');
  assert.deepEqual(v.full, FULL);
});

function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0655-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } }).stdout.trim();
  g('init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\ncommands:\n  test: "true"\n  test_full: "exit 1"\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  return { dir, head: g('rev-parse', 'HEAD') };
}

test('0655 AC1 AC2: speck run\'s record of a failing full run says when it ran and where its log is', () => {
  const r = repo();
  fs.writeFileSync(path.join(fullDir(r.dir), 'latest.json'), JSON.stringify({ cmd: 'exit 1', commit: r.head, status: 1, tests: ['test/a.test.mjs'], at: AT }));
  const q = fullSuiteQueue({ repo: r.dir, readConfig: () => loadConfig(r.dir), say: () => {}, launch: () => null });
  q.check();
  assert.deepEqual(q.view().full, { base: 'main', commit: r.head, status: 1, tests: ['test/a.test.mjs'], at: AT, log: path.join('speck', '.cache', 'full', 'run.log') });
});

// ---------- AC2: its view ----------

const press = async (p, n) => { n.listeners.click({ stopPropagation() {} }); await p.settle(); };

test('0655 AC2: pressing the row opens a view naming each failing test, the commit, when it ran and where its log is, with a back link', async () => {
  const p = await show(board(FULL));
  const box = p.byId('full-suite');
  assert.equal(box.hidden, true);
  await press(p, fullRow(p).children[0]);
  assert.equal(box.hidden, false);
  const text = box.textContent;
  for (const t of FULL.tests) assert.ok(text.includes(t), `names ${t}`);
  assert.ok(text.includes('abcdef1'), 'the commit');
  assert.ok(p.all(box).some(n => n.title === COMMIT), 'the whole commit in its tooltip');
  assert.ok(p.all(box).some(n => n.title === AT), 'when it ran');
  assert.ok(text.includes('speck/.cache/full/run.log'), 'where its log is');
  const back = find(p, box, /^close$/);
  assert.equal(back.attrs['aria-label'], 'Back to Build');
  await press(p, back);
  assert.equal(box.hidden, true, 'the back link closes it');
});

test('0655 AC2: with output that names no failing tests, the view says so and gives the exit code; Escape closes it', async () => {
  const p = await show(board({ ...FULL, status: 3, tests: [] }));
  await press(p, fullRow(p).children[0]);
  const box = p.byId('full-suite');
  assert.match(box.textContent, /names no failing tests: it ended with exit code 3/);
  p.key('Escape');
  await p.settle();
  assert.equal(box.hidden, true);
});

// ---------- AC3: it goes once a newer run passes ----------

test('0655 AC3: once the full run no longer fails, the row goes with the count, and an open view closes', async () => {
  const p = await show(board(FULL, [T('0701', 'ready')]), { ...board(null, [T('0701', 'ready')]), foreman: { word: 'Idle', tone: 'idle' } });
  assert.deepEqual(listed(p), ['Needs you 1', 'full', 'Queued 1', '0701']);
  await press(p, fullRow(p).children[0]);
  assert.equal(p.byId('full-suite').hidden, false);
  p.timers.shift()(); // the board's next change: a full run on a newer commit passed
  await p.settle();
  assert.deepEqual(listed(p), ['Queued 1', '0701']);
  assert.equal(p.byId('full-suite').hidden, true);
});

test('0655 AC3: foremanView leaves it out, and out of the count, once speck run\'s record has no failing run', () => {
  const v = foremanView({ run: { on: true, pid: 7 }, record: { lock: 7 }, tickets: [] });
  assert.equal(v.full, undefined);
  assert.doesNotMatch(v.word, /Needs you/);
});

// ---------- AC4: it fits a phone ----------

const STATE = { run: { on: true }, ideas: [], tickets: [T('0701', 'ready', { title: 'A ready ticket' })],
  foreman: { word: 'Needs you 1', tone: 'bad', base: 'main', full: { ...FULL, tests: ['test/a-very-long-test-file-name-that-goes-on-and-on-past-a-phone-s-width.test.mjs', ...FULL.tests] } } };
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(${JSON.stringify(STATE)});
    if (u.startsWith('/api/run-log')) return json({ lines: [] });
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;

for (const theme of ['light', 'dark']) {
  test(`0655 AC4: in the ${theme} look at 320 px, the row and its view fit the panel's width`, skip, async () => {
    const panel = await sharedPanel();
    const b = await browserPage('about:blank');
    try {
      await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 2, mobile: true });
      await b.send('Page.enable');
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelector('#queue .full-suite-row') && document.fonts.status === 'loaded'`, 'the panel');
      assert.equal(await b.js('document.documentElement.dataset.theme'), theme);
      await b.js(`document.getElementById('tab-build').click(); true`);
      await b.until(`(() => { const r = document.querySelector('#queue .full-suite-row').getBoundingClientRect(); return r.left >= 0 && r.right <= 320 && r.width > 0; })()`, 'the Build lane at rest');
      const row = await b.js(`(() => { const r = document.querySelector('#queue .full-suite-row'), b = r.getBoundingClientRect(), dot = getComputedStyle(r.querySelector('.where'), '::before');
        return { left: b.left, right: b.right, height: b.height, dot: dot.backgroundColor, needs: (() => { const p = document.createElement('i'); p.style.color = 'var(--needs-you)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })(),
          wide: document.documentElement.scrollWidth }; })()`);
      assert.deepEqual([row.left, row.right], [16, 304], 'inside the lane\'s margins');
      assert.ok(row.height < 60, `one row high: ${row.height}`);
      assert.equal(row.dot, row.needs, 'the orange dot');
      assert.ok(row.wide <= 320, 'the page doesn\'t scroll sideways');
      await b.js(`document.querySelector('#queue .full-suite-row .top').click(); true`);
      await b.until(`!document.getElementById('full-suite').hidden && document.querySelectorAll('#full-suite li').length === 3`, 'the view');
      const view = await b.js(`(() => { const v = document.getElementById('full-suite'), over = [...v.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > 320.5 || n.getBoundingClientRect().left < -0.5).length;
        const c = getComputedStyle(v); return { over, scroll: v.scrollWidth, client: v.clientWidth, bg: c.backgroundColor, text: getComputedStyle(v.querySelector('li')).color }; })()`);
      assert.equal(view.over, 0, 'nothing in the view past the panel\'s edges');
      assert.ok(view.scroll <= view.client, 'it doesn\'t scroll sideways');
      assert.notEqual(view.bg, view.text, 'its words show on its background');
      await b.js(`document.querySelector('#full-suite .top .close').click(); true`);
      await b.until(`document.getElementById('full-suite').hidden`, 'the back link');
    } finally { await b.close(); }
  });
}

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, switchPage, exitOf, round, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0163: the running build in the Auto-build button ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const ON = 'Pause Auto-build: ready tickets wait';
const OFF = 'Start Auto-build: build ready tickets'; // 0199: no longer one at a time
const RUN = { on: true, pid: 7 };
// A ticket in each state the button can name.
const BUILDING = T('0151', 'building', { started: ago(65), build_running: true, reviewer: 'codex' });
const CHECKING = T('0152', 'building', { started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' });
const REVIEWING = T('0153', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
  rounds: [{ ...round(2, 10), verdict: 'request_changes' }] });
const PAUSED = T('0154', 'reviewing', { started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' });
const SHIPPING = T('0155', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ship: { running: true, started: ago(5) } });
const TO_SHIP = T('0156', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...exitOf('Done.') });
const NOT_AUTO = T('0157', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], build_running: true, auto_ship: false });
const BLOCKED = T('0158', 'blocked', { started: ago(300), blocked_question: 'A or B?' });
const STOPPED = T('0159', 'building', { started: ago(200), ...exitOf('It ended.') });
const AUTO = T('0160', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], build_running: true });
const READY = T('0161', 'ready');

const state = (tickets, run = RUN) => ({ tickets, ideas: [], resume_command: '', ...(run ? { run } : {}) });
// 0285: the Auto-build switch is in Settings now (runSwitch), and the header button shows the Foreman, with the builder.
const runOf = p => p.runSwitch();
const headerOf = p => p.byId('run');
const parts = p => headerOf(p).children;
const badgeIn = p => p.all(headerOf(p)).find(n => n.tagName === 'canvas');
const labelIn = p => p.all(headerOf(p)).find(n => n.className === 'board-text'); // 0365: the notice board's whole text
const shows = async (tickets, run = RUN) => { const p = switchPage([state(tickets, run)]); await p.settle(); return p; };

test('0163 AC1: while Auto-build is on and a ticket is building, reviewing or shipping, the button reads "Auto-build on" (0199)', async () => {
  for (const t of [BUILDING, CHECKING, REVIEWING, PAUSED, SHIPPING]) {
    const p = await shows([READY, t]);
    assert.equal(runOf(p).textContent, 'Auto-build on', t.id);
    assert.equal(labelIn(p).textContent, 'Idle', `${t.id}: the header's own label, which can be shortened, is the Foreman's (0285)`);
    assert.match(runOf(p).className, /\brun-on\b/);
    assert.doesNotMatch(runOf(p).className, /\brun-(bad|wait)\b/, `${t.id}: in the button's usual colour`);
  }
});

test('0163 AC1: the Build card still names the stage, and the button doesn\'t (0199)', async () => {
  const js = page().match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(js, /function runLabel\(/);
  const p = await shows([REVIEWING]);
  const card = p.all(p.byId('queue')).find(n => /^stage\b/.test(n.className || ''));
  assert.equal(card.textContent, 'Review 2', 'the card counts the round');
  assert.equal(runOf(p).textContent, 'Auto-build on');
});

test('0163 AC1: with more than one in flight, it names none of them (0199)', async () => {
  assert.equal(runOf(await shows([READY, CHECKING, BUILDING])).textContent, 'Auto-build on');
  assert.equal(runOf(await shows([BLOCKED, BUILDING])).textContent, 'Auto-build on');
  assert.equal(runOf(await shows([AUTO, BUILDING])).textContent, 'Auto-build on');
});

test('0163 AC2: on with nothing in flight it reads "Auto-build on"; off, "Auto-build off", whatever is building', async () => {
  for (const tickets of [[], [READY], [AUTO]]) {
    const p = await shows(tickets);
    assert.equal(runOf(p).textContent, 'Auto-build on');
    assert.equal(runOf(p).title, ON);
  }
  for (const tickets of [[], [BUILDING], [BLOCKED], [TO_SHIP]]) {
    const p = await shows(tickets, null);
    assert.equal(runOf(p).textContent, 'Auto-build off');
    assert.equal(runOf(p).title, OFF);
    assert.match(runOf(p).className, /\brun-off\b/);
    assert.doesNotMatch(runOf(p).className, /\brun-(bad|wait)\b/);
  }
});

test('0163 AC2: when a build waits for you it still reads "Auto-build on", in the button\'s usual colour (0199)', async () => {
  for (const t of [TO_SHIP, NOT_AUTO, BLOCKED, STOPPED]) {
    const p = await shows([t]);
    assert.equal(runOf(p).textContent, 'Auto-build on', t.id);
    assert.doesNotMatch(runOf(p).className, /\brun-(bad|wait)\b/, t.id);
  }
  assert.doesNotMatch(page(), /\.run-state\.run-(wait|bad)\b/);
});

// 0364: the builder has gone from the button too, so its label alone is in it, at work or not.
test('0163 AC3: no square and no builder: the label alone, whether a build is running or not', async () => {
  const cases = [[[BUILDING], RUN, 'hop'], [[REVIEWING], RUN, 'hop'], [[SHIPPING], RUN, 'hop'], [[PAUSED], RUN, 'still'], [[BLOCKED], RUN, 'still'],
    [[TO_SHIP], RUN, 'still'], [[], RUN, 'still'], [[BUILDING], null, 'hop'], [[], null, 'still']]; // 0199: any build at work hops, on or off
  for (const [tickets, run, pose] of cases) {
    const p = await shows(tickets, run);
    assert.equal(p.all(headerOf(p)).filter(n => /\blive\b/.test(n.className || '')).length, 0, 'no square');
    assert.equal(badgeIn(p), undefined, `${tickets.map(t => t.id)} ${run ? 'on' : 'off'} (${pose} before 0364): no builder`);
    assert.match((parts(p)[0].attrs || {}).class, /^board\b/, 'the notice board comes first (0365)');
  }
  assert.doesNotMatch(page(), /\.run-state \.mini \{/, 'no style for a builder in the button');
});

// 0303: the builder is the LCD renderer's mini builder, so the drawing of it is checked in panel-0303.test.mjs.

test('0163 AC4: clicking still starts or pauses Auto-build, and the tooltip says only what a click will do (0199)', async () => {
  const p = switchPage([state([BUILDING]), { ok: true, run: { on: false, pid: null } }, { ok: true, run: { on: true, pid: 9 } }]);
  await p.settle();
  assert.equal(runOf(p).title, ON);
  assert.equal(runOf(p).attrs['aria-pressed'], 'true');
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.equal(runOf(p).textContent, 'Auto-build off');
  assert.equal(runOf(p).title, OFF);
  p.press(runOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(runOf(p).attrs['aria-pressed'], 'true');
  const q = await shows([BLOCKED]);
  assert.equal(q.runSwitch().title, ON);
});

test('0163 AC4: while a click is going through, it says "Pausing…" as today', async () => {
  const answer = new Promise(() => {});
  const p = switchPage([state([BUILDING]), answer]);
  await p.settle();
  p.press(runOf(p));
  await p.settle();
  assert.equal(runOf(p).textContent, 'Pausing…');
  assert.equal(runOf(p).disabled, true);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LONG = T('0151-a-ticket-id-long-enough-to-overflow-the-header', 'building', { started: ago(65), build_running: true, self_check: 'no changes' });
const stub = tickets => `(() => {
  const STATE = ${JSON.stringify(state(tickets))};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;
async function withPanel(tickets, fn, { width = 1280, motion = 'no-preference' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(tickets) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelector('#run .board') && !document.getElementById('run').hidden`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
// 0364: no builder is drawn in the button, while a build runs or not.
test('0163 AC3: in a real browser, the button draws no builder, while a build runs or not', skip, async () => {
  for (const tickets of [[BUILDING], [PAUSED]]) await withPanel(tickets, async b => {
    assert.equal(await b.js(`document.querySelectorAll('#run canvas').length`), 0);
    assert.ok(await b.js(`document.querySelector('#run .board').getBoundingClientRect().width > 0`), 'its notice board shows (0365)');
  });
});

test('0163 AC4: in a real browser at 375 px, the label stays on one line, beside Settings, with a long ticket in flight (0199)', skip, async () => {
  for (const slim of [false, true]) { // 0364: at the top and scrolled down, the header is the same one row
    await withPanel([LONG], async b => {
      if (slim) {
        await b.js(`document.body.style.minHeight = '4000px'; window.scrollTo(0, 600); true`);
        await b.until(`scrollY >= 600`, 'the scroll');
      }
      const g = await b.js(`(() => {
        const r = n => { const b = n.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; }, run = document.getElementById('run'), label = run.querySelector('.board'); // 0365: the notice board
        const logo = r(document.querySelector('.logo .name')), repo = r(document.querySelector('.repo')), settings = r(document.getElementById('settings-open')); // 0372: Settings ends the header
        return { run: r(run), label: r(label), labelFull: label.getBoundingClientRect().width < Number(label.getAttribute('width')) - 0.5, settings, logo, repo, head: document.querySelector('header').scrollWidth, title: run.title };
      })()`);
      const where = slim ? 'scrolled' : 'at the top';
      assert.equal(g.head, 375, `${where}: nothing in the header past the right edge`); // the header only: the Build card's own long id is out of this ticket's scope
      assert.equal(g.labelFull, false, `${where}: the Foreman's word in full on its board (0365)`);
      assert.equal(g.label.height, 18, `${where}: one line of dots high (0365)`);
      assert.ok(g.run.right <= g.settings.left, `${where}: beside Settings`);
      assert.ok(Math.abs(g.run.top - g.settings.top) < 1, `${where}: on Settings's row`);
      assert.ok(g.run.left >= 16 && g.settings.right <= 375 - 16 + .5, `${where}: within the header's padding`);
      assert.ok(g.repo.width > 0 && g.repo.left >= g.logo.right && g.repo.right <= g.run.left, `${where}: the base branch stays between speck and the button, on its row (0373)`);
      assert.equal(g.title, 'What speck run is doing, and what is waiting', `${where}: the tooltip says what pressing it shows (0285: it's the Foreman's status)`);
    }, { width: 375 });
  }
});

test('0163 AC4: in a real browser at 375 px, a normal label is shown in full without moving the project\'s name', skip, async () => {
  let before;
  await withPanel([READY], async b => { before = await b.js(`(() => { const r = document.querySelector('.repo').getBoundingClientRect(); return [r.left, r.width]; })()`); }, { width: 375 });
  await withPanel([CHECKING], async b => {
    const g = await b.js(`(() => { const l = document.querySelector('#run .board'), r = document.querySelector('.repo').getBoundingClientRect(); return { cut: l.getBoundingClientRect().width < Number(l.getAttribute('width')) - 0.5, repo: [r.left, r.width] }; })()`); // 0365: its board
    assert.equal(g.cut, false, '"Auto-build on" fits');
    assert.deepEqual(g.repo, before, 'the project\'s name is where it was');
  }, { width: 375 });
});

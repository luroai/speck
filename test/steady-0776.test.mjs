// 0776: three real-browser tests hold up on a busy machine, and still fail on the fault each one checks for.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { withPanel, jumpTo0001, jumpedBelowHeader } from './support/header-0160.mjs';
import { runFile, goneWithin10s, mentioning, DROP_CLEAN_UP } from './support/chromium-file.mjs';
import { widenKept, swipeChangesLane } from './support/swipe-0761.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// ---------- AC1: 0160 AC5 ----------

test('0776 AC1: the 0160 AC5 check that a jump shows the ticket below the header passes once the ticket\'s highlight has gone', skip, () => withPanel(async b => {
  await jumpTo0001(b);
  await b.until(`!document.querySelector('#shaping .item.flash')`, 'the highlight to go', 5000);
  await jumpedBelowHeader(b);
}));

test('0776 AC1: the 0160 AC5 check still fails when the jump leaves the ticket under the header', skip, () => withPanel(async b => {
  await jumpTo0001(b);
  await jumpedBelowHeader(b);
  // Scrolls Plan's list so the ticket's top is 20 px under the header's bottom, as a jump that left it there would.
  await b.js(`(() => { const l = document.getElementById('shaping'), t = [...l.querySelectorAll('.item')].find(n => n.querySelector('.id')?.textContent === '0001');
    l.scrollTop += t.getBoundingClientRect().top - (document.querySelector('header').getBoundingClientRect().bottom - 20); return true; })()`);
  await assert.rejects(jumpedBelowHeader(b), /the ticket's top \(.*\) is below the header's bottom/);
}));

// ---------- AC2: 0723 AC2 ----------

test('0776 AC2: browserPage handles a stopping signal from before it starts Chromium, so one that comes while it starts ends Chromium too', skip, async () => {
  // The file counts the SIGTERM handlers as Chromium is started, through child_process's spawn, which it wraps.
  const f = await runFile(`import { createRequire, syncBuiltinESMExports } from 'node:module';
const cp = createRequire(import.meta.url)('node:child_process'), real = cp.spawn;
cp.spawn = (cmd, args, ...rest) => { if (args?.includes('--remote-debugging-port=0')) logPid('handlers ' + process.listenerCount('SIGTERM')); return real.call(cp, cmd, args, ...rest); };
syncBuiltinESMExports();
test('opens a page', async () => { const b = await browserPage('about:blank'); await b.close(); });`);
  assert.equal(f.code, 0, f.out);
  const lines = fs.readFileSync(f.log, 'utf8').trim().split('\n');
  assert.deepEqual(lines, ['handlers 1'], 'one handler, browserPage\'s, before Chromium started');
  await goneWithin10s(f);
});

test('0776 AC2: a test file that drops browserPage\'s clean-up still ends on a SIGTERM that came just before, and leaves Chromium running', skip, async () => {
  // The signal comes before the file drops the clean-up and is handled after: with no handler then, Node would drop it,
  // and the file would wait until the runner's time limit.
  const f = await runFile(`test('stops', async () => {
  const b = await browserPage('about:blank'); logPid(b.pid);
  process.kill(process.pid, 'SIGTERM');
  ${DROP_CLEAN_UP}
  await new Promise(() => {});
});`, ['--test-timeout=15000']);
  assert.deepEqual(fs.readFileSync(f.log, 'utf8').trim().split('\n').slice(1), ['stopped'], f.out);
  assert.ok(mentioning(f.dir).includes(f.pids[0]), 'Chromium was left running');
  await assert.rejects(goneWithin10s(f), /Chromium still running 10 s after the test file finished/);
});

// ---------- AC3: 0761 AC2 ----------

let panel = null, page = null;
before(async () => {
  if (skip.skip) return;
  const r = panelRepo({ prefix: 'speck-keep-' }); // speck-keep-*: kept between this file's tests, which share it
  r.write('0002-a-draft.md', fm({ id: '"0002"', title: 'A draft', status: 'draft' }), good);
  r.g('add', '-A'); r.g('commit', '-qm', 'a draft');
  panel = await startPanel(r.dir, ['--port', String(await freePort())]);
});
after(async () => { await page?.close(); if (panel) await stop(panel); });

// The panel as a 390 px phone with touch, loaded afresh, Plan open, with a block wider than its list kept at its top.
async function phone() {
  if (!page) {
    page = await browserPage(`http://127.0.0.1:${panel.port}/`);
    await page.loaded();
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  } else {
    await page.js('window.before0776 = true');
    await page.send('Page.reload', {});
    await page.until('!window.before0776 && document.readyState === "complete"', 'the page to load again');
  }
  await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 1, mobile: true });
  await page.until(`!!document.querySelector('#shaping .item.ticket')`, 'the draft in Plan');
  await page.js(openLane('plan'));
  await page.js(widenKept('shaping'));
  return page;
}

test('0776 AC3: the 0761 AC2 swipe that starts on the wide block changes lane even when Plan\'s list is drawn again partway through it', skip, async () => {
  const b = await phone();
  // render() is what the panel's 5-second ping runs: it takes out of the list what the panel didn't put there.
  await swipeChangesLane(b, '#shaping .wide-0761', 'the swipe to change lane to Build', { midway: () => b.js('render(), true') });
  assert.equal(await b.js(`!!document.querySelector('#shaping .wide-0761')`), true, 'the wide block is still there');
});

test('0776 AC3: the 0761 AC2 swipe check still fails when a swipe on the wide block doesn\'t change lane', skip, async () => {
  const b = await phone();
  // The lanes never hear of a touch that starts on the block, as if a swipe there were left to it.
  await b.js(`(n => { for (const t of ['touchstart', 'touchmove', 'touchend']) n.addEventListener(t, e => e.stopPropagation()); return true; })(document.querySelector('#shaping .wide-0761'))`);
  await assert.rejects(swipeChangesLane(b, '#shaping .wide-0761', 'the swipe to change lane to Build', { ms: 1500 }), /timed out waiting for the swipe to change lane to Build/);
  assert.equal(await b.js(`document.querySelector('[role=tab][aria-selected=true]').id`), 'tab-plan');
});

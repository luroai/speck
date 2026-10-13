import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fm, panelRepo, freePort, startPanel, stop, fakePage, full, click, items, top, findChrome, browserPage, charAt } from './support/panel.mjs';

// ---------- 0060: the full ticket pane holds the page still, and a click outside it closes it ----------

const pane = p => p.byId('full-ticket');
const backdrop = p => p.byId('full-backdrop');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
const isOpen = item => /\bopen\b/.test(item.className);
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const fullButton = (p, item) => p.all(item).find(n => n.tagName === 'button' && n.textContent === 'Full ticket');
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const at = target => ({ target, stopPropagation() {} });

test('0060 AC3 and AC5: the backdrop shows with the pane, a click on it closes the pane, and the ticket stays open', async () => {
  const s = { tickets: [full('0001'), full('0002')], ideas: [] };
  const p = fakePage([s, clone(s), clone(s)]);
  await p.settle();
  assert.ok(backdrop(p).hidden, 'no backdrop while the pane is closed');
  click(top(itemOf(p, '0001')));
  click(fullButton(p, itemOf(p, '0001')));
  assert.ok(paneOpen(p) && !backdrop(p).hidden, 'the backdrop shows with the pane');
  await refresh(p);
  assert.ok(paneOpen(p) && !backdrop(p).hidden, 'AC5: the refresh keeps both');
  backdrop(p).listeners.click(at(backdrop(p)));
  assert.ok(!paneOpen(p) && backdrop(p).hidden, 'a click on the backdrop closes the pane');
  assert.ok(isOpen(itemOf(p, '0001')), 'the ticket stays open in the list');
  assert.ok(!isOpen(itemOf(p, '0002')), 'and nothing else opens');
  await refresh(p);
  assert.ok(!paneOpen(p) && backdrop(p).hidden, 'and stays closed');
});

test('0060 AC4: a click that only ends on the backdrop leaves the pane open', async () => {
  const s = { tickets: [full('0001')], ideas: [] };
  const p = fakePage([s]);
  await p.settle();
  click(top(itemOf(p, '0001')));
  click(fullButton(p, itemOf(p, '0001')));
  backdrop(p).listeners.click(at(pane(p))); // the browser sends a drag's click to a node holding both ends
  assert.ok(paneOpen(p), 'still open');
});

test('0060 AC5: Escape still closes the pane and its backdrop', async () => {
  const s = { tickets: [full('0001')], ideas: [] };
  const p = fakePage([s]);
  await p.settle();
  click(top(itemOf(p, '0001')));
  click(fullButton(p, itemOf(p, '0001')));
  p.key('Escape');
  assert.ok(!paneOpen(p) && backdrop(p).hidden);
  assert.ok(isOpen(itemOf(p, '0001')));
});

test('0060 AC1-AC5: in a real browser, the pane holds the page still and closes on a click outside it', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  const criteria = Array.from({ length: 80 }, (_, i) => `${i + 1}. Criterion number ${i + 1}, long enough to read.`).join('\n');
  const long = status => r.write('0002-long.md', fm({ id: '"0002"', title: 'A long draft', status }),
    `## Problem\nA long ticket to scroll through.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n${criteria}\n## Out of scope\n- PDF export\n`);
  long('draft');
  for (let i = 3; i <= 40; i++) { const id = String(i).padStart(4, '0'); r.write(`${id}-d.md`, fm({ id: `"${id}"`, title: `Draft ${id}`, status: 'draft' })); }
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const item = '#shaping .item';
  const isHidden = () => b.js(`document.getElementById('full-ticket').hidden`);
  const scrollY = () => b.js('scrollY');
  const openStates = () => b.js(`[...document.querySelectorAll('${item}')].map(n => n.classList.contains('open'))`);
  const openPane = async () => {
    await b.js(`[...document.querySelectorAll('${item}.open button')].find(x => x.textContent === 'Full ticket').click()`);
    await b.until(`!document.getElementById('full-ticket').hidden && !!document.querySelector('#full-ticket ol li')`, 'the pane');
  };
  const scrollTo = async y => { await b.js(`scrollTo(0, ${y})`); await b.until(`scrollY === ${y}`, `the page at ${y}`); };
  const still = async (y, what) => { await wait(250); assert.equal(await scrollY(), y, what); };
  const wheel = (x, y, deltaY) => b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY });
  const key = (k, code, vk, text) => b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) })
    .then(() => b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }));
  const swipe = (x, y, yDistance) => b.send('Input.synthesizeScrollGesture', { x, y, yDistance, gestureSourceType: 'touch', speed: 2000 });
  const press = async ([x, y]) => {
    await b.move([x, y]);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  };
  const inPane = [1100, 450], outside = [200, 450];
  try {
    await b.until(`document.querySelectorAll('${item}').length === 39`, 'the drafts');
    await b.js(`document.querySelector('${item} .title').click()`);
    await b.until(`!!document.querySelector('${item}.open .detail')`, 'the draft to open');
    assert.ok(await b.js('document.documentElement.scrollHeight > innerHeight + 600'), 'the page is longer than the window');

    // AC1: wheel, keyboard and touch never move the page, at the pane's top, bottom or outside it.
    await scrollTo(300);
    await openPane();
    assert.ok(await b.js(`(p => p.scrollHeight > p.clientHeight)(document.getElementById('full-ticket'))`), 'the pane is longer than the window');
    await wheel(...inPane, -400);
    await still(300, 'wheel up over the pane at its top');
    await wheel(...inPane, 300);
    await wait(250);
    assert.ok(await b.js(`document.getElementById('full-ticket').scrollTop > 0`), 'the wheel scrolls the pane');
    for (let i = 0; i < 30; i++) await wheel(...inPane, 800);
    await wait(250);
    assert.ok(await b.js(`(p => p.scrollTop + p.clientHeight >= p.scrollHeight - 1)(document.getElementById('full-ticket'))`), 'the pane reaches its bottom');
    await wheel(...inPane, 800);
    await still(300, 'wheel down over the pane at its bottom');
    await wheel(...outside, 800);
    await still(300, 'wheel down outside the pane');
    await wheel(...outside, -800);
    await still(300, 'wheel up outside the pane');
    for (const [k, code, vk, text] of [['PageDown', 'PageDown', 34], [' ', 'Space', 32, ' '], ['End', 'End', 35], ['ArrowDown', 'ArrowDown', 40], ['PageUp', 'PageUp', 33], ['Home', 'Home', 36]]) {
      await key(k, code, vk, text);
      await still(300, `${code} with the pane focused`);
    }
    await b.js(`document.getElementById('full-ticket').scrollTop = 0`);
    await key('PageDown', 'PageDown', 34);
    await wait(250);
    assert.ok(await b.js(`document.getElementById('full-ticket').scrollTop > 0`), 'Page Down scrolls the pane');
    await b.js('document.activeElement.blur()');
    for (const [k, code, vk, text] of [['PageDown', 'PageDown', 34], [' ', 'Space', 32, ' '], ['End', 'End', 35], ['ArrowUp', 'ArrowUp', 38]]) {
      await key(k, code, vk, text);
      await still(300, `${code} with nothing focused`);
    }
    // Tab and Shift+Tab never reach the page behind, so nothing there takes the focus, presses or scrolls into view.
    const states = await openStates();
    await b.js(`document.getElementById('full-ticket').focus()`);
    for (const modifiers of [0, 8]) {
      for (let i = 0; i < 12; i++) {
        await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers });
        await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers });
        assert.ok(await b.js(`(a => a === document.body || document.getElementById('full-ticket').contains(a))(document.activeElement)`), `${modifiers ? 'Shift+Tab' : 'Tab'} keeps the focus off the page behind`);
      }
      await still(300, `${modifiers ? 'Shift+Tab' : 'Tab'} leaves the page still`);
    }
    assert.ok(!(await isHidden()), 'the pane stays open');
    assert.deepEqual(await openStates(), states, 'no key reached a ticket behind');
    await swipe(...inPane, -2000);
    await still(300, 'a swipe up over the pane at its bottom');
    await swipe(...outside, -600);
    await still(300, 'a swipe up outside the pane');
    await b.js(`document.getElementById('full-ticket').scrollTop = 0`);
    await swipe(...inPane, 2000);
    await still(300, 'a swipe down over the pane at its top');

    // AC4: a click inside, and a selection from inside to outside, leave it open.
    await press(inPane);
    assert.ok(!(await isHidden()), 'a click inside leaves it open');
    await b.js(`document.getElementById('full-ticket').scrollTop = 0`);
    await b.drag(await b.js(charAt('#full-ticket ol li', 0)), outside);
    const picked = await b.js('getSelection().toString()'); assert.ok(picked.length > 0, 'the drag selected text');
    await wait(100);
    assert.ok(!(await isHidden()), 'a selection ending outside leaves it open');

    // AC5: the refresh neither closes it nor moves the page.
    const refreshed = async what => { await b.js(`window.seen = document.getElementById('run').firstChild`); await b.until(`document.getElementById('run').firstChild !== window.seen`, what); };
    await refreshed('a refresh'); await refreshed('a second refresh');
    assert.ok(!(await isHidden()), 'the refresh keeps it open');
    await still(300, 'the refresh keeps the page still');

    // AC3 and AC2: a click outside closes it and does nothing else, and the page is where it was.
    const before = await openStates();
    const behind = await b.js(`(r => [r.left + 30, r.top + r.height / 2])(document.querySelectorAll('${item}')[6].querySelector('.head').getBoundingClientRect())`);
    assert.ok(behind[0] < 700 && behind[1] > 0 && behind[1] < 900, 'a ticket row lies under the backdrop');
    await press(behind);
    assert.ok(await isHidden(), 'a click outside closes the pane');
    assert.deepEqual(await openStates(), before, 'no ticket opened or closed');
    assert.equal(await scrollY(), 300, 'AC2: the page is where it was');
    await b.until(`document.documentElement.scrollHeight > innerHeight + 600`, 'the page still long');
    await wheel(...outside, 200);
    await b.until('scrollY !== 300', 'the page to scroll again once the pane is closed');

    // A click outside over a button: the list toggle stays on Tickets.
    await scrollTo(0);
    await openPane();
    const toggle = await b.js(`(r => [r.left + r.width / 2, r.top + r.height / 2])(document.querySelectorAll('#shaping-toggle button')[1].getBoundingClientRect())`);
    assert.ok(toggle[0] < 700, 'the Ideas toggle lies under the backdrop');
    await press(toggle);
    assert.ok(await isHidden(), 'the click closes the pane');
    assert.ok(await b.js(`!!document.querySelector('${item}.ticket')`), 'and the Tickets list still shows');

    // AC2 and AC5: Close and Escape close it and leave the page where it was.
    await scrollTo(250);
    await openPane();
    await b.js(`document.querySelector('#full-ticket .close').click()`);
    assert.ok(await isHidden(), 'Close closes it');
    await still(250, 'after Close');
    await scrollTo(400);
    await openPane();
    await key('Escape', 'Escape', 27);
    assert.ok(await isHidden(), 'Escape closes it');
    await still(400, 'after Escape');

    // AC2: closing because the ticket left the list leaves the page where it was too.
    await scrollTo(350);
    await openPane();
    long('cancelled'); // a ready ticket shows in the queue, where the pane stays open on it (0063)
    await b.until(`document.getElementById('full-ticket').hidden`, 'the pane to close once the ticket is cancelled');
    await still(350, 'after the ticket left the list');
  } finally {
    await b.close();
    await stop(panel);
  }
});

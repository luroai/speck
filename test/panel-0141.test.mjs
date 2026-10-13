import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, fm, good, panelRepo, freePort, startPanel, stop, fakePage, T, full, items, shippedRows, queueRows, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0141: keep a shipped ticket open when its title is tapped on a phone ----------

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const STATE = () => ({ ideas: [], tickets: [
  T('0005', 'approved', { started: ago(30) }), T('0007', 'ready'),
  T('0009', 'done', { started: ago(90), finished: ago(60), title: 'Shipped nine' }),
  T('0010', 'done', { started: ago(50), finished: ago(20), title: 'Shipped ten', type: 'bug' }),
] });
const pane = p => p.byId('full-ticket');
const paneId = p => (pane(p).hidden || !pane(p).children.length ? null : pane(p).children[0].children[0].textContent);
const rowOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const titleOf = (p, row) => p.all(row).find(n => n.className === 'title-link');
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const event = () => { const e = { prevented: false, stopped: false }; e.preventDefault = () => { e.prevented = true; }; e.stopPropagation = () => { e.stopped = true; }; return e; };

test('0141 AC1: a Shipped row\'s title is not a link and has no address', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  for (const id of ['0009', '0010']) {
    const row = rowOf(p, id);
    const t = titleOf(p, row);
    assert.ok(t, `${id}: a title`);
    assert.notEqual(t.tagName, 'a', `${id}: not an <a>`);
    assert.equal(t.href, undefined, `${id}: no address`);
    assert.equal(p.all(row).filter(n => n.tagName === 'a').length, 0, `${id}: no link anywhere in the row`);
  }
  assert.doesNotMatch(page(), /\.href\s*=\s*'#'/, 'nothing in the panel points at "#"');
});

test('0141 AC2: clicking or tapping the title opens that ticket in the full ticket pane, and nothing else', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const opens = () => queueRows(p).map(r => r.className);
  const before = opens();
  const e = event();
  titleOf(p, rowOf(p, '0010')).listeners.click(e);
  assert.equal(paneId(p), '0010');
  assert.ok(pane(p).textContent.includes('Shipped ten'));
  assert.ok(e.stopped, 'the click goes no further');
  assert.deepEqual(opens(), before, 'nothing else opens or closes');
  p.press(titleOf(p, rowOf(p, '0009')));
  assert.equal(paneId(p), '0009', 'another title opens that ticket instead');
  assert.ok(!pane(p).textContent.includes('Review pack'), 'the full ticket, not the review pack');
});

test('0141 AC3: the title keeps its look: accent colour, pointer cursor, underlined only on hover, 44 px on a phone', () => {
  const s = css();
  const rule = sel => (s.match(new RegExp(`\\n\\s*${sel.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';
  const base = rule('td .title-link'), hover = rule('td .title-link:hover');
  assert.match(base, /color:\s*var\(--accent\)/);
  assert.match(base, /cursor:\s*pointer/);
  assert.match(base, /text-decoration:\s*none/);
  assert.match(hover, /text-decoration:\s*underline/);
  const phone = s.slice(s.indexOf('@media (max-width: 699.98px)'));
  assert.match(phone, /td \.title-link \{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px/);
});

test('0141 AC4: Tab reaches the title, Enter and Space open it, and it is named by the title', async () => {
  const p = fakePage([STATE(), STATE()]);
  await p.settle();
  const t = titleOf(p, rowOf(p, '0009'));
  assert.equal(t.tabIndex, 0, 'in the Tab order');
  assert.equal(t.attrs && t.attrs.role, 'button', 'announced as something to press');
  assert.equal(t.textContent, 'Shipped nine', 'named by its title');
  for (const key of ['Enter', ' ']) {
    p.key('Escape');
    assert.equal(paneId(p), null, 'closed first');
    const e = event(); e.key = key;
    t.listeners.keydown(e);
    assert.equal(paneId(p), '0009', `${JSON.stringify(key)} opens it`);
    assert.ok(e.prevented, `${JSON.stringify(key)} doesn't scroll the page`);
    assert.ok(e.stopped, `${JSON.stringify(key)} goes no further`);
  }
  p.key('Escape');
  const e = event(); e.key = 'a';
  t.listeners.keydown(e);
  assert.equal(paneId(p), null, 'another key does nothing');
  assert.ok(!e.prevented, 'and is left alone');
});

test('0141 AC4 (self-check): with a priority menu open, Enter or Space on the title only closes the menu, as a click does', async () => {
  for (const key of ['Enter', ' ']) {
    const s = STATE(); s.tickets.push(full('0001', { priority: 3 }));
    const p = fakePage([s, s]);
    await p.settle();
    const draft = () => items(p).find(n => n.textContent.startsWith('0001'));
    const menu = () => p.all(draft()).find(x => /\bprio-menu\b/.test(x.className || ''));
    p.press(p.all(draft()).find(x => /\bpick\b/.test(x.className || '')));
    assert.ok(menu(), 'the menu is open');
    const e = event(); e.key = key;
    titleOf(p, rowOf(p, '0009')).listeners.keydown(e);
    assert.equal(menu(), undefined, `${JSON.stringify(key)}: the menu closes`);
    assert.equal(paneId(p), null, `${JSON.stringify(key)}: and the ticket doesn't open`);
    assert.ok(e.prevented, `${JSON.stringify(key)}: nor does the page scroll`);
  }
});

test('0141 AC1-AC4: in a real phone-sized browser, the title has no address, opens by tap, Enter and Space without reloading or scrolling, and keeps its look', chrome, async () => {
  const r = panelRepo();
  for (let i = 1; i <= 30; i++) {
    const id = String(i).padStart(4, '0');
    r.write(`${id}-done.md`, fm({ id: `"${id}"`, title: `Shipped ${i}`, status: 'done', started: ago(200 - i), finished: ago(100 - i) }), good.replace('Users cannot export.', `Body of ${i}.`), 'speck/tickets/done');
  }
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const title = `document.querySelector('#shipped tr .title-link')`;
  const opened = `!document.getElementById('full-ticket').hidden && document.querySelector('#full-ticket .id').textContent === document.querySelector('#shipped tr .id').textContent`;
  const close = () => b.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await b.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, ...(type === 'keyDown' ? { text: k === 'Enter' ? '\r' : k } : {}) }); };
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await b.send('Page.enable');
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && !!${title}`, 'the Shipped row\'s title');
    await b.js(`window.__notReloaded = true`);
    // AC1: no link, no address.
    const what = await b.js(`(() => { const t = ${title}; return { tag: t.tagName, href: t.getAttribute('href'), links: t.closest('tr').querySelectorAll('a').length }; })()`);
    assert.notEqual(what.tag, 'A', 'AC1: not a link');
    assert.equal(what.href, null, 'AC1: no address');
    assert.equal(what.links, 0, 'AC1: no link in the row');
    // AC3: the look, and the tap area.
    const look = await b.js(`(() => { const a = ${title}, s = getComputedStyle(a), probe = document.createElement('span'), r = a.getBoundingClientRect();
      probe.style.color = 'var(--accent)'; document.body.appendChild(probe); const accent = getComputedStyle(probe).color; probe.remove();
      return { color: s.color, accent, cursor: s.cursor, line: s.textDecorationLine, width: r.width, height: r.height }; })()`);
    assert.equal(look.color, look.accent, 'AC3: the accent colour');
    assert.equal(look.cursor, 'pointer', 'AC3: a pointer cursor');
    assert.equal(look.line, 'none', 'AC3: not underlined until hovered');
    assert.ok(look.width >= 43.5 && look.height >= 43.5, `AC3: a 44 px tap area (${look.width}x${look.height})`);
    // AC2: a tap, with the page scrolled down to the row, opens it without moving or reloading the page.
    await b.js(`${title}.scrollIntoView({ block: 'center' })`);
    const scrolled = await b.js(`scrollY`);
    const [x, y] = await b.js(`(r => [r.left + r.width / 2, r.top + r.height / 2])(${title}.getBoundingClientRect())`);
    await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await b.until(opened, 'AC2: the pane opened from a tap on the title');
    await new Promise(res => setTimeout(res, 300));
    assert.ok(await b.js(`window.__notReloaded === true`), 'AC2: the page wasn\'t reloaded');
    assert.equal(await b.js(`location.hash`), '', 'AC2: the address stays the same');
    assert.equal(await b.js(`scrollY`), scrolled, 'AC2: the page wasn\'t scrolled');
    assert.ok(await b.js(opened), 'AC2: and the ticket stays open');
    await close();
    // AC4: Tab reaches it, and Enter and Space open it.
    for (const [k, code, vk] of [['Enter', 'Enter', 13], [' ', 'Space', 32]]) {
      await b.js(`document.activeElement && document.activeElement.blur()`);
      let reached = false;
      for (let i = 0; i < 300 && !reached; i++) { await key('Tab', 'Tab', 9); reached = await b.js(`document.activeElement === ${title}`); }
      assert.ok(reached, 'AC4: Tab reaches the title');
      const before = await b.js(`scrollY`);
      await key(k, code, vk);
      await b.until(opened, `AC4: the pane opened with ${code}`);
      assert.equal(await b.js(`scrollY`), before, `AC4: ${code} doesn't scroll the page`);
      assert.ok(await b.js(`window.__notReloaded === true`), 'AC4: the page wasn\'t reloaded');
      await close();
    }
    // AC4: screen readers get it named by the title.
    await b.send('Accessibility.enable');
    const { nodes } = await b.send('Accessibility.getFullAXTree');
    const name = await b.js(`${title}.textContent`);
    assert.ok(nodes.some(n => n.role && n.role.value === 'button' && n.name && n.name.value === name), `AC4: a button named "${name}"`);
  } finally { await b.close(); await stop(panel); }
});

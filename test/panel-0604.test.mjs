import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, page, click, fakePage, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { rules, get, selectors } from './support/css.mjs';

// ---------- 0604: the black bar with room for its whole status ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const headerHtml = () => (page().match(/<header>([\s\S]*?)<\/header>/) || [])[1] || '';
const decl = (sel, prop) => rules().filter(r => !r.at.length && selectors(r).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();
const foreman = (o = {}) => ({ word: 'Shipping 0599', tone: 'ok', mood: 'focused', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
const board = (f, o = {}) => ({ tickets: [T('0001', 'building')], ideas: [], run: { on: true, pid: 1 }, foreman: f, ...o });
const two = { self: 4777, list: [{ port: 4777, name: 'speck' }, { port: 4778, name: 'alpha' }] };
const options = p => p.byId('project').children.map(o => ({ value: o.value, text: o.textContent, selected: o.selected }));
const chosen = p => options(p).find(o => o.selected);
const choose = async (p, value) => { p.byId('project').value = value; p.byId('project').listeners.change(); await p.settle(); };
const opened = async (states, globals) => { const p = fakePage(states, globals); await p.settle(); return p; };

test('0604 AC1: speck is 56 px, beside three lines: the status, the project with the base branch, and what is waiting', async () => {
  const h = headerHtml();
  assert.match(h, /<span class="bar-face" id="bar-face" aria-hidden="true"><\/span><span class="bar-word" id="bar-word"><\/span><span class="bar-more">/, 'the status on a line of its own');
  assert.match(h, /<span class="bar-where"><span class="bar-name"><span class="repo">\{\{repo\}\}<\/span>[\s\S]*?<\/span><\/span><span class="bar-base"> · <code>\{\{base\}\}<\/code><\/span><\/span>/, 'the project, then the base branch');
  assert.match(h, /<span class="bar-more"><span id="bar-queued"><\/span><span id="bar-needs-part" hidden> · <span class="needs" id="bar-needs"><\/span><\/span><\/span>/, 'what is queued and how many need you');
  assert.equal(decl('.bezel', 'display'), 'grid');
  assert.equal(decl('.bezel', 'grid-template-rows'), 'auto auto auto', 'three lines');
  assert.equal(decl('.bezel .bar-face', 'width'), '56px');
  assert.equal(decl('.bezel .bar-face', 'height'), '56px');
  assert.equal(decl('.bezel .bar-word', 'grid-row'), '1');
  assert.equal(decl('.bezel .bar-where', 'grid-row'), '2');
  assert.equal(decl('.bezel .bar-more', 'grid-row'), '3');
  assert.equal(decl('.bezel .bar-more .needs', 'color'), 'var(--bar-needs)', 'how many need you, in orange');
  const p = await opened([board(foreman({ word: 'Needs you 2', mood: 'asking', ready: [{ id: '0002', why: 'x' }] }))]);
  const face = p.byId('bar-face').children[0];
  assert.equal(face.attrs.width, '56');
  assert.equal(face.attrs.height, '56');
  assert.equal(p.byId('bar-word').textContent, 'Needs you 2');
  assert.equal(p.byId('bar-queued').textContent, '1 queued');
  assert.equal(p.byId('bar-needs').textContent, '2 need you');
  const q = await opened([board(foreman())]);
  assert.equal(q.byId('bar-word').textContent, 'Shipping 0599', 'the status with its ticket');
});

test('0604 AC2: the project\'s name is the menu, listing the projects and All projects, with the project shown chosen', async () => {
  assert.match(headerHtml(), /<span class="bar-name"><span class="repo">\{\{repo\}\}<\/span><span class="project-pick" id="project-pick"[^>]*hidden><select id="project"/, 'the menu is on the name');
  assert.equal(decl('.bezel .project-pick select', 'position'), 'absolute', 'the menu covers the name');
  assert.equal(decl('.bezel .bar-name', 'position'), 'relative');
  const p = await opened([board(foreman(), { projects: two })]);
  assert.equal(p.byId('project-pick').hidden, false);
  assert.deepEqual(options(p).map(o => o.text), ['speck', 'alpha', 'All projects']);
  assert.equal(chosen(p).text, 'speck', 'the project shown, not All projects');
  assert.equal(p.byId('bezel').children.some(c => c.className === 'bridge-open'), false, 'no All projects beside the menu');
});

test('0604 AC2: with one project there is no menu and no All projects', async () => {
  for (const projects of [undefined, { self: 4777, list: [{ port: 4777, name: 'speck' }] }]) {
    const p = await opened([board(foreman(), projects ? { projects } : {})]);
    assert.equal(p.byId('project-pick').hidden, true);
    assert.equal(options(p).some(o => o.text === 'All projects'), false);
  }
});

test('0604 AC2: choosing All projects opens the bridge, chosen only while it is open, and closing it chooses the project shown again', async () => {
  const p = await opened([board(foreman(), { projects: two }), { self: 4777, projects: [] }]);
  await choose(p, 'all');
  assert.equal(p.byId('bridge').hidden, false, 'the bridge opens');
  assert.equal(chosen(p).text, 'All projects', 'chosen while the bridge is open');
  assert.equal(p.calls.some(c => /^\/api\/projects\/\d/.test(c.url)), false, 'it asks for no project');
  p.key('Escape');
  assert.equal(p.byId('bridge').hidden, true);
  assert.equal(chosen(p).text, 'speck', 'the project shown again');
  await choose(p, 'all');
  assert.equal(p.byId('bridge').hidden, false, 'and it opens again');
});

test('0604 AC2: the menu stays on the project shown as boards come in', async () => {
  const p = await opened([board(foreman(), { projects: two }), board(foreman({ word: 'Idle' }), { projects: two })]);
  for (const t of p.timers.splice(0)) t();
  await p.settle();
  assert.equal(chosen(p).text, 'speck');
});

test('0604 AC4: Settings stays at the bar\'s right, 44 px square, and pressing the status opens the Pipeline log', async () => {
  assert.match(headerHtml(), /<\/span>\s*<button class="settings-open" id="settings-open"[\s\S]*<\/button>\s*<\/div>\s*$/, 'the last thing in the bar');
  assert.equal(decl('.bezel .settings-open', 'grid-column'), '3');
  assert.equal(decl('.bezel .settings-open', 'width'), '44px');
  assert.equal(decl('.bezel .settings-open', 'height'), '44px');
  const p = await opened([board(foreman())]);
  click(p.byId('run'));
  await p.settle();
  assert.equal(p.byId('foreman').hidden, false);
});

const STATE = word => ({ tickets: Array.from({ length: 30 }, (_, i) => T(String(1000 + i), 'ready')), ideas: [], run: { on: true, pid: 1 },
  foreman: foreman({ word, mood: 'watching', ready: Array.from({ length: 30 }, (_, i) => ({ id: String(1000 + i), why: 'x' })) }), projects: two });
test('0604 AC1, AC3 and AC4: at 320 px the status and a 20-character project show in full, a longer one ends in "…", and Settings and the menu are where they should be', skip, async () => {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(window.__state), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
      window.__state = ${JSON.stringify(STATE('Waiting: other tickets'))};
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelector('#bar-word').textContent === 'Waiting: other tickets' && !!document.querySelector('#bar-face svg')`, 'the bar');
    await b.js('document.fonts.ready.then(() => true)');
    const measure = (word, name) => b.js(`(() => {
      document.querySelector('#bar-word').textContent = ${JSON.stringify(word)};
      document.querySelector('.bezel .repo').textContent = ${JSON.stringify(name)};
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; };
      const lines = s => { const range = document.createRange(); range.selectNodeContents(document.querySelector(s)); return new Set([...range.getClientRects()].map(x => Math.round(x.top + x.height / 2))).size; };
      const cut = s => { const n = document.querySelector(s); return n.scrollWidth > n.clientWidth + 0.5; };
      const at = (x, y) => document.elementFromPoint(x, y);
      const w = r('#bar-word'), name = r('.bezel .repo'), more = r('.bar-more');
      return { page: document.documentElement.scrollWidth, width: innerWidth, bar: r('.bezel'), face: r('#bar-face svg'), word: w, name, more, settings: r('#settings-open'),
        wordLines: lines('#bar-word'), wordCut: cut('#bar-word'), nameCut: cut('.bezel .repo'), baseCut: cut('.bar-base'), base: document.querySelector('.bar-base').textContent, nameEllipsis: getComputedStyle(document.querySelector('.bezel .repo')).textOverflow,
        onWord: [w.left + 1, w.left + w.width / 2, w.right - 1].every(x => [w.top + 1, w.bottom - 1].every(y => document.querySelector('#run').contains(at(x, y)))),
        onName: at(name.left + 4, name.top + name.height / 2)?.id, menu: r('#project') };
    })()`);
    for (const [word, name] of [['Shipping 0599', 'a-twenty-char-projct'], ['Waiting: other tickets', 'a-twenty-char-projct'], ['Shipping 0599', 'Speck-Landing-Page-2'], ['Shipping 0599', 'alpha-sample-project'], ['Shipping 0599', 'my_side_project_2026'], ['Shipping 0599', 'ACME-Payments-Portal'], ['Waiting: other tickets', 'speck-website-redux2']]) {
      const m = await measure(word, name), at = JSON.stringify(m);
      assert.equal(name.length, 20);
      assert.ok(m.page <= m.width, `no sideways scrolling: ${at}`);
      assert.ok(!m.wordCut && m.wordLines === 1, `"${word}" in full on one line: ${at}`);
      assert.ok(!m.nameCut, `a 20-character name in full: ${at}`);
      assert.equal(m.face.width, 56, `speck at 56 px: ${at}`);
      assert.ok(m.bar.height > 56, `taller than the old bar: ${at}`);
      assert.ok(m.word.bottom <= m.name.top + 0.5 && m.name.bottom <= m.more.top + 0.5, `three lines, one under the other: ${at}`);
      assert.ok(m.word.right <= m.settings.left + 0.5 && m.name.right <= m.settings.left + 0.5, `before Settings: ${at}`);
      assert.ok(Math.abs(m.settings.right - (m.bar.right - 2)) <= 4 && m.settings.width >= 44 && m.settings.height >= 44, `Settings at the right, 44 px square: ${at}`);
      assert.ok(m.onWord, `the whole status is the Pipeline log's button: ${at}`);
      assert.ok(m.menu.width >= 44 && m.menu.height >= 44 && m.menu.top >= m.word.bottom - 0.5, `the menu is 44 px each way, below the status: ${at}`);
      assert.equal(m.onName, 'project', `the name is the project menu: ${at}`);
    }
    const tips = await b.js(`[document.querySelector('#project-pick').title, document.querySelector('.bezel .repo').title]`);
    assert.ok(tips[1] && tips[0] === `${tips[1]} · Switch project`, `the menu's tooltip gives the project in full: ${tips}`);
    const short = await measure('Shipping 0599', 'speck');
    assert.ok(!short.nameCut && !short.baseCut && short.base === ' · main', `a short name leaves room for the base branch: ${JSON.stringify(short)}`);
    const long = await measure('Shipping 0599', 'a-client-project-with-a-really-long-name'), at = JSON.stringify(long);
    assert.ok(long.nameCut && long.nameEllipsis === 'ellipsis', `a longer name ends in "…": ${at}`);
    assert.ok(!long.wordCut && long.wordLines === 1, `the status is not: ${at}`);
    assert.ok(long.page <= long.width, `no sideways scrolling: ${at}`);
    // Pressing the status opens the Pipeline log, and so does pressing the project's line beside the menu
    await b.js(`document.querySelector('#bar-word').click(); true`);
    await b.until(`!document.querySelector('#foreman').hidden`, 'the Pipeline log');
    await b.js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true`);
    await b.until(`document.querySelector('#foreman').hidden`, 'the Pipeline log closed');
    await b.js(`document.querySelector('.bar-base').click(); true`);
    await b.until(`!document.querySelector('#foreman').hidden`, 'the Pipeline log, from the project\'s line');

  } finally { await b.close(); }
});

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, STYLE_FILES, STYLES, page, panelRepo, freePort, startPanel, stop, request, cliCopy, findChrome, browserPage, fm, good, openLane } from './support/panel.mjs';
import { cssAtoms, splitStyles } from './support/styles-0472.mjs';

// ---------- 0472: the panel's styles in a file for each area ----------

const AREAS = ['panel-base.css', 'panel-header.css', 'panel-cards.css', 'panel-popups.css', 'panel-settings.css'];

test('0472 AC1: the styles are in a file for each area in templates/, and panel.css is gone', () => {
  assert.deepEqual(STYLE_FILES, AREAS);
  assert.ok(!fs.existsSync(path.join(ROOT, 'templates', 'panel.css')), 'panel.css is gone');
  for (const f of STYLES) {
    const css = fs.readFileSync(f, 'utf8');
    assert.ok(cssAtoms(css).length > 0, `${path.basename(f)} has rules`);
    assert.doesNotMatch(css, /<\/?style>/, `${path.basename(f)} is plain CSS`);
  }
  assert.match(fs.readFileSync(STYLES[0], 'utf8'), /:root\[data-theme="dark"\] \{/, 'the colours of both looks are in panel-base.css');
});

test('0472 AC2: panel.html loads all five in the head, panel-base.css first', () => {
  const html = page();
  const links = [...html.matchAll(/<link rel="stylesheet" href="\/([^"]+)">/g)].map(m => [m[1], m.index]);
  assert.deepEqual(links.map(l => l[0]), AREAS);
  assert.ok(links.every(([, at]) => at < html.indexOf('</head>')), 'in the head, before the page shows');
  assert.doesNotMatch(html, /panel\.css|<style\b/i);
});

test('0472 AC2: the server answers each with its file as text/css, read afresh, and a change to any of them makes an open page out of date', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    const now = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).page;
    for (const name of AREAS) {
      const file = path.join(path.dirname(copy.page), name);
      const res = await request(p.port, { pathName: `/${name}` });
      assert.equal(res.status, 200, name);
      assert.match(String(res.headers['content-type']), /^text\/css\b/, name);
      assert.equal(res.headers['cache-control'], 'no-store', name);
      assert.equal(res.body, fs.readFileSync(file, 'utf8'), name);
      const sent = (await request(p.port, { pathName: '/' })).body.match(/data-page="([0-9a-f]{16})"/)[1];
      assert.equal(await now(), sent, `${name}: not out of date before the change`);
      fs.appendFileSync(file, '\n/* changed */\n');
      assert.match((await request(p.port, { pathName: `/${name}` })).body, /\/\* changed \*\/\n$/, `${name}: read afresh`);
      assert.notEqual(await now(), sent, `${name}: a page sent before the change is out of date`);
    }
    const unknown = await request(p.port, { pathName: '/no-such-thing' });
    for (const where of ['/panel.css', '/panel-base.css/', '/panel-.css', '/panel-base.css/../x', '/templates/panel-cards.css', '/PANEL-HEADER.CSS', '/panel-settings.js.css']) {
      const r = await request(p.port, { pathName: where });
      assert.deepEqual([r.status, r.body], [unknown.status, unknown.body], where);
    }
    fs.rmSync(path.join(path.dirname(copy.page), 'panel-popups.css'));
    const gone = await request(p.port, { pathName: '/panel-popups.css' });
    assert.equal(gone.status, 500);
    assert.match(gone.body, /Couldn't read .*panel-popups\.css.*\nPut the file back, then reload\.\n$/);
  } finally { await stop(p); }
});

// The styles as they were before the split and as it left them, from git, so this keeps checking the split itself
// after later tickets change the files. Before it's committed, the split is the files as they are now.
const before = splitStyles();
const noGit = before ? false : 'needs the repo\'s git history';

test('0472 AC3: the five files have every rule panel.css had, each once, and nothing else', { skip: noGit }, () => {
  const sorted = list => [...list].sort();
  assert.deepEqual(sorted(before.after.flatMap(cssAtoms)), sorted(cssAtoms(before.css)));
});

// ---------- In a real browser: every element's computed style is the same as before ----------

// Runs in the page: keeps each element's computed style, and its ::before's and ::after's where it has one, as one
// string, in window[key], with every animation held at its start so the lights' sweep can't make two readings differ.
// It reads each property the old styles or the split ones set (as longhands, and custom properties): a change in which
// rule wins shows in one of those, and anything worked out from them, such as an element's size, follows from them.
function computed(key) {
  if (!window.t0472.props) {
    const props = new Set(), walk = list => { for (const r of Array.from(list)) { if (r.cssRules) walk(r.cssRules); if (r.style) for (const p of Array.from(r.style)) props.add(p); } };
    for (const css of [...window.t0472.old, ...window.t0472.split]) { const sheet = new CSSStyleSheet(); sheet.replaceSync(css); walk(sheet.cssRules); }
    window.t0472.props = [...props].sort();
  }
  const props = window.t0472.props;
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; }
  const read = (n, pseudo) => { const cs = getComputedStyle(n, pseudo); if (pseudo && cs.content === 'none') return '';
    let s = ''; for (const p of props) s += `${p}:${cs.getPropertyValue(p)};`; return s; };
  const where = n => { const p = []; for (; n && n.nodeType === 1; n = n.parentElement) p.unshift(n.tagName.toLowerCase() + (n.id ? `#${n.id}` : '') + (typeof n.className === 'string' && n.className ? `.${n.className.trim().split(/\s+/).join('.')}` : '')); return p.join(' > '); };
  window[key] = [...document.querySelectorAll('*')].filter(n => !n.matches('style[data-t0472]')).map(n => [where(n), read(n), read(n, '::before'), read(n, '::after')]);
  return window[key].length;
}
// Runs in the page: each element's place in the page, to tell whether the page changed between two readings.
const shape = `[...document.querySelectorAll('*')].filter(n => !n.matches('style[data-t0472]')).map(n => n.tagName + '.' + n.className + '#' + n.id + n.querySelectorAll(':scope > :not(style[data-t0472])').length).join('|')`;
// Runs in the page: how two readings differ: the count of each, and those of the elements whose style differs, the
// first with the declarations that differ.
function differ(a, b) {
  a = window[a]; b = window[b];
  const bad = a.filter((n, i) => !b[i] || n.some((s, j) => s !== b[i][j]));
  const first = bad[0] && b[a.indexOf(bad[0])];
  return { a: a.length, b: b.length, bad: bad.length, at: bad[0]?.[0], what: first ? bad[0].slice(1).map((s, j) => s.split(';').filter(d => !first[j + 1].split(';').includes(d)).join(';')).join(' | ') : '' };
}
// Takes out the page's styles and puts those `which` names in their place, each a <style> in the head, in order. A
// headless Chrome has no mouse, so it never matches (hover: hover): both sets of styles are given it the same way,
// matched with a mouse and not with a touch screen.
const useStyles = which => `(() => { for (const n of document.querySelectorAll('link[rel="stylesheet"], style[data-t0472]')) n.remove();
  for (const css of window.t0472[${JSON.stringify(which)}]) { const s = document.createElement('style'); s.dataset.t0472 = '';
    s.textContent = css.replace(/\\(hover: hover\\)/g, window.t0472.mouse ? 'all' : 'not all'); document.head.append(s); }
  return document.styleSheets.length; })()`;

function repo() {
  const r = panelRepo();
  const iso = t => new Date(t).toISOString();
  const blocked = `${good}\n## Blocked question\nShould it export dates as ISO or as the user's locale?\n\nRecommended: ISO\nChanges what you'd notice: yes\nClear winner: no\n`;
  r.write('0002-a.md', fm({ id: '"0002"', title: "'An approved ticket'", status: 'approved' }), good);
  r.write('0003-d.md', fm({ id: '"0003"', title: "'A draft to shape'", status: 'draft', priority: 2 }), good);
  r.write('0004-b.md', fm({ id: '"0004"', title: "'A blocked ticket'", status: 'blocked', type: 'bug', risk: 'high' }), blocked);
  r.write('0005-w.md', fm({ id: '"0005"', title: "'A ticket waiting on another'", status: 'draft', after: '["0003"]' }), good);
  r.write('0010-t.md', fm({ id: '"0010"', title: "'A shipped ticket with a longer title'", status: 'done', started: iso(Date.now() - 3e6), finished: iso(Date.now() - 1e6) }), good, 'speck/tickets/done');
  fs.mkdirSync(path.join(r.dir, 'speck', 'ideas'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', '2026-10-24-an-idea.md'), '# An idea\n\nCaptured: 2026-10-24 · Status: inbox\n\n## What\nSome **text**, `code` and a table:\n\n| A | B |\n|---|---|\n| 1 | 2 |\n');
  r.g('add', '-A'); r.g('commit', '-qm', 'tickets');
  return r;
}
const PACK = `{ id: '0002', state: 'ok', text: '# Review pack\\n\\nIt passed.\\n\\n| # | Criterion | Result | Evidence |\\n|---|---|---|---|\\n| 1 | One | ✅ | A test |\\n\\n<details><summary>Findings</summary>None.</details>\\n\\n\`\`\`\\ncode\\n\`\`\`', pictures: [], documents: [{ path: 'outputs/0002/plan.md', url: '/api/tickets/0002/output/plan.md' }] }`;
// Each state of the page read, opened in turn: [name, script that opens it, what shows once it's open]. What a view
// leaves behind when the next opens stays in the page, hidden, and is read again with it. One marked false is only a
// step to the next, not read.
const VIEWS = [
  ['Plan, a ticket open', `${openLane('plan')}, document.querySelector('#shaping .item .head').click(), true`, `!!document.querySelector('#shaping .item.open .full-open')`],
  ['Plan, the priority menu', `document.querySelector('#shaping .tag.pick, #shaping .set-prio').click(), true`, `!!document.querySelector('.prio-menu button')`],
  ['Plan, the inbox', `document.querySelector('.prio-menu button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), [...document.querySelectorAll('#shaping-toggle button')].pop().click(), true`, `!!document.querySelector('#shaping .item.inbox, #shaping .item.idea')`],
  ['Plan, a note open', `document.querySelector('#shaping .item .head').click(), true`, `!!document.querySelector('#shaping .item.open .md')`],
  ['Build, each ticket open', `${openLane('build')}, [...document.querySelectorAll('#queue .q .top')].forEach(t => t.click()), true`, `document.querySelectorAll('#queue .q.open').length >= 2 && !!document.querySelector('#queue .q.blocked .question')`],
  ['Shipped, a ticket open', `${openLane('shipped')}, document.querySelector('#shipped .line .title').click(), true`, `!!document.querySelector('#shipped .facts')`],
  ['Plan, the tickets again', `${openLane('plan')}, [...document.querySelectorAll('#shaping-toggle button')][0].click(), true`, `!!document.querySelector('#shaping .item.ticket')`, false],
  ['Plan, a ticket open again', `document.querySelector('#shaping .item.open .full-open') || document.querySelector('#shaping .item.ticket .head').click(), true`, `!!document.querySelector('#shaping .item.open .full-open')`],
  ['the full ticket, open', `document.querySelector('#shaping .item.open .full-open').click(), true`, `!document.getElementById('full-ticket').hidden && !!document.querySelector('#full-ticket .close')`],
  ['a review pack with a document', `closeFull(), packOf = ${PACK}, fullId = '0002', fullFrom = null, render(), true`, `!!document.querySelector('#full-ticket .pack-document')`],
  ['a document', `docOpen = { id: '0002', path: 'outputs/0002/plan.md', state: 'ok', text: '# Plan\\n\\nWords.\\n\\n| A | B |\\n|---|---|\\n| 1 | 2 |' }, drawDoc(), true`, `!document.getElementById('doc-view').hidden && !!document.querySelector('#doc-view .close')`],
  ['Settings', `closeDoc(), closeFull(), document.getElementById('settings-open').click(), true`, `document.querySelectorAll('#settings .setting').length >= 10 && !!document.querySelector('#settings .save-all') && settingsView.catalogues !== 'loading'`, false], // once its agents' models have come (0407)
  ['Settings, an explanation open, and its question about unsaved changes', `document.querySelector('#settings .setting .info').click(), settingsLeaving = { saving: false }, renderLeaving(), true`,
    `!!document.querySelector('#settings .setting p.explain:not([hidden])') && !document.getElementById('settings-unsaved').hidden && document.querySelectorAll('#settings-unsaved button').length === 3`],
  ['the Pipeline log', `keepEditing(), closeSettings(), document.getElementById('run').click(), true`, `!document.getElementById('foreman').hidden && !!document.querySelector('#foreman .close')`],
];
const frames = `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`;
const skip = !findChrome() ? 'needs Chrome or Chromium' : noGit;

test('0472 AC3: in a real browser at 390 and 1200 px wide, in both looks, with a mouse and with a touch screen, every element\'s computed style is the same as before', { skip }, async () => {
  const r = repo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  let compared = 0;
  // Each way the page is seen: its width and pixel ratio, and whether it's used with a touch screen.
  const SEEN = [[390, 3, false], [390, 3, true], [1200, 1, false], [1200, 1, true]];
  const see = async ([width, dpr, touch], check = true) => {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: dpr, mobile: touch });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
    if (check) {
      await b.js(`window.t0472.mouse = ${!touch}, true`);
      assert.deepEqual(await b.js(`[innerWidth, devicePixelRatio, matchMedia('(pointer: coarse)').matches]`), [width, dpr, touch], 'the page is seen as given');
    }
  };
  // Reads with the split styles, then the old. Each new sheet loads speck's dot-matrix font again, so it's read once
  // the font is in. A view that changes between them is read again.
  const read = async (which, key) => { await b.js(useStyles(which)); await b.js('document.fonts.ready.then(() => true)'); await b.js(frames); return b.js(`(${computed})(${JSON.stringify(key)})`); };
  const compare = async () => {
    for (let tries = 1; ; tries++) {
      const first = await b.js(shape);
      await read('split', 'now'); await read('old', 'was');
      if (first === await b.js(shape) || tries >= 5) { await b.js(useStyles('split')); return b.js(`(${differ})('now', 'was')`); }
    }
  };
  try {
    await see(SEEN[0], false);
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.readyState === 'complete' && !!document.querySelector('#shaping .item .head') && !!document.querySelector('#shipped .line .title')`, 'the panel');
    await b.js(`window.t0472 = ${JSON.stringify({ old: [before.css], split: before.after })}, true`);
    await b.js(useStyles('split'));
    for (const [view, open, shows, check = true] of VIEWS) {
      await b.js(open);
      await b.until(shows, view);
      if (!check) continue;
      for (const way of SEEN) {
        await see(way);
        for (const look of ['light', 'dark']) {
          await b.js(`setLook(${JSON.stringify(look)}), true`);
          const d = await compare();
          const where = `${way[0]} px, ${way[2] ? 'touch' : 'mouse'}, ${look}, ${view}`;
          assert.equal(d.a, d.b, `${where}: the same elements`);
          assert.equal(d.bad, 0, `${where}: ${d.bad} elements' style changed, the first ${d.at}: ${d.what}`);
          compared += d.a;
        }
      }
    }
    assert.ok(compared > 10000, `elements compared: ${compared}`);
  } finally { await b.close(); await stop(panel); }
});

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, HEADER, headerScript, pageScript, pageScripts, page, fakePage, T, STYLE_FILES, panelRepo, freePort, startPanel, stop, request, cliCopy } from './support/panel.mjs';

// ---------- 0474: the header's script in a file of its own ----------

// What draws and updates speck's screen (its poses, words and time), the dark frame's title row and the tabs.
const HEADER_NAMES = ['drawHeader', 'drawScreen', 'screenFrame', 'watchPose', 'speckPoses', 'noteBoard', 'speckShown', 'latestMissed', 'speckNow', 'speckRests', 'pickPastime',
  'SCREEN', 'NEEDS_YOU', 'screen', 'SPECK', 'IDLE_MOODS', 'PASTIMES', 'speckDo', 'LCD', 'reducedMotion', 'pageHeader',
  'LANES', 'TAB_ORDER', 'openLane', 'laneScroll', 'laneOf', 'openTab', 'drawTabs'];
const declares = (js, name) => new RegExp(`^(?:async function|function|let|const) ${name}\\b`, 'm').test(js);

test('0474 AC1: speck\'s screen, the title row and the tabs are in templates/panel-header.js, panel.js no longer has them, and lcd.js is as it was', () => {
  assert.equal(HEADER, path.join(ROOT, 'templates', 'panel-header.js'));
  const js = headerScript(), rest = pageScript();
  assert.match(js, /^'use strict';/, 'strict, as the page\'s script is');
  assert.doesNotMatch(js, /<\/?script\b/, 'the file is plain JavaScript');
  assert.doesNotMatch(js, /\{\{\w+\}\}/, 'nothing in it is put in by the server, as it is served as it is');
  for (const name of HEADER_NAMES) {
    assert.ok(declares(js, name), `panel-header.js has ${name}`);
    assert.ok(!declares(rest, name), `panel.js no longer has ${name}`);
  }
  for (const [what, re] of [['the title row\'s tooltip', /repo\.title = /], ['the screen\'s reduced-motion listener', /matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.addEventListener/],
    ['the tabs\' keys', /tab\.addEventListener\('keydown'/], ['the screen\'s frame edge', /\$\('bezel'\)\.className/]]) {
    assert.match(js, re, `${what} is in the header's file`);
    assert.doesNotMatch(rest, re, `and not in panel.js: ${what}`);
  }
  assert.match(rest, /drawHeader\(foremanOf\(state\), stale\)/, 'the page\'s render draws the header');
  const lcd = fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'), 'utf8');
  assert.match(lcd, /SpeckLCD/, 'lcd.js is still the screen\'s renderer');
  assert.ok(!declares(lcd, 'drawScreen') && !declares(lcd, 'drawTabs'), 'and nothing moved into it');
});

test('0474 AC1: on the fake page, speck\'s screen, its frame and the tabs still work', async () => {
  const f = { word: 'Needs you 2', tone: 'needs', building: [], ready: [], held: [], blocked: [] };
  const p = fakePage([{ tickets: [], ideas: [], foreman: f, run: { on: true } }]);
  await p.settle();
  assert.match(p.byId('run').title, /^speck: Needs you 2 · /, 'the screen\'s button says the word in its tooltip (0485)');
  assert.equal(p.byId('bezel').className, 'bezel needs', 'the frame\'s edge is in the needs-you colour');
  assert.equal(p.byId('tab-build').attrs['aria-selected'], 'true', 'Build opens with the page');
  p.press(p.byId('tab-plan'));
  assert.equal(p.byId('tab-plan').attrs['aria-selected'], 'true', 'a tab opens on a press');
  assert.equal(p.byId('shaping-section').hidden, false);
  assert.equal(p.byId('build-section').hidden, true);
  assert.equal(p.byId('build-needs').textContent, '2', 'Build\'s tab says how many need you while it is closed');
});

test('0474 AC2: panel.html loads panel-header.js after the page\'s own script, which it uses, and before the pop-ups', () => {
  const tags = pageScripts().map(s => s.src);
  assert.deepEqual(tags, ['panel-model.js', 'lcd.js', 'panel.js', 'panel-header.js', 'panel-popups.js', 'panel-settings.js']);
  assert.match(page(), /<script src="panel-header\.js"><\/script>/, 'an empty tag');
});

test('0474 AC2: the server answers /panel-header.js with the file, as text/javascript, read afresh, and a change to it makes an open page out of date', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    const html = (await request(p.port, { pathName: '/' })).body;
    assert.deepEqual(pageScripts(html).map(s => s.src), pageScripts().map(s => s.src), 'the page it sends loads the same scripts');
    for (const f of STYLE_FILES) assert.ok(html.includes(`href="${f}"`), `the page loads ${f}`);
    const now = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).page;
    const sent = html.match(/data-page="([0-9a-f]{16})"/)[1];
    assert.equal(await now(), sent, 'not out of date before a change');
    const res = await request(p.port, { pathName: '/panel-header.js' });
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/javascript\b/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.body, fs.readFileSync(copy.header, 'utf8'));
    fs.appendFileSync(copy.header, '\n/* changed */\n');
    assert.ok((await request(p.port, { pathName: '/panel-header.js' })).body.endsWith('/* changed */\n'), 'read afresh');
    assert.notEqual(await now(), sent, 'a page sent before panel-header.js changed is out of date');
    const unknown = await request(p.port, { pathName: '/no-such-thing' });
    for (const where of ['/panel-header.js/', '/panel-header.js/../x', '/templates/panel-header.js', '/PANEL-HEADER.JS', '/panel-headers.js']) {
      const r = await request(p.port, { pathName: where });
      assert.deepEqual([r.status, r.body], [unknown.status, unknown.body], where);
    }
    fs.rmSync(copy.header);
    const gone = await request(p.port, { pathName: '/panel-header.js' });
    assert.equal(gone.status, 500);
    assert.match(gone.body, /Couldn't read .*panel-header\.js.*\nPut the file back, then reload\.\n$/, 'a missing file gets a plain message');
  } finally { await stop(p); }
});

test('0474 AC3: the fake page runs panel-header.js from its file, in the page\'s order, without a browser', async () => {
  const p = fakePage([{ tickets: [T('0001', 'building')], ideas: [], page: 'ffffffffffffffff' }]);
  assert.deepEqual(p.scripts, ['panel-model.js', 'lcd.js', 'panel.js', 'panel-header.js', 'panel-popups.js', 'panel-settings.js']);
  await p.settle();
  assert.match(p.byId('run').title, /^speck: Reload page · /, 'a page whose stamp differs says it is out of date');
  assert.match(p.byId('run').title, /newer code/);
});

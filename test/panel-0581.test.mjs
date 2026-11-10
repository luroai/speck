import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, T, fakePage, page, pageScripts, pageScript, headerScript, popupsScript, styles } from './support/panel.mjs';

// ---------- 0581: the LCD screen's renderer, poses, font and tests are gone from the panel ----------

const inRepo = (...p) => path.join(ROOT, ...p);
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' });
const declares = (js, name) => new RegExp(`^(?:async )?(?:const|let|var|function|class) ${name}\\b`, 'm').test(js);
const foreman = (o = {}) => ({ word: 'Building 1', tone: 'ok', mood: 'focused', building: ['0001'], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
const board = () => ({ tickets: [T('0001', 'building')], ideas: [], run: { on: true, pid: 1 }, foreman: foreman() });
// Where the ones the criterion is about could be referred to: everything in the repo apart from the records of the past
// (the design record, the changelog, the release notes, the tickets and ideas) and the tests that say they've gone.
const LIVE = ['--', '.', ':!docs/design/lcd', ':!docs/releases', ':!CHANGELOG.md', ':!speck', ':!test'];
const REMOVED_TESTS = ['support/screen.mjs', 'support/screen-speck.mjs', 'support/watch-rhythm.mjs', ...['0302', '0303', '0304', '0308', '0414', '0436', '0502', '0503', '0504', '0505', '0512'].map(n => `panel-${n}.test.mjs`)].map(f => `test/${f}`);
// Files that lost their LCD-only tests and keep the rest.
const CUT_TESTS = ['panel-0413', 'panel-0446', 'panel-0451', 'panel-0495', 'logo-0320'];
// The files that match, or '' when none do: git grep exits with 1 then.
const refs = (pattern, where) => { try { return git('grep', '-I', '-l', '-E', pattern, ...where).trim(); } catch (e) { if (e.status === 1) return ''; throw e; } };
const ticketFile = () => {
  for (const dir of ['speck/tickets', 'speck/tickets/done']) {
    const name = fs.readdirSync(inRepo(dir)).find(n => n.startsWith('0581-'));
    if (name) return inRepo(dir, name);
  }
  throw new Error('ticket 0581 not found');
};

test('0581 AC1: lcd.js is gone and the page no longer loads it', () => {
  assert.equal(fs.existsSync(inRepo('templates', 'lcd.js')), false, 'templates/lcd.js');
  assert.ok(!pageScripts().some(s => s.src === 'lcd.js'), 'no script tag for it');
  assert.ok(!fakePage([board()]).scripts.includes('lcd.js'), 'and the page runs without it');
});

test('0581 AC1: the header script has no screen, poses, pastimes or naps', () => {
  const js = headerScript();
  for (const name of ['LCD', 'SCREEN', 'screen', 'drawScreen', 'screenFrame', 'capFont', 'watchPose', 'speckPoses', 'SPECK', 'IDLE_MOODS', 'PASTIMES', 'speckDo', 'pickPastime', 'noteBoard', 'speckShown', 'latestMissed', 'speckNow', 'speckRests', 'capCut', 'capIds', 'idsCap']) {
    assert.equal(declares(js, name), false, `panel-header.js no longer has ${name}`);
  }
  assert.doesNotMatch(js, /SpeckLCD|\$\('screen'\)|NAPPING/, 'nothing still reaches for them');
  assert.doesNotMatch(pageScript(), /\bspeckShown\b/, 'nor does the page script');
  assert.ok(declares(js, 'reducedMotion'), 'the lanes\' swipe still asks about reduced motion');
});

test('0581 AC1: the server has no route for lcd.js', () => {
  // The route is a list of names in the server's source, and the file it would read is gone (the first test), so reading
  // the source is enough: a real panel would only repeat what this says.
  assert.doesNotMatch(fs.readFileSync(inRepo('scripts', 'panel.mjs'), 'utf8'), /lcd\.js/);
});

test('0581 AC1: the screen\'s colours are gone, and speck\'s red dot keeps its colour under a name of its own', () => {
  const css = styles();
  assert.doesNotMatch(`${css}${page()}${popupsScript()}`, /--lcd-/, 'no --lcd- colours');
  assert.doesNotMatch(css, /#foreman \.top \.title::before \{[^}]*background: var\(--speck-red\)/, 'the build log\'s dot, gone since 0602');
  assert.ok((css.match(/--speck-red: #/g) || []).length === 2, 'set for both looks');
});

test('0581 AC2: the Doto font and its licence are gone and nothing refers to them', () => {
  assert.equal(fs.existsSync(inRepo('templates', 'fonts', 'Doto.ttf')), false, 'Doto.ttf');
  assert.equal(fs.existsSync(inRepo('templates', 'fonts', 'OFL.txt')), false, 'its licence');
  for (const kept of ['Inter-OFL.txt', 'JetBrainsMono-OFL.txt']) assert.ok(fs.existsSync(inRepo('templates', 'fonts', kept)), `${kept} stays`);
  assert.doesNotMatch(styles(), /Doto/, 'no @font-face');
  assert.doesNotMatch(page() + styles(), /fonts\.(googleapis|gstatic)\.com/, 'and the panel still fetches no fonts from the internet'); // from 0304
  assert.equal(refs('Doto', LIVE), '', 'nothing refers to Doto');
  assert.equal(refs('(^|[^-A-Za-z])OFL\\.txt', LIVE), '', 'nothing refers to its licence file');
});

test('0581 AC3: the LCD-only tests are removed and the Delivery log lists each one', () => {
  const log = fs.readFileSync(ticketFile(), 'utf8').split('## Delivery log')[1] || '';
  for (const f of REMOVED_TESTS) {
    assert.equal(fs.existsSync(inRepo(f)), false, `${f} is removed`);
    assert.ok(log.includes(path.basename(f)), `the Delivery log lists ${path.basename(f)}`);
  }
  for (const f of CUT_TESTS) assert.ok(log.includes(f), `the Delivery log lists what went from ${f}`);
  assert.equal(refs("support/screen\\.mjs|'templates', 'lcd\\.js'", ['--', 'test', ':!test/panel-0581.test.mjs']), '', 'no test still loads the renderer or the screen\'s helpers');
});

test('0581 AC4: the design record in docs/design/lcd/ stays as it is', () => {
  const files = git('ls-files', 'docs/design/lcd').trim().split('\n');
  for (const f of ['concept.html', 'lcd.js', 'panel-mock.html', 'watching.html']) assert.ok(files.includes(`docs/design/lcd/${f}`) && fs.existsSync(inRepo('docs', 'design', 'lcd', f)), f);
  assert.equal(git('status', '--porcelain', '--', 'docs/design/lcd'), '', 'no uncommitted change to it');
  assert.equal(git('diff', '--name-only', 'main...HEAD', '--', 'docs/design/lcd'), '', 'and none on this branch');
});

test('0581 AC5: the bar still shows the status, and hiding and showing the page still works without the screen', async () => {
  const p = fakePage([board()]);
  await p.settle();
  assert.equal(p.byId('bar-word').textContent, 'Building 1', 'the word on the bar');
  assert.equal(p.byId('bezel').className, 'bezel');
  p.document.visibilityState = 'hidden';
  p.document.listeners.visibilitychange({});
  p.document.visibilityState = 'visible';
  p.document.listeners.visibilitychange({});
  await p.settle();
  assert.equal(p.byId('bar-word').textContent, 'Building 1', 'still there when it comes back');
});

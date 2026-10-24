import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SCRIPT, pageScript, popupsScript, headerScript, page, fakePage, T, panelRepo, freePort, startPanel, stop, request, cliCopy } from './support/panel.mjs';

// ---------- 0433: the rest of the page's script in a file of its own ----------

const PAGE_NAMES = ['render', 'connect', 'ticketItem'], POPUP_NAMES = ['openFull', 'renderForeman']; // 0473: the pop-ups' in their own file (0474: and drawScreen in the header's)
const declares = (js, name) => new RegExp(`^(?:async function|function|let|const) ${name}\\b`, 'm').test(js);

test('0433 AC1: the rest of the script is in templates/panel.js, loaded from /panel.js, and panel.html is only markup, the look\'s script and the tags that load the rest', () => {
  assert.equal(SCRIPT, path.join(ROOT, 'templates', 'panel.js'));
  const js = pageScript();
  assert.match(js, /^'use strict';/, 'strict, as it was in the page\'s script');
  assert.doesNotMatch(js, /<\/?script\b/, 'the file is plain JavaScript');
  assert.doesNotMatch(js, /\{\{\w+\}\}/, 'nothing in it is put in by the server, as it is served as it is');
  const html = page();
  for (const name of PAGE_NAMES) {
    assert.ok(declares(js, name), `panel.js has ${name}`);
    assert.ok(!declares(html, name), `panel.html no longer has ${name}`);
  }
  for (const name of POPUP_NAMES) assert.ok(declares(popupsScript(), name) && !declares(html, name), `panel-popups.js has ${name}, and panel.html doesn't`);
  assert.ok(declares(headerScript(), 'drawScreen') && !declares(html, 'drawScreen'), 'panel-header.js has drawScreen, and panel.html doesn\'t'); // 0474
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map(m => m[0]);
  assert.deepEqual(scripts, ['<script id="theme-start">', '<script src="/panel-model.js">', '<script src="/lcd.js">',
    '<script src="/panel.js" data-page="{{page}}" data-token="{{token}}">', '<script src="/panel-header.js">', '<script src="/panel-popups.js">', '<script src="/panel-settings.js">']); // 0473: and its pop-ups', 0474: and its header's
  for (const m of html.matchAll(/<script src="[^"]*"[^>]*>([\s\S]*?)<\/script>/g)) assert.equal(m[1], '', 'each loaded script tag is empty');
  assert.match(html, /<script id="theme-start">[\s\S]*?setLook[\s\S]*?<\/script>/, 'the look is still set before the page is drawn');
  assert.ok(html.split('\n').length < 150, `panel.html has ${html.split('\n').length} lines`);
  assert.match(js, /document\.addEventListener\('DOMContentLoaded', \(\) => \{[\s\S]*connect\(\);\n\}\);\n$/, 'it starts once Settings has loaded too');
});

test('0433 AC2: the server answers /panel.js with the file as text/javascript, read afresh, a change makes an open page out of date, and other paths get the unknown answer', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    const res = await request(p.port, { pathName: '/panel.js' });
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/javascript\b/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.body, fs.readFileSync(copy.script, 'utf8'));
    const html = (await request(p.port, { pathName: '/' })).body;
    const sent = html.match(/<script src="\/panel\.js" data-page="([0-9a-f]{16})" data-token="[0-9a-f]{64}"><\/script>/)[1];
    const now = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).page;
    assert.equal(await now(), sent, 'not out of date before the change');
    fs.appendFileSync(copy.script, '\n// changed\n');
    assert.match((await request(p.port, { pathName: '/panel.js' })).body, /\/\/ changed\n$/, 'read afresh');
    assert.notEqual(await now(), sent, 'a page sent before the change is out of date');
    const unknown = await request(p.port, { pathName: '/no-such-thing' });
    for (const where of ['/panel.html', '/panel.js/../x', '/panel.js/', '/templates/panel.js', '/PANEL.JS']) {
      const r = await request(p.port, { pathName: where });
      assert.deepEqual([r.status, r.body], [unknown.status, unknown.body], where);
    }
    fs.rmSync(copy.script);
    const gone = await request(p.port, { pathName: '/panel.js' });
    assert.equal(gone.status, 500);
    assert.match(gone.body, /Couldn't read .*panel\.js.*\nPut the file back, then reload\.\n$/, 'a missing file gets a plain message');
  } finally { await stop(p); }
});

test('0433 AC2: a page whose stamp differs from the server\'s says it is out of date and offers to reload', async () => {
  const p = fakePage([{ tickets: [T('0001', 'ready')], ideas: [], page: 'ffffffffffffffff' }]);
  await p.settle();
  assert.match(p.byId('run').attrs['aria-label'], /^The Foreman: Reload page/);
});

test('0433 AC3: the fake page runs the page\'s script from its file, with the stamp and token from its tag, and draws the board', async () => {
  const p = fakePage([{ tickets: [T('0007', 'ready')], ideas: [], page: '{{page}}' }]);
  await p.settle();
  assert.match(p.byId('queue').textContent, /Ticket 0007/);
  assert.doesNotMatch(p.byId('run').attrs['aria-label'], /Reload page/, 'its stamp is the one on its tag');
});

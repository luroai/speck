import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SETTINGS, settingsScript, pageScript, page, fakePage, panelRepo, freePort, startPanel, stop, request, cliCopy } from './support/panel.mjs';

// ---------- 0432: the Settings view's script in a file of its own ----------

const SETTINGS_NAMES = ['openSettings', 'loadSettings', 'renderSettings', 'redrawSettings', 'settingEditor', 'roleEditor', 'toggleGroup',
  'drawAgents', 'leaveSettings', 'renderLeaving', 'closeSettings', 'saveSettings', 'sendSettings', 'chooseLook', 'settingsView', 'lookButtons'];
const declares = (js, name) => new RegExp(`^(?:async function|function|let|const) ${name}\\b`, 'm').test(js);

test('0432 AC1: the Settings script is in templates/panel-settings.js, which the page loads from /panel-settings.js, and panel.html no longer has it', () => {
  assert.equal(SETTINGS, path.join(ROOT, 'templates', 'panel-settings.js'));
  const js = settingsScript();
  assert.match(js, /^'use strict';/, 'strict, as it was in the page\'s script');
  assert.doesNotMatch(js, /<\/?script\b/, 'the file is plain JavaScript');
  const html = page();
  for (const name of SETTINGS_NAMES) {
    assert.ok(declares(js, name), `panel-settings.js has ${name}`);
    assert.ok(!declares(html, name), `panel.html no longer has ${name}`);
  }
  assert.doesNotMatch(html, /\$\('settings-open'\)\.addEventListener/, 'its button is wired up in its own file');
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map(m => m[0]);
  assert.deepEqual(scripts, ['<script id="theme-start">', '<script src="/panel-model.js">', '<script src="/lcd.js">', '<script src="/panel.js" data-page="{{page}}" data-token="{{token}}">',
    '<script src="/panel-popups.js">', '<script src="/panel-settings.js">'], 'after the page\'s own script, which it uses (0433: which it loads from /panel.js, 0473: and its pop-ups\')');
  // 0433: the page starts once it has all loaded, Settings included.
  assert.match(pageScript(), /document\.addEventListener\('DOMContentLoaded', \(\) => \{[\s\S]*connect\(\);\n\}\);\n$/, 'the page starts only once Settings is in');
});

test('0432 AC1: the fake page runs Settings from its own file: it opens, draws its groups and closes', async () => {
  const groups = [{ title: 'Building', settings: [{ key: 'max_parallel_builds', value: 4, default: false, explain: 'How many at once.', editable: true }] }];
  const fetch = async url => ({ ok: true, status: 200, json: async () => (String(url).startsWith('/api/settings') ? { groups } : { tickets: [], ideas: [], resume_command: '' }) });
  const p = fakePage([], { fetch });
  await p.settle();
  p.press(p.byId('settings-open'));
  await p.settle();
  assert.equal(p.byId('settings').hidden, false, 'Settings opens');
  assert.match(p.byId('settings').textContent, /Appearance[\s\S]*Auto-build[\s\S]*Building[\s\S]*max_parallel_builds/);
  p.key('Escape');
  assert.equal(p.byId('settings').hidden, true, 'and closes');
});

test('0432 AC2: the server answers /panel-settings.js with the file as text/javascript, read afresh, a change makes an open page out of date, and other paths get the unknown answer', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    const res = await request(p.port, { pathName: '/panel-settings.js' });
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/javascript\b/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.body, fs.readFileSync(copy.settings, 'utf8'));
    const sent = (await request(p.port, { pathName: '/' })).body.match(/data-page="([0-9a-f]{16})"/)[1];
    const now = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).page;
    assert.equal(await now(), sent, 'not out of date before the change');
    fs.appendFileSync(copy.settings, '\n// changed\n');
    assert.match((await request(p.port, { pathName: '/panel-settings.js' })).body, /\/\/ changed\n$/, 'read afresh');
    assert.notEqual(await now(), sent, 'a page sent before the change is out of date');
    const unknown = await request(p.port, { pathName: '/no-such-thing' });
    for (const where of ['/panel.html', '/panel-settings.js/../x', '/panel-settings.js/', '/templates/panel-settings.js', '/PANEL-SETTINGS.JS']) {
      const r = await request(p.port, { pathName: where });
      assert.deepEqual([r.status, r.body], [unknown.status, unknown.body], where);
    }
    fs.rmSync(copy.settings);
    const gone = await request(p.port, { pathName: '/panel-settings.js' });
    assert.equal(gone.status, 500);
    assert.match(gone.body, /Couldn't read .*panel-settings\.js.*\nPut the file back, then reload\.\n$/, 'a missing file gets a plain message');
  } finally { await stop(p); }
});

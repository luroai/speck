import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { STYLES, page, panelRepo, freePort, startPanel, stop, request, cliCopy } from './support/panel.mjs';

// ---------- 0430: the panel's styles in a file of their own ----------

test('0430 AC1: the styles are in templates/panel.css, and panel.html loads them from /panel.css with no <style> of its own', () => {
  const css = fs.readFileSync(STYLES, 'utf8');
  assert.match(css, /:root \{/, 'the styles start with the light look\'s colours');
  assert.match(css, /:root\[data-theme="dark"\] \{/, 'and have the dark look');
  assert.doesNotMatch(css, /<\/?style>/, 'the file is plain CSS');
  const html = page();
  assert.doesNotMatch(html, /<style\b/i);
  assert.match(html, /<link rel="stylesheet" href="\/panel\.css">/);
  assert.ok(html.indexOf('/panel.css') < html.indexOf('</head>'), 'loaded in the head, before the page shows');
});

test('0430 AC2: the server answers /panel.css with the file as text/css, read afresh, a change makes an open page out of date, and other paths get the unknown answer', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    const res = await request(p.port, { pathName: '/panel.css' });
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/css\b/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.body, fs.readFileSync(copy.styles, 'utf8'));
    const sent = (await request(p.port, { pathName: '/' })).body.match(/const PAGE = '([0-9a-f]{16})';/)[1];
    const now = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).page;
    assert.equal(await now(), sent, 'not out of date before the change');
    fs.appendFileSync(copy.styles, '\n/* changed */\n');
    assert.match((await request(p.port, { pathName: '/panel.css' })).body, /\/\* changed \*\/\n$/, 'read afresh');
    assert.notEqual(await now(), sent, 'a page sent before the change is out of date');
    const unknown = await request(p.port, { pathName: '/no-such-thing' });
    for (const where of ['/panel.html', '/panel.css/../x', '/panel.css/', '/templates/panel.css', '/PANEL.CSS']) {
      const r = await request(p.port, { pathName: where });
      assert.deepEqual([r.status, r.body], [unknown.status, unknown.body], where);
    }
  } finally { await stop(p); }
});

test('0430 AC2: a missing panel.css gets a plain message saying what to do, not a stack trace', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    fs.rmSync(copy.styles);
    const res = await request(p.port, { pathName: '/panel.css' });
    assert.equal(res.status, 500);
    assert.match(res.body, /Couldn't read .*panel\.css.*\nPut the file back, then reload\.\n$/);
  } finally { await stop(p); }
});

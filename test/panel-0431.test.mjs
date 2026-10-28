import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, MODEL, model, page, panelModel, fakePage, T, panelRepo, freePort, startPanel, stop, request, cliCopy } from './support/panel.mjs';

// ---------- 0431: the panel's model in a file of its own ----------

test('0431 AC1: the model is in templates/panel-model.js, which the page loads before its own script, and panel.html no longer has it', () => {
  const js = model();
  assert.match(js, /^'use strict';/, 'strict, as it was in the page\'s script');
  for (const name of ['IN_FLIGHT', 'progress', 'panelModel', 'logText']) assert.match(js, new RegExp(`(?:const|function) ${name}\\b`), name);
  assert.doesNotMatch(js, /<\/?script\b/, 'the file is plain JavaScript');
  assert.doesNotMatch(js, /\bdocument\.|\bwindow\./, 'no DOM');
  const html = page();
  assert.doesNotMatch(html, /---- model|---- end model/);
  assert.doesNotMatch(html, /function panelModel\(|function progress\(|const IN_FLIGHT\b/);
  const at = html.indexOf('<script src="panel-model.js"></script>');
  assert.ok(at > 0, 'the page loads /panel-model.js');
  assert.ok(at < html.indexOf('<script src="panel.js"'), 'before the rest of its script (0433: which it loads from /panel.js)');
});

test('0431 AC2: the server answers /panel-model.js with the file as text/javascript, read afresh, a change makes an open page out of date, and other paths get the unknown answer', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    const res = await request(p.port, { pathName: '/panel-model.js' });
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/javascript\b/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal(res.body, fs.readFileSync(copy.model, 'utf8'));
    const sent = (await request(p.port, { pathName: '/' })).body.match(/data-page="([0-9a-f]{16})"/)[1];
    const now = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body).page;
    assert.equal(await now(), sent, 'not out of date before the change');
    fs.appendFileSync(copy.model, '\n// changed\n');
    assert.match((await request(p.port, { pathName: '/panel-model.js' })).body, /\/\/ changed\n$/, 'read afresh');
    assert.notEqual(await now(), sent, 'a page sent before the change is out of date');
    const unknown = await request(p.port, { pathName: '/no-such-thing' });
    for (const where of ['/panel.html', '/panel-model.js/../x', '/panel-model.js/', '/templates/panel-model.js', '/PANEL-MODEL.JS']) {
      const r = await request(p.port, { pathName: where });
      assert.deepEqual([r.status, r.body], [unknown.status, unknown.body], where);
    }
  } finally { await stop(p); }
});

test('0431 AC2: a missing panel-model.js gets a plain message saying what to do, not a stack trace', async () => {
  const { dir } = panelRepo();
  const copy = cliCopy();
  const p = await startPanel(dir, ['--port', String(await freePort())], copy.cli);
  try {
    fs.rmSync(copy.model);
    const res = await request(p.port, { pathName: '/panel-model.js' });
    assert.equal(res.status, 500);
    assert.match(res.body, /Couldn't read .*panel-model\.js.*\nPut the file back, then reload\.\n$/);
  } finally { await stop(p); }
});

test('0431 AC3: the model runs on its own from panel-model.js, without panel.html or a browser', () => {
  const real = fs.readFileSync;
  const read = [];
  fs.readFileSync = (f, ...rest) => { read.push(String(f)); return real(f, ...rest); };
  let m;
  try { m = panelModel()({ tickets: [T('0001', 'ready')], ideas: [] }); } finally { fs.readFileSync = real; }
  assert.ok(read.includes(MODEL), 'read from panel-model.js');
  assert.ok(!read.some(f => path.basename(f) === 'panel.html'), 'without reading panel.html');
  assert.ok(m && typeof m === 'object');
  assert.equal(MODEL, path.join(ROOT, 'templates', 'panel-model.js'));
  const logText = vm.runInNewContext(`${model()}\nlogText`, {});
  assert.equal(logText(null), 'No log yet.');
});

test('0431 AC3: no test cuts the model out of panel.html any more', () => {
  const dir = path.join(ROOT, 'test');
  const files = [...fs.readdirSync(dir).map(f => path.join(dir, f)), ...fs.readdirSync(path.join(dir, 'support')).map(f => path.join(dir, 'support', f))]
    .filter(f => /\.m?js$/.test(f) && f !== path.join(dir, 'panel-0431.test.mjs'));
  const cutting = files.filter(f => /---- (end )?model/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(cutting.map(f => path.relative(ROOT, f)), []);
});

test('0431 AC4: the fake page still runs the whole page, model included', async () => {
  const p = fakePage([{ tickets: [T('0001', 'ready', { title: 'Hello' })], ideas: [] }]);
  await new Promise(r => setTimeout(r, 30));
  assert.match(p.byId('queue').textContent + p.byId('shaping').textContent, /Hello/);
});

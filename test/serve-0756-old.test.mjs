// 0756: a project on an older speck, from 1.5.0 on, runs under speck serve on its own copy of speck, and is listed and
// switched to like any other. This runs real panels: a project set up by speck 1.5.0 itself, which speck serve starts,
// beside one on this speck, started by hand, whose project menu lists it and switches to it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { panelRepo, freePort, startPanel, stop } from './support/panel.mjs';
import { CLI, machine, oldProject, addProject, startServe, until, portOf, getJson, readJson, endServe, argsOf } from './support/serve.mjs';
import { speck } from './support/cli.mjs';

// A request as a page at the panel's address sends it: its Host, and an Origin and cookie when given.
function ask(port, { method = 'GET', pathName = '/', origin, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Host: `127.0.0.1:${port}`, ...(origin ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}) };
    const req = http.request({ host: '127.0.0.1', port, method, path: pathName, headers }, res => {
      let body = '';
      res.setEncoding('utf8').on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.setTimeout(15000, () => req.destroy(new Error(`no answer to ${method} ${pathName}`)));
    req.on('error', reject);
    req.end();
  });
}

test('0756 AC4: a project on speck 1.5.0 runs under speck serve on its own copy, and is listed and switched to like any other', async () => {
  const m = machine(), old = oldProject('1.5.0'), now = panelRepo({ prefix: 'speck-now-' });
  const oldName = path.basename(old), nowDir = fs.realpathSync(now.dir);
  assert.equal(fs.readFileSync(path.join(old, '.speck', 'VERSION'), 'utf8').trim(), '1.5.0');
  addProject(m, old); addProject(m, nowDir);
  const panel = await startPanel(nowDir, ['--port', String(await freePort())], CLI, { SPECK_PANELS_DIR: m.panels, SPECK_HOME_SETTINGS_DIR: m.settings });
  const s = startServe(m);
  try {
    const port = await until(`${oldName}'s address`, () => portOf(s.out(), oldName), 30000);
    assert.equal((await getJson(port, '/api/panel'))?.repo, old, 'its panel answers for it');
    // On its own copy: the panel speck serve started runs the project's own .speck/scripts/speck.mjs.
    const started = readJson(m.record).panels.find(p => p.folder === old);
    assert.ok(argsOf(started.pid).includes(path.join(old, '.speck', 'scripts', 'speck.mjs')), argsOf(started.pid));
    // Listed: speck projects shows it on 1.5.0 with its panel running, and this speck's panel lists it in its project menu.
    const listed = speck(os.tmpdir(), m.env, 'projects').stdout;
    assert.match(listed, new RegExp(`${oldName}\\s+${old}\\s+speck 1\\.5\\.0 · panel running on port ${port}`));
    const menu = await until('the project menu listing it', async () => JSON.parse((await ask(panel.port, { pathName: '/api/state' })).body).projects?.list.find(p => p.port === port));
    assert.equal(menu.name, oldName);
    // Switched to: choosing it at this panel's address shows its panel there, with its own page and board.
    const chose = await ask(panel.port, { method: 'POST', pathName: `/api/projects/${port}`, origin: `http://127.0.0.1:${panel.port}` });
    assert.equal(chose.status, 200, chose.body);
    const cookie = String([].concat(chose.headers['set-cookie'])[0]).split(';')[0];
    assert.equal(JSON.parse((await ask(panel.port, { pathName: '/api/panel', cookie })).body).repo, old);
    const page = await ask(panel.port, { cookie });
    assert.equal(page.status, 200);
    assert.ok(page.body.includes(oldName), 'its own page');
    assert.equal(JSON.parse((await ask(panel.port, { pathName: '/api/state', cookie })).body).projects.self, port, 'its own board');
  } finally { await endServe(s); await stop(panel); }
});

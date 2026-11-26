import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0757: a real project's panel behind speck serve's address, started in this process, for what only a real panel
// does: its own key, Origin and Host checks on each write. serve-front-0757.test.mjs checks the rest with stand-ins.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, startPanel, freePort, stop, tokenOf, request, fakePage } from './support/panel.mjs';
import { startFront } from '../scripts/serve-front.mjs';
import { panelUrl } from '../scripts/panel-url.mjs';
import { ask, cookieOf, setCookieOf, panelsHere } from './support/serve-front.mjs';
import { oldProject } from './support/serve.mjs';

const URL_HOST = 'speck.example.ts.net', URL_ORIGIN = `https://${URL_HOST}`;
// The project's repo is a speck-keep-* folder, so it lasts while the file's tests run, as its panel does.
let r, p, f, token, cfg;
before(async () => {
  r = panelRepo({ prefix: 'speck-keep-front-' });
  cfg = path.join(r.dir, 'speck', 'config.yml');
  p = await startPanel(r.dir, ['--port', String(await freePort())]);
  token = tokenOf((await request(p.port)).body);
  f = await startFront({ port: 0, url: panelUrl(['--url', URL_ORIGIN]), projects: () => [{ folder: r.dir, name: path.basename(r.dir), port: p.port }] });
});
after(async () => { if (f) f.close(); if (p) await stop(p); });

test('0757 AC3: a real project\'s panel works through the address as on its own port: its key, set ready, priority, an answer, ship, the run switch, Settings and the live updates', async () => {
  for (const [origin, host, rounds] of [[`http://127.0.0.1:${f.port}`, undefined, 4], [URL_ORIGIN, URL_HOST, 5]]) {
    const cookie = cookieOf(await ask(f.port, { method: 'POST', pathName: `/api/projects/${p.port}`, origin, host }));
    assert.match(cookie, /^speck-serve-\d+=\d+$/, `chosen from ${origin}`);
    assert.equal(tokenOf((await ask(f.port, { pathName: '/project/', host, cookie })).body), token, 'its page, with its own panel\'s key');
    const post = (pathName, body, key = token) => ask(f.port, { method: 'POST', pathName, origin, host, cookie, token: key, body });
    const ticket = () => fs.readFileSync(r.file, 'utf8');
    // Back to Plan, its priority and Set ready, each committed in the project as from the panel's own port.
    let w = await post('/api/tickets/1/draft');
    assert.equal(w.status, 200, w.body);
    assert.match(ticket(), /^status: draft/m);
    w = await post('/api/tickets/1/priority/4');
    assert.equal(w.status, 200, w.body);
    assert.match(ticket(), /^priority: 4/m);
    w = await post('/api/tickets/1/ready');
    assert.equal(w.status, 200, w.body);
    assert.match(ticket(), /^status: ready/m);
    // An answer, a ship and the run switch reach the panel, which answers each as its own, not as Forbidden.
    w = await post('/api/foreman/1/answer', JSON.stringify({ text: 'Go with blue.' }));
    assert.equal(w.status, 409, w.body);
    assert.doesNotMatch(JSON.parse(w.body).error, /Forbidden/);
    w = await post('/api/tickets/1/ship');
    assert.equal(w.status, 409, w.body);
    assert.match(JSON.parse(w.body).error, /0001/, 'speck ship\'s own refusal, for a ticket that isn\'t approved');
    w = await post('/api/run/off');
    assert.equal(w.status, 409);
    assert.equal(JSON.parse(w.body).error, 'speck run is off already.');
    // Settings: read, and a change saved and committed.
    assert.equal((await ask(f.port, { pathName: '/api/settings?quick=1', host, cookie })).status, 200);
    w = await post(`/api/settings/save?repo%3Alimits.max_review_rounds=${rounds}`);
    assert.equal(w.status, 200, w.body);
    assert.match(fs.readFileSync(cfg, 'utf8'), new RegExp(`^  max_review_rounds: ${rounds}\\b`, 'm'));
    // Its live updates.
    const events = await ask(f.port, { pathName: '/api/events', host, cookie, firstChunk: true });
    if (events.req) events.req.destroy();
    assert.equal(events.status, 200);
    assert.match(events.headers['content-type'], /^text\/event-stream/);
    // Without its key, or with another's, a write is refused, as on its own port.
    assert.equal((await post('/api/tickets/1/draft', undefined, null)).status, 403);
    assert.equal((await post('/api/tickets/1/draft', undefined, 'f'.repeat(64))).status, 403);
    assert.match(ticket(), /^status: ready/m);
  }
});

test('0757 AC2: a project on an older speck, its panel the only one running, has its own project menu at the address, with All projects', async () => {
  const old = oldProject('1.6.1'), name = path.basename(old), dir = panelsHere(), templates = path.join(old, '.speck', 'templates');
  assert.equal(fs.readFileSync(path.join(old, '.speck', 'VERSION'), 'utf8').trim(), '1.6.1');
  // Its own panel, on its own copy, the only project's panel whose record is where this address looks.
  const op = await startPanel(old, ['--port', String(await freePort())], path.join(old, '.speck', 'scripts', 'speck.mjs'), { SPECK_PANELS_DIR: dir });
  const g = await startFront({ port: 0, env: { ...process.env, SPECK_PANELS_DIR: dir }, projects: () => [{ folder: old, name, port: op.port }, { folder: '/nowhere/gone', name: 'gone', port: null }] });
  try {
    const origin = `http://127.0.0.1:${g.port}`;
    const listed = JSON.parse((await ask(g.port, { method: 'POST', pathName: '/api/projects/summary', origin })).body);
    assert.deepEqual(listed.projects.map(p => [p.name, p.running]), [['gone', false], [name, true]], 'All projects has it, and the project that isn\'t answering');
    const cookie = cookieOf(await ask(g.port, { method: 'POST', pathName: `/api/projects/${op.port}`, origin }));
    const page = await ask(g.port, { pathName: '/project/', cookie });
    assert.ok(page.body.includes(`<span class="repo">${name}</span>`), 'its own page');
    assert.doesNotMatch(page.body, /speck-serve/, 'on 1.6.1, which knows nothing of speck serve');
    assert.equal((await ask(g.port, { pathName: '/project/panel-header.js', cookie })).body, fs.readFileSync(path.join(templates, 'panel-header.js'), 'utf8'), 'with its own copy\'s files');
    // Its panel counts the address among the panels running, so its board has the project menu's list.
    let board = null;
    for (const until = Date.now() + 10000; Date.now() < until; await new Promise(r => setTimeout(r, 200))) {
      board = JSON.parse((await ask(g.port, { pathName: '/api/state', cookie })).body);
      if (board.projects) break;
    }
    assert.deepEqual(board.projects.list.map(p => p.name).sort(), [name, 'speck serve'].sort());
    // 1.6.1's own page, given those answers: its menu is on the bar, All projects first, which opens its bridge with
    // the address's projects; and the address's own entry goes to All projects at the address.
    let reloaded = 0;
    const p = fakePage([board, listed, { ok: true }], { location: { reload: () => { reloaded++; } } }, { templates });
    await p.settle();
    assert.equal(p.byId('project-pick').hidden, false, 'its menu is there');
    assert.deepEqual(p.byId('project').children.map(o => o.textContent).sort(), ['All projects', name, 'speck serve'].sort());
    assert.equal(p.byId('project').children[0].textContent, 'All projects');
    p.byId('project').value = 'all';
    p.byId('project').listeners.change();
    await p.settle();
    assert.equal(p.byId('bridge').hidden, false, 'All projects opens');
    const names = [], walk = n => { if (/\bbridge-name\b/.test(String(n.className || ''))) names.push(n.textContent); for (const c of n.children || []) walk(c); };
    walk(p.byId('bridge'));
    assert.ok(names.includes(name), `with its project: ${names}`);
    p.byId('project').value = String(g.port);
    p.byId('project').listeners.change();
    await p.settle();
    assert.equal(p.calls.at(-1).url, `/api/projects/${g.port}`);
    assert.equal(reloaded, 1, 'and the page reloads');
    const home = await ask(g.port, { method: 'POST', pathName: `/api/projects/${g.port}`, origin, cookie });
    assert.match(setCookieOf(home), /Max-Age=0/, 'the address forgets the choice');
    assert.equal((await ask(g.port, { pathName: '/project/' })).headers.location, '/', 'so the reload goes to All projects');
    assert.match((await ask(g.port, { cookie })).body, /<meta name="speck-serve" id="speck-serve" content="1">/, 'as do Back and the address itself');
  } finally { g.close(); await stop(op); }
});

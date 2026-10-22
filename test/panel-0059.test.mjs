import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, cliCopy, freePort, startPanel, stop, request, post, tokenOf, readyPath, fm } from './support/panel.mjs';

// ---------- 0059: page changes show on a browser reload ----------

async function served() {
  const r = panelRepo();
  const c = cliCopy();
  const p = await startPanel(r.dir, ['--port', String(await freePort())], c.cli);
  const { port } = p;
  return { r, c, port, p };
}

test('0059 AC1: editing panel.html while the panel runs shows on the next request to /, with repo, base and token filled in', async () => {
  const { r, c, port, p } = await served();
  try {
    const before = await request(port);
    assert.equal(before.status, 200);
    assert.doesNotMatch(before.body, /EDITED-0059/);
    fs.writeFileSync(c.page, fs.readFileSync(c.page, 'utf8').replace('<body>', '<body><p id="edited">EDITED-0059</p>'));
    const after = await request(port);
    assert.equal(after.status, 200);
    assert.match(after.headers['content-type'], /text\/html/);
    assert.match(after.body, /EDITED-0059/);
    assert.match(after.body, /<div class="repo">base <code>main<\/code><\/div>/); // 0373: the base branch, without the project
    assert.doesNotMatch(after.body, new RegExp(`<code>${path.basename(r.dir)}</code>`));
    assert.match(after.body, /const TOKEN = '[0-9a-f]{64}';/);
    assert.doesNotMatch(after.body, /\{\{(repo|base|token)\}\}/);
  } finally { await stop(p); }
});

test('0059 AC1: a page with $ patterns in it is served as written', async () => {
  const { port, p, c } = await served();
  try {
    fs.writeFileSync(c.page, '<p>{{repo}} $& $1 $$ {{base}} {{token}}</p>');
    const body = (await request(port)).body;
    assert.match(body, /^<p>[^{}]+ \$& \$1 \$\$ main [0-9a-f]{64}<\/p>$/);
  } finally { await stop(p); }
});

test('0059 AC2: the token is the same across reloads and edits, and Set ready works with a token from before or after the edit', async () => {
  const { r, c, port, p } = await served();
  try {
    r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
    r.write('0003-three.md', fm({ id: '"0003"', title: 'Three' }));
    const t1 = tokenOf((await request(port)).body);
    assert.ok(t1);
    assert.equal(tokenOf((await request(port)).body), t1, 'same token on a plain reload');
    fs.writeFileSync(c.page, fs.readFileSync(c.page, 'utf8').replace('<body>', '<body><!-- edited -->'));
    const t2 = tokenOf((await request(port)).body);
    assert.equal(t2, t1, 'same token after the page is edited');
    const a = await post(port, readyPath('0002'), { token: t1 });
    assert.equal(a.status, 200, a.body);
    const b = await post(port, readyPath('0003'), { token: t2 });
    assert.equal(b.status, 200, b.body);
  } finally { await stop(p); }
});

test('0059 AC3: with panel.html missing, / gives a plain-text 500 naming the file, the server keeps running and comes back when it returns', async () => {
  const { r, c, port, p } = await served();
  try {
    const original = fs.readFileSync(c.page, 'utf8');
    fs.rmSync(c.page);
    const res = await request(port);
    assert.equal(res.status, 500);
    assert.match(res.headers['content-type'], /text\/plain/);
    assert.ok(res.body.includes(c.page), `names the file: ${res.body}`);
    assert.doesNotMatch(res.body, /\n\s+at /, 'no stack trace');
    const api = await request(port, { pathName: '/api/state' });
    assert.equal(api.status, 200);
    const { foreman, ...board } = JSON.parse(api.body); // 0285: the Foreman's status, which the board doesn't have
    assert.equal(typeof foreman.word, 'string');
    assert.deepEqual(board, JSON.parse(r.run('status', '--json').stdout));
    assert.equal(p.child.exitCode, null, 'still running');
    fs.writeFileSync(c.page, original);
    const back = await request(port);
    assert.equal(back.status, 200);
    assert.ok(tokenOf(back.body));
  } finally { await stop(p); }
});

test('0059 AC3: panel.html being a folder also gives a plain-text 500 naming the file', async () => {
  const { c, port, p } = await served();
  try {
    fs.rmSync(c.page);
    fs.mkdirSync(c.page);
    const res = await request(port);
    assert.equal(res.status, 500);
    assert.match(res.headers['content-type'], /text\/plain/);
    assert.ok(res.body.includes(c.page));
    assert.equal((await request(port, { pathName: '/api/state' })).status, 200);
  } finally { await stop(p); }
});

test('0059 AC4: /api/state reads afresh, and the page asks for it when the panel says the board changed, not on a timer (0187)', async () => {
  const { r, port, p } = await served();
  try {
    const first = JSON.parse((await request(port, { pathName: '/api/state' })).body);
    r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
    const second = JSON.parse((await request(port, { pathName: '/api/state' })).body);
    assert.equal(second.tickets.length, first.tickets.length + 1);
    const html = (await request(port)).body;
    assert.match(html, /new EventSource\('\/api\/events'\)/);
    assert.doesNotMatch(html, /POLL_MS/);
  } finally { await stop(p); }
});

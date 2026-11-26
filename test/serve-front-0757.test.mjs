import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0757: speck serve's one address, started in this process with stand-in panels, so nothing waits for a real one.
// serve-0757.test.mjs runs speck serve itself, and serve-front-panel-0757.test.mjs a real panel behind the address.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { startFront, serveAddress, addressText } from '../scripts/serve-front.mjs';
import { panelUrl } from '../scripts/panel-url.mjs';
import { SpeckError } from '../scripts/core.mjs';
import { runningPanels } from '../scripts/panel-projects.mjs';
import { ROOT } from './support/panel.mjs';
import { panelsHere, standInPanel, ask, cookieOf, setCookieOf } from './support/serve-front.mjs';

const URL_HOST = 'speck.example.ts.net', URL_ORIGIN = `https://${URL_HOST}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
// The address, on a free port, with `list` as speck serve's projects (a function, so a test can change it) and the
// records of running panels in `dir`. `t` stops it when the test ends.
async function front(t, dir, list = () => [], url = panelUrl(['--url', URL_ORIGIN])) {
  const f = await startFront({ port: 0, url, env: { ...process.env, SPECK_PANELS_DIR: dir }, projects: typeof list === 'function' ? list : () => list });
  t.after(() => f.close());
  return { ...f, origin: `http://127.0.0.1:${f.port}` };
}
async function panel(t, dir, name, opts) {
  const p = await standInPanel(dir, name, opts);
  t.after(() => p.stop());
  return p;
}
const choose = (f, to, origin = f.origin, host) => ask(f.port, { method: 'POST', pathName: `/api/projects/${to}`, origin, host });
const summary = (f, origin = f.origin) => ask(f.port, { method: 'POST', pathName: '/api/projects/summary', origin });
const panelIdOf = html => (html.match(/<meta name="speck-panel" id="speck-panel" content="([0-9a-f]{16})">/) || [])[1];

// ---------- AC1: one port and one --url, with a panel's Host and Origin checks ----------

test('0757 AC1: speck serve\'s address is 127.0.0.1:4777 unless --port gives another, and --url is checked as a panel\'s', () => {
  assert.deepEqual(serveAddress([]), { port: 4777, url: null });
  assert.deepEqual(serveAddress(['--port', '4801', '--url', URL_ORIGIN]), { port: 4801, url: { origin: URL_ORIGIN, host: URL_HOST } });
  assert.deepEqual(serveAddress(['--port=4802', `--url=${URL_ORIGIN}/`]), { port: 4802, url: { origin: URL_ORIGIN, host: URL_HOST } });
  assert.throws(() => serveAddress(['--port', 'abc']), /--port must be a whole number from 1 to 65535 \(got "abc"\)/);
  assert.throws(() => serveAddress(['--port', '70000']), /--port must be a whole number from 1 to 65535/);
  assert.throws(() => serveAddress(['--url', 'http://speck.example.ts.net']), /--url must be an https:\/\/ address with only a hostname/);
  assert.equal(addressText(4777, null), 'http://127.0.0.1:4777/');
  assert.equal(addressText(4777, URL_ORIGIN), `http://127.0.0.1:4777/ and ${URL_ORIGIN}/`);
});

test('0757 AC1: it answers on 127.0.0.1 at its port and at --url\'s address, and to no other Host', async t => {
  const f = await front(t, panelsHere());
  for (const host of [`127.0.0.1:${f.port}`, `localhost:${f.port}`, URL_HOST, URL_HOST.toUpperCase()]) {
    const r = await ask(f.port, { host });
    assert.equal(r.status, 200, `${host} is served`);
    assert.match(r.headers['content-type'], /^text\/html/);
  }
  for (const host of [`evil.example:${f.port}`, `127.0.0.1:${f.port + 1}`, `${URL_HOST}:443`, 'evil.example', `127.0.0.1.evil.example:${f.port}`]) {
    const r = await ask(f.port, { host });
    assert.equal(r.status, 403, `${host} is refused`);
    assert.match(r.body, /^Forbidden: open the panel at 127\.0\.0\.1 or localhost\./);
  }
  // Without --url, its address isn't served.
  const bare = await front(t, panelsHere(), [], null);
  assert.equal((await ask(bare.port, { host: URL_HOST })).status, 403);
});

test('0757 AC1: only a page at the address can choose a project or read the projects, as its Origin says', async t => {
  const dir = panelsHere(), f = await front(t, dir), a = await panel(t, dir, 'alpha');
  for (const origin of [null, 'https://evil.example', `http://127.0.0.1:${a.port}`, `http://127.0.0.1:${f.port + 1}`]) { // null: none
    const c = await choose(f, a.port, origin);
    assert.equal(c.status, 403, `choosing with Origin ${origin}`);
    assert.equal(c.headers['set-cookie'], undefined);
    assert.equal((await summary(f, origin)).status, 403, `the projects with Origin ${origin}`);
  }
  assert.equal((await ask(f.port, { pathName: `/api/projects/${a.port}` })).status, 405, 'a choice is a POST');
  assert.equal((await ask(f.port, { pathName: '/api/projects/summary' })).status, 405);
  for (const [origin, host] of [[f.origin, undefined], [`http://localhost:${f.port}`, `localhost:${f.port}`], [URL_ORIGIN, URL_HOST]]) {
    assert.equal((await choose(f, a.port, origin, host)).status, 200, `choosing from ${origin}`);
    assert.equal((await ask(f.port, { method: 'POST', pathName: '/api/projects/summary', origin, host })).status, 200, `the projects from ${origin}`);
  }
});

test('0757 AC1: a port that\'s already taken is refused in a plain message', async () => {
  const busy = http.createServer((req, res) => res.end('mine'));
  await new Promise(r => busy.listen(0, '127.0.0.1', r));
  try {
    const port = busy.address().port;
    await assert.rejects(startFront({ port, projects: () => [] }), e => e.name === 'SpeckError'
      && e.message === `Port ${port} is already in use, so speck serve didn't start. Stop whatever is using it, or give speck serve another port with --port <n>.`);
  } finally { busy.close(); }
});

// ---------- AC2: it opens on All projects, and choosing one shows that project's panel there ----------

test('0757 AC2: the address opens on All projects: the panel\'s own page, marked as speck serve\'s, with no project or key of its own', async t => {
  const f = await front(t, panelsHere());
  const r = await ask(f.port);
  assert.equal(r.status, 200);
  assert.match(r.body, /<meta name="speck-serve" id="speck-serve" content="1">/, 'it says it\'s speck serve\'s own page');
  assert.match(r.body, /<span class="repo">All projects<\/span>/);
  assert.match(r.body, /data-token=""/, 'with no key, so nothing can be changed from it but which project shows');
  assert.ok(!r.body.includes('{{'), 'every placeholder filled in');
  const id = panelIdOf(r.body);
  assert.ok(id, 'with an id of its own');
  assert.equal(r.headers['x-speck-panel'], id);
  assert.equal(r.headers['x-speck-serve'], '1');
  // The page's files, from this copy of speck, as a panel serves them.
  for (const [file, type] of [['panel.js', /^text\/javascript/], ['panel-header.js', /^text\/javascript/], ['panel-base.css', /^text\/css/], ['speck-face.js', /^text\/javascript/]]) {
    const got = await ask(f.port, { pathName: `/${file}` });
    assert.equal(got.status, 200, file);
    assert.match(got.headers['content-type'], type);
    assert.equal(got.body, fs.readFileSync(path.join(ROOT, 'templates', file), 'utf8'), `${file} is the template's`);
  }
  for (const file of ['/fonts/Inter-400.woff2', '/icon-192.png', '/manifest.webmanifest']) assert.equal((await ask(f.port, { pathName: file })).status, 200, file);
  assert.equal((await ask(f.port, { pathName: '/nothing-here' })).status, 404);
});

test('0757 AC2: All projects lists every project on the list by name, each from its own panel, and never its folder', async t => {
  const dir = panelsHere();
  const a = await panel(t, dir, 'alpha', { summary: { status: 'Building 1', mood: 'focused', building: 1, needs_you: 1, needs: [{ id: '0007', title: 'Pick a colour', why: 'question', detail: 'Blue?' }] } });
  const c = await panel(t, dir, 'charlie');
  const list = [{ folder: '/home/someone/work/charlie', name: 'charlie', port: c.port }, { folder: '/home/someone/work/alpha', name: 'alpha', port: a.port }, { folder: '/home/someone/work/bravo', name: 'bravo', port: null }];
  const f = await front(t, dir, list);
  const r = await summary(f);
  assert.equal(r.status, 200, r.body);
  assert.equal(r.headers['x-speck-panel'], undefined, 'the address\'s own answer, which any page there may ask for');
  const body = JSON.parse(r.body);
  assert.deepEqual(body.projects.map(p => [p.name, p.port, p.running]), [['alpha', a.port, true], ['bravo', null, false], ['charlie', c.port, true]], 'every listed project, by name');
  assert.equal(body.projects[0].status, 'Building 1', 'each with its own panel\'s summary');
  assert.deepEqual(body.projects[0].needs, [{ id: '0007', title: 'Pick a colour', why: 'question', detail: 'Blue?' }]);
  assert.deepEqual(body.usage, []);
  assert.ok(!r.body.includes('/home/someone'), 'only folder names, never their paths');
});

test('0757 AC2: a list that can\'t be read is said on All projects, with why', async t => {
  const f = await front(t, panelsHere(), () => { throw new SpeckError('Can\'t read ~/.config/speck/projects.json: it isn\'t a list of projects. Delete it, then add your projects again with `speck projects add`.'); });
  const r = await summary(f);
  assert.equal(r.status, 500);
  assert.equal(JSON.parse(r.body).error, 'Can\'t read ~/.config/speck/projects.json: it isn\'t a list of projects. Delete it, then add your projects again with `speck projects add`.');
});

test('0757 AC2: choosing a project shows its own panel at the same address, under /project/, while the address itself stays All projects', async t => {
  const dir = panelsHere(), a = await panel(t, dir, 'alpha'), b = await panel(t, dir, 'bravo');
  const f = await front(t, dir, [{ folder: '/x/alpha', name: 'alpha', port: a.port }, { folder: '/x/bravo', name: 'bravo', port: b.port }]);
  const chose = await choose(f, b.port);
  assert.equal(chose.status, 200, chose.body);
  assert.equal(chose.headers['x-speck-panel'], undefined);
  assert.equal(setCookieOf(chose), `speck-serve-${f.port}=${b.port}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict`);
  const cookie = cookieOf(chose);
  const page = await ask(f.port, { pathName: '/project/', cookie });
  assert.match(page.body, /The panel of bravo\./, 'its page is its own panel\'s');
  assert.equal(page.headers['x-speck-panel'], b.id);
  assert.equal(page.headers['x-speck-serve'], '1', 'saying it\'s at speck serve\'s address');
  // Its page's files, which load from beside it, are its own panel's, asked of it as its own.
  b.seen.length = 0;
  const file = await ask(f.port, { pathName: '/project/panel.js?v=2', cookie });
  assert.equal(file.headers['x-stand-in'], 'bravo');
  assert.equal(b.seen[0].url, '/panel.js?v=2');
  const bare = await ask(f.port, { pathName: '/project', cookie });
  assert.equal(bare.status, 302);
  assert.equal(bare.headers.location, '/project/', 'so its files load from under it');
  // The address itself, and its own files, stay All projects', whatever is chosen: Back, or opening it again, goes there.
  assert.match((await ask(f.port, { cookie })).body, /<meta name="speck-serve" id="speck-serve" content="1">/);
  assert.equal((await ask(f.port, { pathName: '/panel.js', cookie })).body, fs.readFileSync(path.join(ROOT, 'templates', 'panel.js'), 'utf8'));
  // Its menu goes to another project, or back to All projects with the address's own port.
  assert.match(cookieOf(await choose(f, a.port)), new RegExp(`^speck-serve-${f.port}=${a.port}$`));
  const home = await choose(f, f.port);
  assert.equal(home.status, 200);
  assert.match(setCookieOf(home), new RegExp(`^speck-serve-${f.port}=; .*Max-Age=0`));
  // With no project chosen, /project/ is All projects.
  const none = await ask(f.port, { pathName: '/project/' });
  assert.equal(none.status, 302);
  assert.equal(none.headers.location, '/');
  assert.equal(none.headers['set-cookie'], undefined);
});

test('0757 AC2: only a running panel can be chosen, and nothing reaches any other port', async t => {
  const dir = panelsHere(), f = await front(t, dir);
  let reached = 0;
  const other = http.createServer((req, res) => { reached++; res.end('{}'); });
  await new Promise(r => other.listen(0, '127.0.0.1', r));
  t.after(() => other.close());
  const port = other.address().port;
  const c = await choose(f, port);
  assert.equal(c.status, 404);
  assert.match(JSON.parse(c.body).error, /isn't running any more/);
  assert.equal(c.headers['set-cookie'], undefined);
  const cookie = `speck-serve-${f.port}=${port}`; // as if set by hand
  const st = await ask(f.port, { pathName: '/api/state', cookie });
  assert.equal(st.status, 502);
  assert.equal(JSON.parse(st.body).gone, true);
  assert.equal((await ask(f.port, { method: 'POST', pathName: '/api/tickets/1/ready', origin: f.origin, cookie })).status, 502);
  const page = await ask(f.port, { pathName: '/project/', cookie });
  assert.equal(page.status, 302);
  assert.equal(page.headers.location, '/', 'a reload goes to All projects');
  assert.match(setCookieOf(page), /Max-Age=0/, 'and forgets the choice');
  assert.equal((await ask(f.port, { pathName: '/project/panel.js', cookie })).status, 404);
  assert.equal(reached, 0, 'nothing reached the other port');
  // A panel's own switcher cookie isn't this address's.
  assert.equal((await ask(f.port, { pathName: '/project/', cookie: `speck-shown-${f.port}=${port}` })).headers.location, '/');
});

test('0757 AC2: a project\'s page left at the address once its project stops being chosen reloads, and goes to All projects', async t => {
  const f = await front(t, panelsHere()), id = panelIdOf((await ask(f.port)).body);
  const st = await ask(f.port, { pathName: '/api/state' });
  assert.equal(st.status, 404);
  assert.equal(st.headers['x-speck-panel'], id, 'answered as by another panel than its own, so its page reloads');
  const events = await ask(f.port, { pathName: '/api/events', firstChunk: true });
  events.req.destroy();
  assert.match(events.body, /^retry: \d+\nevent: gone\ndata: /m, 'its stream is told its project has gone');
  assert.equal(JSON.parse(events.body.match(/^data: (.*)$/m)[1]).port, f.port, 'naming a port that isn\'t its own, so it reloads');
});

// ---------- AC3: every action works through the address as on the panel's own port ----------

test('0757 AC3: each of a project\'s requests reaches its own panel as one made to it directly, and its answer comes back', async t => {
  const dir = panelsHere(), b = await panel(t, dir, 'bravo'), f = await front(t, dir);
  const cookie = cookieOf(await choose(f, b.port));
  const asks = [
    ['POST', '/api/tickets/7/ready', ''], ['POST', '/api/tickets/7/draft', ''], ['POST', '/api/tickets/7/priority/2', ''],
    ['POST', '/api/foreman/7/answer', 'Go with blue.'], ['POST', '/api/tickets/7/ship', ''], ['POST', '/api/tickets/7/changes', 'Make it bigger.'],
    ['POST', '/api/run/on', ''], ['POST', '/api/run/off', ''], ['POST', '/api/settings/save?reviewer=codex', ''], ['GET', '/api/settings?quick=1', ''],
    ['GET', '/api/state', ''], ['GET', '/api/tickets/7/pack', ''], ['GET', '/api/tickets/7/log', ''],
  ];
  for (const [origin, host] of [[f.origin, undefined], [URL_ORIGIN, URL_HOST]]) {
    for (const [method, pathName, body] of asks) {
      b.seen.length = 0;
      const r = await ask(f.port, { method, pathName, origin, host, cookie, token: 'bravo-key', body, headers: { 'X-Speck-Board': '3' } });
      assert.equal(r.status, 201, `${method} ${pathName} from ${origin}: ${r.body}`);
      assert.equal(r.headers['x-stand-in'], 'bravo', 'its panel\'s own answer');
      assert.equal(r.headers['x-speck-panel'], b.id, 'saying which panel gave it');
      assert.equal(r.headers['x-speck-serve'], '1');
      assert.equal(b.seen.length, 1);
      const [got] = b.seen;
      assert.equal(got.method, method);
      assert.equal(got.url, pathName, 'its path and query as asked');
      assert.equal(got.body, body, 'and what it sent');
      assert.equal(got.headers.host, `127.0.0.1:${b.port}`, 'as asked of the panel directly');
      assert.equal(got.headers.origin, `http://127.0.0.1:${b.port}`, 'from a page at the address, so from one at the panel');
      assert.equal(got.headers['x-speck-token'], 'bravo-key', 'with the page\'s own key, which the panel checks');
      assert.equal(got.headers['x-speck-board'], '3');
      assert.equal(got.headers['x-speck-via'], String(f.port), 'never passed on again');
    }
  }
  // A page elsewhere keeps its Origin, so the panel refuses it as it would on its own port.
  b.seen.length = 0;
  await ask(f.port, { method: 'POST', pathName: '/api/tickets/7/ready', origin: 'https://evil.example', cookie, token: 'bravo-key' });
  assert.equal(b.seen[0].headers.origin, 'https://evil.example');
});

test('0757 AC3: the live updates come through as the panel sends them, and a slow answer, as a ship\'s, waits for it', async t => {
  const dir = panelsHere(), b = await panel(t, dir, 'bravo', { delay: 1500 }), f = await front(t, dir);
  const cookie = cookieOf(await choose(f, b.port));
  const stream = await new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port: f.port, path: '/api/events', headers: { Host: `127.0.0.1:${f.port}`, Cookie: cookie } }, res => resolve({ req, res }));
    req.on('error', reject);
  });
  t.after(() => stream.req.destroy());
  assert.equal(stream.res.statusCode, 200);
  assert.match(stream.res.headers['content-type'], /^text\/event-stream/);
  let text = '';
  stream.res.setEncoding('utf8').on('data', d => { text += d; });
  for (const until = Date.now() + 5000; !text.includes('data: 1\n\n') && Date.now() < until;) await sleep(20);
  assert.equal(text, 'data: 1\n\n', 'the first event, before the panel has sent any other');
  b.send('event: log\ndata: two\n\n');
  for (const until = Date.now() + 5000; !text.includes('data: two') && Date.now() < until;) await sleep(20);
  assert.equal(text, 'data: 1\n\nevent: log\ndata: two\n\n', 'and the next as soon as it\'s sent');
  const started = Date.now(), ship = await ask(f.port, { method: 'POST', pathName: '/api/tickets/7/ship', origin: f.origin, cookie, token: 'k' });
  assert.equal(ship.status, 201);
  assert.ok(Date.now() - started >= 1400, 'its answer, once the panel gave it');
});

// ---------- AC4: a project whose panel isn't answering ----------

test('0757 AC4: a project whose panel doesn\'t answer is on All projects as not running, and the rest keep working', async t => {
  const dir = panelsHere(), a = await panel(t, dir, 'alpha'), b = await panel(t, dir, 'bravo', { hang: true });
  const f = await front(t, dir, [{ folder: '/x/alpha', name: 'alpha', port: a.port }, { folder: '/x/bravo', name: 'bravo', port: b.port }, { folder: '/x/charlie', name: 'charlie', port: null }]);
  const cookie = cookieOf(await choose(f, a.port));
  const started = Date.now();
  const [r, st] = await Promise.all([summary(f), ask(f.port, { pathName: '/api/state', cookie })]);
  assert.ok(Date.now() - started < 5000, `within a few seconds: ${Date.now() - started} ms`);
  assert.deepEqual(JSON.parse(r.body).projects.map(p => [p.name, p.running]), [['alpha', true], ['bravo', false], ['charlie', false]]);
  assert.deepEqual(JSON.parse(r.body).projects[1], { port: b.port, name: 'bravo', running: false }, 'only its name and port');
  assert.equal(st.status, 201, 'alpha\'s requests are answered meanwhile');
  assert.equal(st.headers['x-stand-in'], 'alpha');
});

test('0757 AC4: the shown project\'s panel stopping is said on its page\'s stream, the others still show, and a reload shows All projects', async t => {
  const dir = panelsHere(), a = await panel(t, dir, 'alpha'), b = await panel(t, dir, 'bravo'), f = await front(t, dir);
  const cookie = cookieOf(await choose(f, a.port));
  await a.stop();
  const events = await ask(f.port, { pathName: '/api/events', cookie, firstChunk: true });
  events.req.destroy();
  assert.match(events.body, /^retry: \d+\nevent: gone\ndata: /m);
  const gone = JSON.parse(events.body.match(/^data: (.*)$/m)[1]);
  assert.equal(gone.port, a.port, 'naming its panel');
  assert.deepEqual(gone.list, [{ port: b.port, name: 'bravo' }], 'with the panels still running');
  const st = await ask(f.port, { pathName: '/api/state', cookie });
  assert.equal(st.status, 502);
  assert.equal(JSON.parse(st.body).gone, true);
  const other = cookieOf(await choose(f, b.port));
  assert.equal((await ask(f.port, { pathName: '/api/state', cookie: other })).headers['x-stand-in'], 'bravo', 'another project still shows');
  const page = await ask(f.port, { pathName: '/project/', cookie });
  assert.equal(page.headers.location, '/', 'a reload of the stopped one goes to All projects');
  assert.match(setCookieOf(page), /Max-Age=0/);
});

test('0757 AC4: a panel that stops while a request is on its way gets the page told so, rather than no answer', async t => {
  const dir = panelsHere(), a = await panel(t, dir, 'alpha'), f = await front(t, dir);
  const cookie = cookieOf(await choose(f, a.port));
  // Its record stays, as when its process is killed before it can tidy up, but nothing answers on its port.
  const record = path.join(dir, `${a.port}.json`), kept = fs.readFileSync(record, 'utf8');
  await a.stop();
  fs.writeFileSync(record, kept);
  t.after(() => fs.rmSync(record, { force: true }));
  const st = await ask(f.port, { pathName: '/api/state', cookie });
  assert.equal(st.status, 502);
  assert.equal(JSON.parse(st.body).error, 'This project\'s panel has stopped. speck serve starts it again by itself, or pick another project.', 'not to start it by hand, which speck serve does (self-check)');
});

test('0757 AC4 self-check: a port given for a project with no panel running there is never asked, and the project shows with none', async t => {
  const dir = panelsHere();
  let reached = 0;
  const other = http.createServer((req, res) => { reached++; res.end('{"status":"Idle"}'); });
  await new Promise(r => other.listen(0, '127.0.0.1', r));
  t.after(() => other.close());
  const f = await front(t, dir, [{ folder: '/x/alpha', name: 'alpha', port: other.address().port }]);
  assert.deepEqual(JSON.parse((await summary(f)).body).projects, [{ port: null, name: 'alpha', running: false }]);
  assert.equal(reached, 0, 'nothing reached the other program on that port');
});

test('0757 AC2: the address keeps a record among the panels\' while it runs, for an older page\'s menu, which this speck leaves out', async () => {
  const dir = panelsHere();
  const f = await startFront({ port: 0, env: { ...process.env, SPECK_PANELS_DIR: dir }, projects: () => [] });
  const record = path.join(dir, `${f.port}.json`);
  try {
    assert.deepEqual(JSON.parse(fs.readFileSync(record, 'utf8')), { pid: process.pid, port: f.port, name: 'speck serve', serve: true });
    assert.deepEqual(runningPanels(dir), [], 'this speck\'s menus and bridge leave it out');
    // An older panel's bridge, which lists it, asks it for its summary as another speck: one with nothing to count.
    const own = await ask(f.port, { pathName: '/api/projects/own', headers: { 'X-Speck-Via': '4801' } });
    assert.equal(own.status, 200);
    assert.deepEqual(JSON.parse(own.body), { status: 'All projects', tone: 'idle', mood: 'asleep', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0, spent_week_usd: null, spent_week_unknown: false, build_minutes: [] });
    assert.equal((await ask(f.port, { pathName: '/api/projects/own' })).status, 404, 'a page can\'t ask for it');
  } finally { f.close(); }
  assert.equal(fs.existsSync(record), false, 'and takes it away as it stops');
});

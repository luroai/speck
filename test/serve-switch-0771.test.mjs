import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0771: speck serve switches to new code by itself. These run speck serve from a copy of the CLI and change that copy's
// code, as a ship that changes speck does, with each project's own speck a stand-in panel (support/stand-in-panel.mjs).
// The last one checks the address's hand-off in this process, with stand-in panels, so it waits for nothing real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startFront } from '../scripts/serve-front.mjs';
import { panelUrl } from '../scripts/panel-url.mjs';
import { machine, standInProject, addProject, until, portOf, readJson, pidAlive, endServe } from './support/serve.mjs';
import { panelsHere, standInPanel, ask, cookieOf } from './support/serve-front.mjs';
import { URL_HOST, URL_ORIGIN, serveCopy, readCode, writeCode, marked, withoutFloor, serveFrom, workersOf, slowProject, askFresh, keepAsking, openStream } from './support/serve-switch.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const isAllProjects = body => /<meta name="speck-serve" id="speck-serve" content="1">/.test(body);
const SWITCHED = 'speck serve: its code changed, so it switched to the new code.';

test('0771 AC1: once its code has changed and settled, speck serve runs the new code within 10 seconds, and All projects and the factory floor come from it', async () => {
  const m = machine(), a = standInProject('alpha'), cli = serveCopy(), front = readCode(cli, 'serve-front.mjs');
  addProject(m, a);
  // The code it starts on says it's v1, and has no factory floor, as speck serve's code had none before 0765.
  writeCode(cli, 'serve-front.mjs', withoutFloor(marked(front, 'v1')));
  const s = serveFrom(cli, m);
  try {
    await until('alpha\'s panel started', () => portOf(s.out(), 'alpha'));
    const floorBefore = await askFresh(s.port, { pathName: '/floor' });
    assert.equal(floorBefore.status, 404, 'no factory floor on the code it started on');
    assert.equal(floorBefore.version, 'v1');
    assert.deepEqual(workersOf(s.child.pid), [], 'until its code changes, the process you started serves by itself');
    writeCode(cli, 'serve-front.mjs', marked(front, 'v2')); // written at once, so settled from here
    const changed = Date.now();
    await until('the new code answering', async () => (await askFresh(s.port)).version === 'v2', 10000);
    const took = Date.now() - changed;
    assert.ok(took < 10000, `running the new code ${took} ms after the change`);
    const floor = await askFresh(s.port, { pathName: '/floor' });
    assert.equal(floor.status, 200, floor.body);
    assert.match(floor.body, /<title>speck · Factory floor<\/title>/, 'the factory floor, which only the new code has');
    assert.equal(floor.version, 'v2');
    const all = await askFresh(s.port);
    assert.ok(isAllProjects(all.body), 'All projects');
    assert.equal(all.version, 'v2');
    assert.ok(s.out().includes(SWITCHED), s.out());
    assert.equal(readJson(m.record).pid, s.child.pid, 'its record still names the process you started');
    assert.equal(s.child.exitCode, null, 'which is still running');
    assert.equal(workersOf(s.child.pid).length, 1, 'with speck serve on the new code in a process of its own');
  } finally { await endServe(s); }
});

test('0771 AC2: while it switches, its port and --url keep answering: every request gets an answer, and one in flight at the old code is answered by it', async () => {
  const m = machine(), a = slowProject('alpha'), cli = serveCopy(), front = readCode(cli, 'serve-front.mjs');
  addProject(m, a);
  writeCode(cli, 'serve-front.mjs', marked(front, 'v1'));
  const s = serveFrom(cli, m, ['--url', URL_ORIGIN]), local = `http://127.0.0.1:${s.port}`;
  let asking = null;
  try {
    const pa = await until('alpha\'s panel started', () => portOf(s.out(), 'alpha'));
    const chose = await askFresh(s.port, { method: 'POST', pathName: `/api/projects/${pa}`, origin: local });
    assert.equal(chose.status, 200, chose.body);
    const cookie = cookieOf(chose);
    asking = keepAsking(s.port, [`127.0.0.1:${s.port}`, URL_HOST]);
    // The first switch, from the process you started, then the next, from the worker that took over, through it.
    for (const [from, to] of [['v1', 'v2'], ['v2', 'v3']]) {
      const stream = await openStream(s.port, cookie); // alpha's page's stream, passed on to its panel
      assert.equal(stream.version, from);
      const [old] = workersOf(s.child.pid); // none before the first switch
      await until(`answers from ${from}`, () => asking.got.filter(r => r.version === from).length >= 4);
      const slow = askFresh(s.port, { pathName: '/api/slow?ms=6000', cookie }).then(r => ({ ...r, at: Date.now() })); // still being answered as the old code stops
      await sleep(100);
      writeCode(cli, 'serve-front.mjs', marked(front, to));
      await until(`${to} answering`, () => asking.got.some(r => r.version === to), 10000);
      const switched = Date.now();
      await until('the old code ending alpha\'s page\'s stream, so the page reconnects to the new code', () => Promise.race([stream.ended.then(() => true), sleep(100).then(() => false)]), 5000);
      const again = await openStream(s.port, cookie);
      assert.equal(again.version, to, 'the page\'s stream again, from the new code');
      again.close();
      const answered = await slow;
      assert.equal(answered.status, 200, JSON.stringify(answered));
      assert.equal(JSON.parse(answered.body).slow, true, 'alpha\'s panel\'s answer');
      assert.equal(answered.version, from, 'given by the old code, which the request reached');
      assert.ok(answered.at > switched, 'after the new code had started answering');
      if (old) await until('the old worker ending once it has answered', () => !pidAlive(old));
      const after = asking.got.length;
      await until('more answers', () => asking.got.length >= after + 4);
      assert.ok(asking.got.slice(after).every(r => r.version === to), `only ${to} answering from then on`);
    }
    const got = await asking.stop();
    asking = null;
    assert.deepEqual(got.filter(r => r.status !== 200), [], 'every request got an answer');
    for (const host of [`127.0.0.1:${s.port}`, URL_HOST]) {
      for (const version of ['v1', 'v2', 'v3']) assert.ok(got.some(r => r.host === host && r.version === version), `${host} answered by ${version}`);
    }
  } finally { await asking?.stop(); await endServe(s); }
});

test('0771 AC2: the address\'s hand-off stops taking connections, ends each stream it passes on and waits for every answer it\'s giving', async t => {
  const dir = panelsHere(), p = await standInPanel(dir, 'alpha', { delay: 2500 });
  t.after(() => p.stop());
  const f = await startFront({ port: 0, url: panelUrl(['--url', URL_ORIGIN]), env: { ...process.env, SPECK_PANELS_DIR: dir }, projects: () => [{ folder: '/stand-in/alpha', name: 'alpha', port: p.port }] });
  t.after(() => f.close());
  const origin = `http://127.0.0.1:${f.port}`;
  const cookie = cookieOf(await ask(f.port, { method: 'POST', pathName: `/api/projects/${p.port}`, origin }));
  const stream = await ask(f.port, { pathName: '/api/events', cookie, firstChunk: true });
  const streamEnded = new Promise(r => { stream.res.on('end', r); stream.res.on('close', r); });
  const slow = askFresh(f.port, { method: 'POST', pathName: '/api/tickets/0001/ship', origin, cookie });
  await until('the slow request reaching alpha', () => p.seen.some(r => r.url === '/api/tickets/0001/ship'));
  assert.equal(typeof f.handle(), 'object', 'the socket it answers on, to hand over');
  let handed = false;
  const handing = f.handOff(60000).then(() => { handed = true; });
  await until('its page\'s stream ended', () => Promise.race([streamEnded.then(() => true), sleep(50).then(() => false)]), 2000);
  assert.ok((await askFresh(f.port, { timeout: 2000 })).error, 'no new connection taken');
  assert.equal(handed, false, 'still giving the slow answer');
  const answered = await slow;
  assert.equal(answered.status, 201, JSON.stringify(answered));
  assert.equal(JSON.parse(answered.body).from, 'alpha', 'alpha\'s answer, passed on in full');
  assert.equal(answered.headers.connection, 'close', 'closing its connection');
  await handing; // ends once every answer has been given
});

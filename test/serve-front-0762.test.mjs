import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0762: at speck serve's address, a project that is off, or not on the list at all, is left out of All projects and
// the project menu, even with its panel running. Checked on the address started in this process, with stand-in panels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startFront } from '../scripts/serve-front.mjs';
import { panelsHere, standInPanel, ask, cookieOf } from './support/serve-front.mjs';
import { T, fakePage } from './support/panel.mjs';

async function front(t, dir, list, shown) {
  const f = await startFront({ port: 0, env: { ...process.env, SPECK_PANELS_DIR: dir }, projects: () => list(), shown });
  t.after(() => f.close());
  return { ...f, origin: `http://127.0.0.1:${f.port}` };
}
async function panel(t, dir, name, opts) {
  const p = await standInPanel(dir, name, opts);
  t.after(() => p.stop());
  return p;
}
const choose = (f, to) => ask(f.port, { method: 'POST', pathName: `/api/projects/${to}`, origin: f.origin });

test('0762 AC3: All projects and the choices at the address leave out a project that is off or not listed, even with its panel running', async t => {
  const dir = panelsHere();
  const a = await panel(t, dir, 'alpha', { summary: { status: 'Idle', mood: 'watching', building: 0, needs_you: 0, needs: [] } });
  const b = await panel(t, dir, 'bravo', { summary: { status: 'Building 2', mood: 'focused', building: 2, needs_you: 1, needs: [{ id: '0009', title: 'Off one', why: 'question', detail: '' }], shipped_week: 4 } });
  const c = await panel(t, dir, 'charlie', { summary: { status: 'Building 1', mood: 'focused', building: 1, needs_you: 1, needs: [] } });
  // alpha is on; bravo is listed but off; charlie isn't listed at all. Each has a panel running.
  let on = [{ folder: '/x/alpha', name: 'alpha', port: a.port }];
  let ports = new Set([a.port]);
  const f = await front(t, dir, () => on, () => ports);

  const sum = JSON.parse((await ask(f.port, { method: 'POST', pathName: '/api/projects/summary', origin: f.origin })).body);
  assert.deepEqual(sum.projects.map(p => p.name), ['alpha'], 'only the project that is on');
  assert.ok(!JSON.stringify(sum).includes('Off one'), 'nothing of the others counts');

  for (const p of [b, c]) {
    const r = await choose(f, p.port);
    assert.equal(r.status, 404, `${p.name} can't be chosen`);
    assert.equal(r.headers['set-cookie'], undefined);
  }
  const chose = await choose(f, a.port);
  assert.equal(chose.status, 200, chose.body);
  const st = await ask(f.port, { pathName: '/api/state', cookie: cookieOf(chose) });
  assert.equal(st.headers['x-speck-serve-shown'], String(a.port), 'every answer names the panels the menu may show');

  // A choice of bravo made before it was turned off: its page is told its project has gone, and nothing reaches it.
  ports = new Set([a.port, b.port]);
  on = [...on, { folder: '/x/bravo', name: 'bravo', port: b.port }];
  const bravo = cookieOf(await choose(f, b.port));
  on = on.slice(0, 1); ports = new Set([a.port]);
  b.seen.length = 0;
  const left = await ask(f.port, { pathName: '/api/state', cookie: bravo });
  assert.equal(left.status, 502);
  assert.equal(JSON.parse(left.body).gone, true);
  assert.equal(b.seen.length, 0, 'nothing reached bravo\'s panel');
  const events = await ask(f.port, { pathName: '/api/events', cookie: bravo });
  const list = JSON.parse(events.body.match(/^data: (.*)$/m)[1]).list;
  assert.deepEqual(list.map(p => p.name), ['alpha'], 'the panels still shown are only the ones that are on');
});

test('0762 AC3: started without a list of what to show, the address shows every running panel as before', async t => {
  const dir = panelsHere(), c = await panel(t, dir, 'charlie');
  const f = await front(t, dir, () => []);
  assert.equal((await choose(f, c.port)).status, 200);
  assert.equal((await ask(f.port, { pathName: '/api/state' })).headers['x-speck-serve-shown'], undefined);
});

// ---------- a project's page at speck serve's address ----------

const board = extra => ({ tickets: [T('0001', 'ready')], ideas: [], ...extra });
const options = p => p.byId('project').children.map(o => o.textContent);
// The page's fetch at speck serve's address, which names the panels it may show (X-Speck-Serve-Shown).
function serveFetch(answers, shown) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const next = answers.shift(), headers = { get: k => (/^x-speck-serve$/i.test(k) ? '1' : /^x-speck-serve-shown$/i.test(k) ? shown : null) };
    return { ok: true, status: 200, headers, json: async () => next };
  };
  return { fetch, calls };
}

test('0762 AC3: a project\'s menu at the address leaves out the running panels the address doesn\'t show', async () => {
  const list = [{ port: 4801, name: 'alpha' }, { port: 4802, name: 'bravo' }, { port: 4803, name: 'charlie' }];
  const { fetch } = serveFetch([board({ projects: { self: 4801, list } })], '4801,4803');
  const p = fakePage([], { fetch });
  await p.settle();
  assert.deepEqual(options(p), ['All projects', 'alpha', 'charlie']);
  // With none of the others shown, it's this project's alone, with All projects.
  const { fetch: only } = serveFetch([board({ projects: { self: 4801, list } })], '4801');
  const q = fakePage([], { fetch: only });
  await q.settle();
  assert.deepEqual(options(q), ['All projects', 'alpha']);
  // An empty list shows none of the others either.
  const { fetch: none } = serveFetch([board({ projects: { self: 4801, list } })], '');
  const r = fakePage([], { fetch: none });
  await r.settle();
  assert.deepEqual(options(r), ['All projects', 'alpha']);
  // Away from speck serve, the menu lists every running panel.
  const s = fakePage([board({ projects: { self: 4801, list } })]);
  await s.settle();
  assert.deepEqual(options(s), ['All projects', 'alpha', 'bravo', 'charlie']);
});

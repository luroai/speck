import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, fakePage, queueRows, click, items, fm, freePort, startPanel, stop, request, post, tokenOf, panelRepo, headOf, readT } from './support/panel.mjs';
import { runRepo, startRun, stopRun, until } from './support/run.mjs';
import { spawn } from 'node:child_process';

// ---------- 0146: a ready ticket in the Build queue can go back to Plan ----------

const draftPath = id => `/api/tickets/${id}/draft`;
const started = () => new Date(Date.now() - 60000).toISOString();
const state = () => ({
  tickets: [
    T('0001', 'building', { build_running: true, paused: false, started: started() }),
    T('0002', 'reviewing', { build_running: true, paused: false, started: started() }),
    T('0003', 'blocked', { blocked_question: 'Which one?', started: started() }),
    T('0004', 'approved', { started: started(), approved: started() }),
    T('0005', 'ready'),
    T('0006', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
  ],
  ideas: [],
});
// A page whose state is `s` (changed by the test between refreshes) and whose Back to Plan requests `draft` answers.
function page(s = state(), draft = () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })) {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (/\/draft$/.test(url)) { sent.push([url, opts.method, opts.headers['X-Speck-Token']]); return draft(url, opts); }
      return { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(s))) };
    },
    confirm: () => true,
  });
  p.sent = sent;
  return p;
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const backOf = (p, row) => p.all(row).find(n => n.tagName === 'button' && /\bback-to-plan\b/.test(n.className));
const refusalOf = (p, row) => (p.all(row).find(n => /\bplan-refused\b/.test(n.className || '')) || {}).textContent;
const openRow = async (p, id) => { click(topOf(rowOf(p, id))); await p.settle(); return rowOf(p, id); };
// Runs every timer due, the state poll among them (an open row's log timer is there too).
const poll = async p => { for (const fn of p.timers.splice(0)) fn(); await p.settle(); };

test('0146 AC1: an opened ready ticket in the queue has Back to Plan; in-flight tickets and closed rows don\'t', async () => {
  const p = page();
  await p.settle();
  for (const id of ['0001', '0002', '0003', '0004', '0005', '0006']) assert.equal(backOf(p, rowOf(p, id)), undefined, `${id} closed: no button`);
  for (const id of ['0005', '0006']) {
    const b = backOf(p, await openRow(p, id));
    assert.ok(b, `${id} open: Back to Plan`);
    assert.equal(b.textContent, 'Back to Plan');
    assert.equal(b.disabled, false);
  }
  for (const id of ['0001', '0002', '0003', '0004']) assert.equal(backOf(p, await openRow(p, id)), undefined, `${id} (in flight) open: no button`);
});

test('0146 AC2: clicking it posts with the token, shows it pending, and the next refresh has the ticket in Plan\'s drafts, not the queue', async () => {
  let answer;
  const s = state();
  const p = page(s, () => new Promise(r => { answer = r; }));
  await p.settle();
  const row = await openRow(p, '0005');
  const caught = p.press(backOf(p, row));
  assert.equal(caught, false, 'the page itself doesn\'t swallow the click');
  await p.settle();
  assert.deepEqual(p.sent, [['/api/tickets/0005/draft', 'POST', '{{token}}']]);
  const pending = backOf(p, rowOf(p, '0005'));
  assert.equal(pending.textContent, 'Moving to Plan…');
  assert.equal(pending.disabled, true);
  p.press(pending); // a second click while it's pending sends nothing
  await p.settle();
  assert.equal(p.sent.length, 1);
  assert.ok(rowOf(p, '0005'), 'the row stays open after the click');
  answer({ ok: true, status: 200, json: async () => ({ ok: true, id: '0005' }) });
  await p.settle();
  s.tickets.find(t => t.id === '0005').status = 'draft';
  await poll(p);
  assert.equal(rowOf(p, '0005'), undefined, 'out of the queue');
  assert.ok(items(p).some(n => p.all(n).some(x => x.className === 'id' && x._text === '0005')), 'in Plan\'s drafts');
});

test('0146 AC3: a refusal leaves the row as it was and shows why, until the next click or the ticket leaves the queue', async () => {
  const why = 'Ticket 0005 is "building", not waiting in the queue, so it can\'t go back to Plan from here.';
  const answers = [{ ok: false, status: 409, json: async () => ({ error: why }) }, { ok: false, status: 500, json: async () => { throw new Error('no JSON'); } }];
  const s = state();
  const p = page(s, () => answers.shift());
  await p.settle();
  await openRow(p, '0005');
  p.press(backOf(p, rowOf(p, '0005')));
  await p.settle();
  assert.equal(refusalOf(p, rowOf(p, '0005')), why);
  assert.equal(backOf(p, rowOf(p, '0005')).textContent, 'Back to Plan', 'the button is back');
  await poll(p);
  assert.equal(refusalOf(p, rowOf(p, '0005')), why, 'the reason stays through a refresh');
  p.press(backOf(p, rowOf(p, '0005')));
  await p.settle();
  assert.equal(refusalOf(p, rowOf(p, '0005')), 'The server refused (500).', 'a reply with no reason still says something');
  // The server unreachable.
  const q = page(state(), () => { throw new Error('offline'); });
  await q.settle();
  await openRow(q, '0005');
  q.press(backOf(q, rowOf(q, '0005')));
  await q.settle();
  assert.equal(refusalOf(q, rowOf(q, '0005')), "Couldn't reach the panel server, so the ticket wasn't changed.");
  // Once its build has started, the reason and the button go.
  Object.assign(s.tickets.find(t => t.id === '0005'), { status: 'building', build_running: true, started: started() });
  await poll(p);
  assert.equal(refusalOf(p, rowOf(p, '0005')), undefined);
  assert.equal(backOf(p, rowOf(p, '0005')), undefined);
});

// A panel repo whose 0001 is ready and committed, and whose 0002 is a committed draft, served on a free port.
async function queuePanel() {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  r.g('add', '-A'); r.g('commit', '-qm', 'two');
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const token = tokenOf((await request(p.port)).body);
  return { r, port: p.port, p, token };
}

test('0146 AC2: the server sets a ready ticket to draft and commits only that ticket\'s file to the base branch', async () => {
  const { r, port, p, token } = await queuePanel();
  try {
    fs.writeFileSync(path.join(r.dir, 'staged.txt'), 'staged\n'); r.g('add', 'staged.txt');
    fs.appendFileSync(path.join(r.dir, 'speck', 'config.yml'), '\n# unstaged edit\n');
    const before = headOf(r);
    const res = await post(port, draftPath('0001'), { token });
    assert.equal(res.status, 200, res.body);
    assert.deepEqual(JSON.parse(res.body), { ok: true, id: '0001' });
    assert.match(readT(r, '0001-export-bookings.md'), /^status: draft/m);
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0001): draft');
    assert.equal(r.g('rev-parse', 'HEAD~1'), before, 'one new commit');
    assert.equal(r.g('rev-parse', '--abbrev-ref', 'HEAD'), 'main');
    assert.equal(r.g('show', '--name-only', '--format=', 'HEAD'), 'speck/tickets/0001-export-bookings.md');
    assert.equal(r.g('status', '--porcelain', '--', 'speck/tickets/0001-export-bookings.md'), '', 'the ticket is fully committed');
    assert.equal(r.g('diff', '--cached', '--name-only'), 'staged.txt', 'the staged change is still staged');
    assert.equal(r.g('diff', '--name-only'), 'speck/config.yml', 'the unstaged change is still unstaged');
    const st = JSON.parse((await request(port, { pathName: '/api/state' })).body);
    assert.equal(st.tickets.find(t => t.id === '0001').status, 'draft', 'the next refresh reads it as a draft');
    // Set ready works on it again, so it's the same in reverse.
    assert.equal((await post(port, '/api/tickets/0001/ready', { token })).status, 200);
    assert.equal((await post(port, draftPath('1'), { token })).status, 200, 'a short id works as on the command line');
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0001): draft');
  } finally { await stop(p); }
});

test('0146 AC2: after Back to Plan, speck run starts the other ready ticket but not this one', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]], max: 2 });
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  let run;
  try {
    const token = tokenOf((await request(p.port)).body);
    assert.equal((await post(p.port, draftPath('0002'), { token })).status, 200);
    run = startRun(r.dir);
    assert.ok(await until(() => r.calls().some(c => c.args[0] === '0001')), `0001 is launched:\n${run.out()}`);
    await new Promise(res => setTimeout(res, 600)); // several of speck run's checks
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0001'], '0002 is never launched');
  } finally { if (run) await stopRun(run); await stop(p); }
});

test('0146 AC3: a ticket that isn\'t ready, or a checkout off the base branch, changes nothing and says why', async () => {
  const { r, port, p, token } = await queuePanel();
  try {
    r.write('0003-three.md', fm({ id: '"0003"', title: 'Three', status: 'building' }));
    r.g('add', '-A'); r.g('commit', '-qm', 'three');
    const names = ['0001-export-bookings.md', '0002-two.md', '0003-three.md'];
    const cases = [
      ['0003', 409, /"building", not waiting in the queue/],
      ['0002', 409, /"draft", not waiting in the queue/],
      ['0099', 404, /0099/],
    ];
    for (const [id, status, why] of cases) {
      const before = headOf(r), files = names.map(n => readT(r, n));
      const res = await post(port, draftPath(id), { token });
      assert.equal(res.status, status, `${id}: ${res.body}`);
      assert.match(JSON.parse(res.body).error, why);
      assert.equal(headOf(r), before, `${id}: nothing committed`);
      assert.deepEqual(names.map(n => readT(r, n)), files, `${id}: no file changed`);
      assert.equal(r.g('status', '--porcelain'), '', `${id}: nothing left uncommitted`);
    }
    r.g('checkout', '-q', '-b', 'elsewhere');
    const before = headOf(r);
    const res = await post(port, draftPath('0001'), { token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, /on "elsewhere", not main.*Switch to main/s);
    assert.match(readT(r, '0001-export-bookings.md'), /^status: ready/m);
    assert.equal(headOf(r), before);
    assert.equal(r.g('status', '--porcelain'), '');
  } finally { await stop(p); }
});

test('0146 AC4: without the panel\'s token or from another origin, it\'s refused with 403 and changes nothing', async () => {
  const { r, port, p, token } = await queuePanel();
  try {
    const before = headOf(r), file = readT(r, '0001-export-bookings.md');
    const bad = [
      { token, origin: null }, { token, origin: 'http://evil.example' }, { token, origin: `http://127.0.0.1:${port + 1}` },
      { token, origin: `https://127.0.0.1:${port}` }, { token, origin: 'null' },
      {}, { token: '' }, { token: 'nope' }, { token: token.slice(0, -1) },
    ];
    for (const o of bad) {
      const res = await post(port, draftPath('0001'), o);
      assert.equal(res.status, 403, JSON.stringify({ ...o, token: o.token === token ? 'right' : o.token }));
      assert.match(JSON.parse(res.body).error, /Forbidden/);
    }
    assert.equal((await post(port, draftPath('0001'), { token, host: 'evil.example' })).status, 403, 'the Host check still applies');
    assert.equal(headOf(r), before);
    assert.equal(readT(r, '0001-export-bookings.md'), file);
    assert.equal(r.g('status', '--porcelain'), '');
    // The localhost origin works too.
    assert.equal((await post(port, draftPath('0001'), { token, origin: `http://localhost:${port}` })).status, 200);
  } finally { await stop(p); }
});

test('0146 AC3: a ticket being built in its own worktree, still ready in this checkout, changes nothing and says why', async () => {
  const r = panelRepo({ worktrees: 'true' });
  r.g('add', '-A'); r.g('commit', '-qm', 'worktrees on');
  const started = r.run('start', '1');
  assert.equal(started.status, 0, started.stderr);
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    assert.match(readT(r, '0001-export-bookings.md'), /^status: ready/m, 'this checkout still has it ready');
    const before = headOf(r);
    const res = await post(p.port, draftPath('0001'), { token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, /"building", not waiting in the queue/);
    assert.equal(headOf(r), before);
    assert.match(readT(r, '0001-export-bookings.md'), /^status: ready/m);
    assert.equal(r.g('status', '--porcelain'), '');
  } finally { await stop(p); }
});

test('0146 AC3: a ready ticket whose build speck run has just launched changes nothing and says why', async () => {
  const { r, port, p, token } = await queuePanel();
  const build = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
  build.unref();
  try {
    const runs = path.join(r.dir, 'speck', '.cache', 'runs');
    fs.mkdirSync(runs, { recursive: true });
    fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ session: 's-0146', pid: build.pid, cwd: r.dir }));
    const before = headOf(r);
    const res = await post(port, draftPath('0001'), { token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, /speck run has just started building ticket 0001/);
    assert.equal(headOf(r), before);
    assert.match(readT(r, '0001-export-bookings.md'), /^status: ready/m);
  } finally { try { process.kill(build.pid, 'SIGKILL'); } catch {} await stop(p); }
});

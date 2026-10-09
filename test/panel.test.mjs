import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import vm from 'node:vm';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0031: a read-only control panel in the browser ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const PAGE = path.join(ROOT, 'templates', 'panel.html');
const gitEnv = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const env = { ...process.env, ...gitEnv };
const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
const fm = (o = {}) => Object.entries({ id: '"0001"', title: 'Export bookings as CSV', status: 'draft', size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', ...o }).map(([k, v]) => `${k}: ${v}`).join('\n');

// A repo with speck installed and one ready ticket, committed.
function panelRepo({ worktrees = 'false' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, '  test: "true"').replace(/^worktrees:.*$/m, `worktrees: ${worktrees}`));
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
  assert.equal(run('set', '1', 'status', 'ready').status, 0);
  g('add', '-A'); g('commit', '-qm', 'base');
  const write = (name, fmText, body = good, where = 'speck/tickets') => {
    fs.mkdirSync(path.join(dir, where), { recursive: true });
    fs.writeFileSync(path.join(dir, where, name), `---\n${fmText}\n---\n${body}`);
  };
  return { dir, run, g, file, write };
}

const freePort = () => new Promise(resolve => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// Starts `speck panel` and resolves once it has printed its URL.
function startPanel(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, 'panel', ...args], { cwd, env });
    let out = '', err = '';
    const done = setTimeout(() => { child.kill(); reject(new Error(`panel didn't start: ${out}${err}`)); }, 10000);
    child.stdout.on('data', d => { out += d; if (/http:\/\/127\.0\.0\.1:\d+/.test(out)) { clearTimeout(done); resolve({ child, out: () => out }); } });
    child.stderr.on('data', d => { err += d; });
    child.on('exit', code => { clearTimeout(done); reject(Object.assign(new Error(`panel exited ${code}: ${out}${err}`), { code, out, err })); });
  });
}
const stop = p => new Promise(resolve => { p.child.removeAllListeners('exit'); p.child.on('exit', resolve); p.child.kill(); });

function request(port, { method = 'GET', pathName = '/', host = `127.0.0.1:${port}` } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: pathName, headers: { Host: host } }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

// The page's pure model function, run outside the browser.
const page = () => fs.readFileSync(PAGE, 'utf8');
function panelModel() {
  const m = page().match(/\/\/ ---- model[^\n]*\n([\s\S]*?)\/\/ ---- end model/);
  assert.ok(m, 'the page has a marked model section');
  const fn = vm.runInNewContext(`${m[1]}\npanelModel`, {});
  // Back through JSON, so the result's arrays and objects belong to this realm and compare strictly.
  return state => JSON.parse(JSON.stringify(fn(state)));
}

test('0031 AC1: speck panel serves on 127.0.0.1 at the given port, prints the URL and keeps running', async () => {
  const r = panelRepo();
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  try {
    assert.match(p.out(), new RegExp(`http://127\\.0\\.0\\.1:${port}/`));
    await new Promise(res => setTimeout(res, 300));
    assert.equal(p.child.exitCode, null, 'still running');
    assert.equal((await request(port)).status, 200);
    assert.equal((await request(port, { host: `localhost:${port}` })).status, 200);
  } finally { await stop(p); }
  // --port=<n> works too.
  const port2 = await freePort();
  const p2 = await startPanel(r.dir, [`--port=${port2}`]);
  await stop(p2);
});

test('0031 AC1: without --port it uses 4777', async () => {
  const r = panelRepo();
  try {
    const p = await startPanel(r.dir, []);
    assert.match(p.out(), /http:\/\/127\.0\.0\.1:4777\//);
    await stop(p);
  } catch (e) {
    // Something else on this machine has 4777: then the message must name it.
    assert.notEqual(e.code, 0, e.message);
    assert.match(e.err, /4777/);
  }
});

test('0031 AC1: a port in use exits non-zero naming the port, and a bad --port is refused', async () => {
  const r = panelRepo();
  const blocker = net.createServer();
  await new Promise(res => blocker.listen(0, '127.0.0.1', res));
  const { port } = blocker.address();
  try {
    const res = spawnSync(process.execPath, [CLI, 'panel', '--port', String(port)], { cwd: r.dir, encoding: 'utf8', env, timeout: 10000 });
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, new RegExp(`\\b${port}\\b`));
    assert.match(res.stderr, /in use/);
    assert.doesNotMatch(res.stderr, /at .*\.mjs:\d+/, 'no stack trace');
  } finally { blocker.close(); }
  for (const bad of ['abc', '0', '70000', '']) {
    const res = spawnSync(process.execPath, [CLI, 'panel', '--port', bad], { cwd: r.dir, encoding: 'utf8', env, timeout: 10000 });
    assert.notEqual(res.status, 0, bad);
    assert.match(res.stderr, /--port/);
  }
});

test('0031 AC1: a request with any other Host header gets 403', async () => {
  const r = panelRepo();
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  try {
    for (const host of ['evil.example', `evil.example:${port}`, `127.0.0.1:${port + 1}`, '127.0.0.1', `localhost.evil.example:${port}`])
      for (const pathName of ['/', '/api/state'])
        assert.equal((await request(port, { host, pathName })).status, 403, `${host} ${pathName}`);
    assert.equal((await request(port, { host: `LOCALHOST:${port}` })).status, 200, 'host names are case-insensitive');
  } finally { await stop(p); }
});

test('0031 AC2: / is the page, /api/state matches speck status --json, other paths 404, other methods 405', async () => {
  const r = panelRepo();
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  try {
    const home = await request(port);
    assert.equal(home.status, 200);
    assert.match(home.headers['content-type'], /text\/html/);
    assert.match(home.body, /speck/);
    assert.match(home.body, /\/api\/state/);
    const api = await request(port, { pathName: '/api/state' });
    assert.equal(api.status, 200);
    assert.match(api.headers['content-type'], /application\/json/);
    assert.deepEqual(JSON.parse(api.body), JSON.parse(r.run('status', '--json').stdout));
    // At the time of the request: a new ticket shows up straight away.
    r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
    const again = JSON.parse((await request(port, { pathName: '/api/state' })).body);
    assert.deepEqual(again, JSON.parse(r.run('status', '--json').stdout));
    assert.ok(again.tickets.some(t => t.id === '0002'));
    assert.equal((await request(port, { pathName: '/api/state?x=1' })).status, 200, 'a query string is ignored');
    for (const pathName of ['/nope', '/api', '/api/state/x', '/index.html', '//api/state'])
      assert.equal((await request(port, { pathName })).status, 404, pathName);
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'])
      for (const pathName of ['/', '/api/state'])
        assert.equal((await request(port, { method, pathName })).status, 405, `${method} ${pathName}`);
  } finally { await stop(p); }
});

test('0031 AC2: the server never writes to the repo', async () => {
  const r = panelRepo({ worktrees: 'true' });
  assert.equal(r.run('start', '1').status, 0);
  const snapshot = () => {
    const files = [];
    const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else files.push(`${path.relative(r.dir, f)} ${fs.statSync(f).mtimeMs} ${fs.statSync(f).size}`); } };
    walk(r.dir);
    // GIT_OPTIONAL_LOCKS=0 stops this git status refreshing .git/index itself.
    const st = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: r.dir, encoding: 'utf8', env: { ...env, GIT_OPTIONAL_LOCKS: '0' } }).stdout;
    return files.sort().join('\n') + st + r.g('rev-parse', 'HEAD');
  };
  const before = snapshot();
  assert.equal(snapshot(), before, 'the snapshot itself changes nothing');
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  try {
    for (const pathName of ['/', '/api/state', '/nope']) await request(port, { pathName });
    await request(port, { method: 'POST', pathName: '/api/state' });
    await request(port, { host: 'evil.example' });
  } finally { await stop(p); }
  assert.equal(snapshot(), before);
});

test('0031 AC4: a status change in this checkout or in another worktree shows in the next /api/state', async () => {
  const r = panelRepo({ worktrees: 'true' });
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', status: 'ready' }));
  r.g('add', '-A'); r.g('commit', '-qm', 'two');
  assert.equal(r.run('start', '1').status, 0);
  const wt = r.g('worktree', 'list', '--porcelain').split('\n').filter(l => l.startsWith('worktree ')).map(l => fs.realpathSync(l.slice(9)))[1];
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  const statusOf = async id => JSON.parse((await request(port, { pathName: '/api/state' })).body).tickets.find(t => t.id === id).status;
  try {
    assert.equal(await statusOf('0001'), 'building');
    spawnSync(process.execPath, [CLI, 'set', '1', 'status', 'reviewing'], { cwd: wt, env }); // uncommitted, in the worktree
    assert.equal(await statusOf('0001'), 'reviewing');
    spawnSync(process.execPath, [CLI, 'set', '2', 'status', 'blocked'], { cwd: r.dir, env });
    assert.equal(await statusOf('0002'), 'blocked');
  } finally { await stop(p); }
});

test('0031 AC4: the page polls /api/state every 2 seconds, says when it is disconnected and recovers', () => {
  const html = page();
  assert.match(html, /fetch\(['"]\/api\/state['"]/);
  assert.match(html, /POLL_MS\s*=\s*2000\b/);
  assert.match(html, /async function poll\(\) \{\n\s*setTimeout\(poll,\s*POLL_MS\)/, 'schedules the next poll before this one starts');
  assert.match(html, /disconnected/i);
  assert.doesNotMatch(html, /location\.reload/, 'no page reloads');
});

// A state with one ticket in every status, as speck status --json gives it.
const T = (id, status, o = {}) => ({ id, title: `Ticket ${id}`, status, priority: 2, size: 'S', risk: 'low', path: `speck/tickets/${id}-x.md`, worktree: null,
  acceptance_criteria: ['One.', 'Two.'], blocked_question: null, lint: { errors: 0, warnings: 0 }, rounds: [], waiting_on: [], ...o });
const round = (n, tokens) => ({ round: n, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens });

test('0031 AC3: the model sorts tickets into Shaping, the Queue and Shipped, and leaves cancelled tickets out', () => {
  const model = panelModel();
  const state = {
    tickets: [
      T('0001', 'draft', { lint: { errors: 2, warnings: 1 } }),
      T('0002', 'blocked', { blocked_question: 'A or B?' }),
      T('0003', 'approved'),
      T('0004', 'building', { worktree: '/tmp/wt/0004' }),
      T('0005', 'reviewing', { rounds: [round(1, 10), round(2, 20)] }),
      T('0006', 'ready', { waiting_on: ['0009', '0004'] }),
      T('0007', 'ready'),
      T('0008', 'cancelled'),
      T('0010', 'draft'),
    ],
    ideas: [
      { path: 'speck/ideas/a.md', title: 'A', status: 'idea' },
      { path: 'speck/ideas/b.md', title: 'B', status: 'ticketed (0001)' },
      { path: 'speck/ideas/c.md', title: 'C', status: null },
    ],
  };
  const m = model(state);
  const ids = list => list.map(t => t.id);
  assert.deepEqual(ids(m.drafts), ['0001', '0010']);
  assert.deepEqual(m.drafts[0].acceptance_criteria, ['One.', 'Two.']);
  assert.deepEqual(m.ideas.map(i => i.title), ['A', 'C'], 'ticketed ideas are left out');
  assert.deepEqual(ids(m.needsYou), ['0002', '0003']);
  assert.deepEqual(ids(m.running), ['0004', '0005']);
  assert.equal(m.running[0].round, null);
  assert.equal(m.running[1].round, 2, 'latest round number while reviewing');
  assert.deepEqual(m.upNext.map(t => [t.rank, t.id, t.waiting_on]), [[1, '0006', ['0009', '0004']], [2, '0007', []]], 'numbered in JSON order');
  const shown = [...m.drafts, ...m.needsYou, ...m.running, ...m.upNext, ...m.shipped];
  assert.ok(!shown.some(t => t.id === '0008'), 'cancelled is not shown');
});

test('0031 AC3: Shipped shows the 5 latest finished done tickets, newest first, with rounds, tokens and minutes', () => {
  const model = panelModel();
  const done = (id, started, finished, rounds = []) => T(id, 'done', { started, finished, rounds });
  const state = {
    tickets: [
      done('0011', '2026-10-01T10:00:00Z', '2026-10-01T10:04:00Z', [round(1, 100), round(2, 50)]),
      done('0012', '2026-10-02T10:00:00Z', '2026-10-02T10:09:30Z'),
      done('0013', undefined, '2026-10-03T10:00:00Z', [round(1, 7)]),
      done('0014', '2026-10-04T10:00:00Z', '2026-10-04T10:01:00Z'),
      done('0015', '2026-10-05T10:00:00Z', '2026-10-05T10:02:00Z'),
      done('0016', '2026-10-06T10:00:00Z', '2026-10-06T10:03:00Z'),
      done('0017', '2026-10-07T10:00:00Z', undefined),
      done('0018', '2026-09-01T10:00:00Z', 'not a date'),
      T('0019', 'cancelled', { started: '2026-10-08T10:00:00Z', finished: '2026-10-08T10:01:00Z' }),
    ],
    ideas: [],
  };
  const m = model(state);
  assert.deepEqual(m.shipped.map(t => t.id), ['0016', '0015', '0014', '0013', '0012'], 'the 5 with the latest finished time, newest first');
  assert.equal(m.shippedTotal, 8, 'every done ticket, not cancelled');
  const row = id => m.shipped.find(t => t.id === id);
  assert.equal(row('0016').minutes, 3);
  assert.equal(row('0012').minutes, 10, 'rounded');
  assert.equal(row('0013').minutes, null, 'no started time');
  assert.equal(row('0013').roundCount, 1);
  assert.equal(row('0013').tokens, 7);

  // With fewer than 5 finished, done tickets with no finished time come after them.
  const few = model({ tickets: [done('0011', '2026-10-01T10:00:00Z', '2026-10-01T10:04:00Z', [round(1, 100), round(2, 50)]), done('0017', '2026-10-07T10:00:00Z', undefined), done('0018', undefined, 'not a date')], ideas: [] });
  assert.deepEqual(few.shipped.map(t => t.id), ['0011', '0017', '0018']);
  assert.deepEqual([few.shipped[0].roundCount, few.shipped[0].tokens, few.shipped[0].minutes], [2, 150, 4]);
  assert.equal(few.shipped[1].minutes, null, 'no finished time');
});

test('0031 AC3: the page has the mockup\'s areas, groups and dark style, without the sample banner or "later" buttons', () => {
  const html = page();
  for (const text of ['Shaping', 'Queue', 'Shipped', 'Needs you', 'Running', 'Up next', 'waiting on '])
    assert.ok(html.includes(text), text);
  const mockup = fs.readFileSync(path.join(ROOT, 'docs', 'panel-mockup.html'), 'utf8');
  const vars = mockup.match(/:root \{[\s\S]*?\}/)[0];
  assert.ok(html.includes(vars), 'same colour palette as the mockup');
  assert.match(html, /border-radius: 0 !important/, 'square corners');
  assert.doesNotMatch(html, /class="sample"/);
  assert.doesNotMatch(html, /· later/);
});

test('0031 AC5: ticket and idea text is shown as text, never as HTML', () => {
  const html = page();
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(script, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|DOMParser|createContextualFragment/);
  assert.match(script, /textContent/);
});

// Runs the whole page script against a minimal DOM, fetch and timer, so the view can be checked without a browser.
function fakePage(responses) {
  const nodes = new Map();
  const make = tag => {
    const n = { tagName: tag, className: '', hidden: false, children: [], listeners: {}, _text: '' };
    Object.defineProperty(n, 'textContent', {
      get: () => n._text + n.children.map(c => c.textContent).join(''),
      set: v => { n.children = []; n._text = String(v); },
    });
    n.appendChild = c => { n.children.push(c); return c; };
    n.replaceChildren = (...cs) => { n._text = ''; n.children = cs; };
    n.addEventListener = (type, fn) => { n.listeners[type] = fn; };
    return n;
  };
  const document = {
    createElement: make,
    createTextNode: t => ({ tagName: '#text', children: [], textContent: String(t) }),
    getElementById: id => { if (!nodes.has(id)) nodes.set(id, make('div')); return nodes.get(id); },
  };
  const timers = [];
  const fetch = async () => {
    const next = responses.shift();
    if (next instanceof Error) throw next;
    if (next && next.then) return next; // a request the test settles later, or never
    if (next && next.pendingBody) return { ok: true, status: 200, json: () => next.pendingBody };
    if (next && next.status) return { ok: false, status: next.status, json: async () => next.body };
    return { ok: true, status: 200, json: async () => next };
  };
  const script = page().match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, { document, fetch, setTimeout: fn => timers.push(fn), AbortController, Date, Math, JSON, String, Number, Array, Set, console });
  const all = (n, out = []) => { out.push(n); for (const c of n.children || []) all(c, out); return out; };
  const settle = () => new Promise(r => setTimeout(r, 20));
  return { byId: id => document.getElementById(id), timers, all, settle };
}

test('0031 AC5: a title like <b>x</b> is rendered as those characters, in every area', async () => {
  const evil = '<b>x</b>';
  const state = {
    tickets: [
      T('0001', 'draft', { title: evil, acceptance_criteria: ['<img src=x onerror=alert(1)>'] }),
      T('0002', 'blocked', { title: evil, blocked_question: '<script>alert(1)</script>' }),
      T('0003', 'building', { title: evil }), T('0004', 'ready', { title: evil }),
      T('0005', 'done', { title: evil, finished: '2026-10-01T10:00:00Z' }),
    ],
    ideas: [{ path: 'speck/ideas/a.md', title: '<i>idea</i>', status: 'idea' }],
  };
  const p = fakePage([state]);
  await p.settle();
  for (const area of ['shaping', 'needs', 'running', 'next', 'shipped']) {
    const nodes = p.all(p.byId(area));
    assert.ok(p.byId(area).textContent.includes(evil), `${area} shows the title literally`);
    assert.ok(!nodes.some(n => n.tagName === 'b' && n.textContent === 'x'), `${area} made no <b> from the title`);
  }
  assert.ok(p.byId('shaping').textContent.includes('<i>idea</i>'));
  assert.ok(p.byId('needs').textContent.includes('<script>alert(1)</script>'));
  // Open the draft: its criteria are text too.
  const draft = p.all(p.byId('shaping')).find(n => n.listeners.click);
  draft.listeners.click();
  assert.ok(p.byId('shaping').textContent.includes('<img src=x onerror=alert(1)>'));
  assert.ok(!p.all(p.byId('shaping')).some(n => n.tagName === 'img'));
});

test('0031 AC4: the page shows when it is disconnected, keeps polling and recovers by itself', async () => {
  const one = { tickets: [T('0001', 'ready')], ideas: [] };
  const moved = { tickets: [T('0001', 'building')], ideas: [] };
  const p = fakePage([one, new Error('connection refused'), new Error('connection refused'), moved]);
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  assert.match(p.byId('next').textContent, /0001/);
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('offline').hidden, false, 'says it is disconnected');
  assert.match(p.byId('pills').textContent, /disconnected/);
  assert.match(p.byId('next').textContent, /0001/, 'keeps the last state');
  p.timers.shift()(); await p.settle();
  assert.equal(p.timers.length, 1, 'still polling while disconnected');
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'recovered');
  assert.match(p.byId('running').textContent, /0001/, 'the ticket moved to Running');
  assert.doesNotMatch(p.byId('next').textContent, /0001/);
});

test('0031 AC4: when the server answers but cannot read the tickets, the page shows its error and recovers', async () => {
  const one = { tickets: [T('0001', 'ready')], ideas: [] };
  const p = fakePage([one, { status: 500, body: { error: 'speck/tickets/0002-x.md: Ticket has no frontmatter.' } }, one]);
  await p.settle();
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('offline').hidden, false);
  assert.match(p.byId('offline').textContent, /couldn't read the tickets: speck\/tickets\/0002-x\.md: Ticket has no frontmatter\./);
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('offline').hidden, true);
});

test('0031 AC2: an unreadable ticket gives /api/state a 500 with a plain error, and the server keeps running', async () => {
  const r = panelRepo();
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  try {
    fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0002-broken.md'), 'no frontmatter here\n');
    const res = await request(port, { pathName: '/api/state' });
    assert.equal(res.status, 500);
    assert.match(JSON.parse(res.body).error, /frontmatter/);
    fs.rmSync(path.join(r.dir, 'speck', 'tickets', '0002-broken.md'));
    assert.equal((await request(port, { pathName: '/api/state' })).status, 200);
  } finally { await stop(p); }
});

test('0031 AC1: the page header names the main checkout, even when the panel runs in a worktree', async () => {
  const r = panelRepo({ worktrees: 'true' });
  assert.equal(r.run('start', '1').status, 0);
  const wt = r.g('worktree', 'list', '--porcelain').split('\n').filter(l => l.startsWith('worktree ')).map(l => l.slice(9))[1];
  const port = await freePort();
  const p = await startPanel(wt, ['--port', String(port)]);
  try {
    const body = (await request(port)).body;
    assert.ok(body.includes(`<code>${path.basename(r.dir)}</code>`), 'main checkout name');
    assert.ok(!body.includes('{{repo}}') && !body.includes('{{base}}'));
  } finally { await stop(p); }
});

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); promise.resolve = resolve; return promise; };

test('0031 AC4: a request that never answers, or whose body never arrives, still shows as disconnected and recovers', async () => {
  const one = { tickets: [T('0001', 'ready')], ideas: [] };
  const moved = { tickets: [T('0001', 'building')], ideas: [] };
  const stalled = deferred();
  const p = fakePage([one, stalled, { pendingBody: new Promise(() => {}) }, moved]);
  await p.settle();
  assert.equal(p.timers.length, 1);
  p.timers.shift()(); await p.settle(); // this request never answers
  assert.equal(p.timers.length, 1, 'the next poll is already scheduled');
  assert.equal(p.byId('offline').hidden, true, 'not yet overdue');
  p.timers.shift()(); await p.settle(); // overdue: disconnected; this one's body never arrives
  assert.equal(p.byId('offline').hidden, false, 'says it is disconnected');
  assert.equal(p.timers.length, 1);
  p.timers.shift()(); await p.settle(); // overdue again, then the server answers
  assert.equal(p.byId('offline').hidden, true, 'recovered');
  assert.match(p.byId('running').textContent, /0001/);
  // The abandoned request answering late doesn't put the old state back.
  stalled.resolve({ ok: true, status: 200, json: async () => one });
  await p.settle();
  assert.match(p.byId('running').textContent, /0001/);
  assert.doesNotMatch(p.byId('next').textContent, /0001/);
});

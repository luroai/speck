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
  assert.deepEqual(m.ideas.map(i => i.title), ['A', 'C', 'B'], 'every idea, ticketed ones last (0033)');
  assert.deepEqual(ids(m.queue), ['0002', '0003', '0004', '0005', '0006', '0007'], 'one list: in flight, then ready (0034)');
  assert.deepEqual(m.queue.map(t => t.waiting_on), [[], [], [], [], ['0009', '0004'], []]);
  const shown = [...m.drafts, ...m.queue, ...m.shipped];
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
  for (const text of ['Shaping', 'Queue', 'Shipped', 'waiting on '])
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
      T('0001', 'draft', { title: evil, acceptance_criteria: ['<img src=x onerror=alert(1)>'], problem: '<u>problem</u>', notes: '<u>notes</u>', lint_messages: { errors: ['<u>lint</u>'], warnings: [] } }),
      T('0002', 'blocked', { title: evil, blocked_question: '<script>alert(1)</script>' }),
      T('0003', 'building', { title: evil }), T('0004', 'ready', { title: evil }),
      T('0005', 'done', { title: evil, finished: '2026-10-01T10:00:00Z' }),
    ],
    ideas: [{ path: 'speck/ideas/a.md', title: '<i>idea</i>', status: 'idea', body: '<s>body</s>' }],
  };
  const p = fakePage([state]);
  await p.settle();
  for (const area of ['shaping', 'queue', 'shipped']) {
    const nodes = p.all(p.byId(area));
    assert.ok(p.byId(area).textContent.includes(evil), `${area} shows the title literally`);
    assert.ok(!nodes.some(n => n.tagName === 'b' && n.textContent === 'x'), `${area} made no <b> from the title`);
  }
  assert.ok(p.byId('queue').textContent.includes('<script>alert(1)</script>'));
  // Open the draft: its criteria, sections and lint messages are text too (0033).
  const draft = p.all(p.byId('shaping')).find(n => n.listeners.click);
  draft.listeners.click();
  for (const s of ['<img src=x onerror=alert(1)>', '<u>problem</u>', '<u>notes</u>', '<u>lint</u>'])
    assert.ok(p.byId('shaping').textContent.includes(s), s);
  assert.ok(!p.all(p.byId('shaping')).some(n => ['img', 'u'].includes(n.tagName)));
  // Ideas are behind the Ideas toggle (0033): title and note are text.
  p.all(p.byId('shaping-toggle')).filter(n => n.listeners.click)[1].listeners.click();
  assert.ok(p.byId('shaping').textContent.includes('<i>idea</i>'));
  p.all(p.byId('shaping')).find(n => n.listeners.click).listeners.click();
  assert.ok(p.byId('shaping').textContent.includes('<s>body</s>'));
  assert.ok(!p.all(p.byId('shaping')).some(n => ['i', 's'].includes(n.tagName)));
});

test('0031 AC4: the page shows when it is disconnected, keeps polling and recovers by itself', async () => {
  const one = { tickets: [T('0001', 'ready')], ideas: [] };
  const moved = { tickets: [T('0001', 'building')], ideas: [] };
  const p = fakePage([one, new Error('connection refused'), new Error('connection refused'), moved]);
  await p.settle();
  assert.equal(p.byId('offline').hidden, true);
  assert.match(p.byId('queue').textContent, /0001.*Queued/);
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('offline').hidden, false, 'says it is disconnected');
  assert.match(p.byId('pills').textContent, /disconnected/);
  assert.match(p.byId('queue').textContent, /0001.*Queued/, 'keeps the last state');
  p.timers.shift()(); await p.settle();
  assert.equal(p.timers.length, 1, 'still polling while disconnected');
  p.timers.shift()(); await p.settle();
  assert.equal(p.byId('offline').hidden, true, 'recovered');
  assert.match(p.byId('queue').textContent, /0001.*building/, 'the ticket is now building');
  assert.doesNotMatch(p.byId('queue').textContent, /Queued/);
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
  assert.match(p.byId('queue').textContent, /0001.*building/);
  // The abandoned request answering late doesn't put the old state back.
  stalled.resolve({ ok: true, status: 200, json: async () => one });
  await p.settle();
  assert.match(p.byId('queue').textContent, /0001.*building/);
  assert.doesNotMatch(p.byId('queue').textContent, /Queued/);
});

// ---------- 0033: everything needed for Gate 1 in Shaping ----------

const full = (id, o = {}) => T(id, 'draft', { problem: `Problem of ${id}.`, outcome: `Outcome of ${id}.`, out_of_scope: '- Not this.', notes: '- A note.\n- Self-check: no changes',
  self_check: 'no changes', lint_messages: { errors: [], warnings: [] }, after: [], ...o });
const idea = (name, status, body = `# ${name}\n\nStatus: ${status}\n\nSome <b>text</b>.\n`) => ({ path: `speck/ideas/${name}.md`, title: name, status, body });
const click = n => n.listeners.click({ stopPropagation() {} });
const toggles = p => p.all(p.byId('shaping-toggle')).filter(n => n.listeners.click);
const items = p => p.byId('shaping').children.filter(n => /\bitem\b/.test(n.className));

test('0033 AC2: the page header shows the repo, base branch and connection status only, with no counts', async () => {
  const header = page().match(/<header>([\s\S]*?)<\/header>/)[1];
  assert.match(header, /\{\{repo\}\}/);
  assert.match(header, /\{\{base\}\}/);
  assert.match(header, /id="pills"/);
  const state = { tickets: [T('0001', 'draft'), T('0002', 'blocked'), T('0003', 'ready'), T('0004', 'done')], ideas: [idea('A', 'idea')] };
  const p = fakePage([state, new Error('down')]);
  await p.settle();
  const pills = p.byId('pills');
  assert.equal(pills.children.length, 1, 'only the connection status');
  assert.match(pills.textContent, /^live/);
  assert.doesNotMatch(pills.textContent, /needs you|running|up next|draft|idea|shipped/i);
  p.timers.shift()(); await p.settle();
  assert.equal(pills.children.length, 1);
  assert.match(pills.textContent, /disconnected/);
});

test('0033 AC3: Shaping has a Tickets / Ideas toggle, Tickets first, one list at a time, kept through refreshes', async () => {
  const state = { tickets: [full('0001'), full('0002')], ideas: [idea('Board', 'idea')] };
  const p = fakePage([state, state, state]);
  await p.settle();
  const [tickets, ideas] = toggles(p);
  assert.match(tickets.textContent, /^Tickets/);
  assert.match(ideas.textContent, /^Ideas/);
  assert.match(tickets.className, /\bon\b/, 'Tickets selected on load');
  assert.doesNotMatch(ideas.className, /\bon\b/);
  assert.match(p.byId('shaping-section').className, /\btickets\b/);
  assert.deepEqual(items(p).map(n => /\bticket\b/.test(n.className)), [true, true], 'only tickets');
  assert.doesNotMatch(p.byId('shaping').textContent, /Board/);

  click(ideas);
  assert.match(p.byId('shaping-section').className, /\bideas\b/);
  assert.match(toggles(p)[1].className, /\bon\b/);
  assert.deepEqual(items(p).map(n => /\bidea\b/.test(n.className)), [true], 'only ideas');
  assert.doesNotMatch(p.byId('shaping').textContent, /0001/);

  p.timers.shift()(); await p.settle(); // the 2-second refresh
  assert.match(p.byId('shaping-section').className, /\bideas\b/, 'still on Ideas after a refresh');
  assert.match(p.byId('shaping').textContent, /Board/);
  click(toggles(p)[0]);
  assert.match(p.byId('shaping').textContent, /0001/);
  p.timers.shift()(); await p.settle();
  assert.match(p.byId('shaping-section').className, /\btickets\b/);
});

test('0033 AC3: tickets and ideas each have their own accent colour on the toggle, the section top edge and each item', () => {
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  const colourOf = selector => {
    const rule = css.split('\n').find(l => l.trim().startsWith(selector + ' {') || l.trim().startsWith(selector + ','));
    assert.ok(rule, `a rule for ${selector}`);
    return (rule.match(/var\(--(accent|idea)\)/) || [])[1];
  };
  const pairs = [['.toggle.tickets.on', '.toggle.ideas.on'], ['#shaping-section.tickets', '#shaping-section.ideas'], ['.item.ticket', '.item.idea']];
  for (const [t, i] of pairs) {
    assert.equal(colourOf(t), 'accent', t);
    assert.equal(colourOf(i), 'idea', i);
  }
  assert.match(css, /#shaping-section\.tickets \{[^}]*border-top:[^}]*var\(--accent\)/);
  assert.match(css, /\.item\.ticket \{[^}]*border-left:[^}]*var\(--accent\)/);
  assert.match(css, /\.item\.idea \{[^}]*border-left:[^}]*var\(--idea\)/);
});

test('0033 AC4: the Tickets list shows drafts in JSON order, and an open ticket shows everything needed to judge it', async () => {
  const lint = { errors: ['size L can never be ready: split it into sibling tickets.'], warnings: ['"Out of scope" is empty. Say what this ticket will not do.'] };
  const state = {
    tickets: [
      full('0003', { title: 'Third', priority: 1, size: 'M', risk: 'high', lint: { errors: 1, warnings: 1 }, lint_messages: lint, after: ['0002', '0009'], waiting_on: ['0009'] }),
      T('0002', 'done'),
      full('0001', { title: 'First', acceptance_criteria: ['One.', 'Two.', 'Three.'], problem: null, notes: null }),
      T('0004', 'ready'),
    ],
    ideas: [],
  };
  const p = fakePage([state, state, state]);
  await p.settle();
  const list = items(p);
  assert.deepEqual(list.map(n => n.textContent.slice(0, 4)), ['0003', '0001'], 'drafts only, in JSON order');
  const first = list[0].textContent;
  for (const s of ['Third', 'P1', 'M', 'high', '2 criteria', 'lint: 1 error', '1 warning']) assert.ok(first.includes(s), s);
  assert.ok(list[1].textContent.includes('3 criteria') && list[1].textContent.includes('lint passes'));

  click(list[0]);
  let open = items(p)[0].textContent;
  for (const s of ['Problem', 'Problem of 0003.', 'Outcome', 'Outcome of 0003.', 'Acceptance criteria', 'One.', 'Two.', 'Out of scope', '- Not this.',
    'Notes', '- A note.', 'Readiness', 'Size M, risk high', '2 criteria', lint.errors[0], lint.warnings[0], '0002 done', '0009 not done'])
    assert.ok(open.includes(s), s);
  const ol = p.all(items(p)[0]).find(n => n.tagName === 'ol');
  assert.deepEqual(ol.children.map(li => li.textContent), ['One.', 'Two.'], 'numbered criteria');
  assert.ok(!items(p)[1].textContent.includes('Readiness'), 'only the clicked ticket opens');

  p.timers.shift()(); await p.settle();
  assert.ok(items(p)[0].textContent.includes('Readiness'), 'stays open through a refresh');
  click(items(p)[1]);
  open = items(p)[1].textContent;
  assert.ok(open.includes('lint passes'), 'no lint messages');
  assert.ok(!open.includes('Problem of'), 'a missing section is not filled in');
  click(items(p)[0]);
  assert.ok(!items(p)[0].textContent.includes('Readiness'), 'clicking again closes it');
  p.timers.shift()(); await p.settle();
  assert.ok(!items(p)[0].textContent.includes('Readiness'), 'stays closed');
  assert.ok(items(p)[1].textContent.includes('Readiness'));
});

test('0033 AC5: the Ideas list shows every idea, not-ticketed first, and clicking one shows its note as text', async () => {
  const state = { tickets: [], ideas: [idea('Done one', 'ticketed (0001)'), idea('Fresh', 'idea'), idea('No status', null, 'Just <i>text</i>.\n'), idea('Later', 'ticketed')] };
  const p = fakePage([state, state]);
  await p.settle();
  click(toggles(p)[1]);
  const list = items(p);
  const titles = list.map(n => n.children[0].textContent);
  assert.deepEqual(titles.map(t => t.replace(/^idea/, '')), ['Fresh', 'No status', 'Done one', 'Later']);
  assert.ok(list[0].textContent.includes('idea') && list[2].textContent.includes('ticketed (0001)'), 'each with its status');
  assert.ok(!list[1].textContent.includes('Just'), 'closed by default');
  click(list[1]);
  assert.ok(items(p)[1].textContent.includes('Just <i>text</i>.'), 'the note, as text');
  assert.ok(!p.all(items(p)[1]).some(n => n.tagName === 'i'));
  p.timers.shift()(); await p.settle();
  assert.ok(items(p)[1].textContent.includes('Just <i>text</i>.'), 'still open after a refresh');
  click(items(p)[1]);
  assert.ok(!items(p)[1].textContent.includes('Just'), 'clicking again closes it');
});

// ---------- 0034: the queue as one list with progress bars ----------

const queueRows = p => p.byId('queue').children.filter(n => /\bq\b/.test(n.className));
const stagesOf = row => (function find(n) { if (/\bstages\b/.test(n.className || '')) return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);
const stepText = row => stagesOf(row).children.map(s => s.textContent);
const stepState = row => stagesOf(row).children.map(s => (/\bd\b/.test(s.className) ? 'done' : /\bnow\b/.test(s.className) ? 'now' : ''));
const steps = t => t.steps.map(s => s.state || '');

test('0034 AC1: the queue is one list, in-flight tickets first, then ready ones, each in JSON order, with no group headings', async () => {
  const model = panelModel();
  const state = { tickets: [T('0001', 'ready'), T('0002', 'approved'), T('0003', 'draft'), T('0004', 'building'), T('0005', 'ready'), T('0006', 'blocked'),
    T('0007', 'reviewing', { rounds: [round(1, 1)] }), T('0008', 'done'), T('0009', 'cancelled')], ideas: [] };
  assert.deepEqual(model(state).queue.map(t => t.id), ['0002', '0004', '0006', '0007', '0001', '0005']);
  const html = page();
  for (const h of ['Needs you', 'Running', 'Up next']) assert.ok(!html.includes(h), `no ${h} heading`);
  assert.ok(!/id="(needs|running|next)(-h)?"/.test(html), 'no group containers');
  const p = fakePage([state]);
  await p.settle();
  assert.deepEqual(queueRows(p).map(r => r.textContent.slice(0, 4)), ['0002', '0004', '0006', '0007', '0001', '0005']);
  assert.ok(!p.byId('queue').children.some(n => /\bgroup\b/.test(n.className)), 'no group rows');
});

test('0034 AC2: every queued ticket has a five-step bar, with done and current steps from status, self_check and rounds', () => {
  const model = panelModel();
  const m = model({ tickets: [
    T('0001', 'building'),
    T('0002', 'building', { self_check: 'no changes' }),
    T('0003', 'reviewing', { self_check: 'no changes' }),
    T('0004', 'reviewing'),
    T('0005', 'reviewing', { rounds: [round(1, 1), round(2, 1)] }),
    T('0006', 'building', { rounds: [round(1, 1)] }),
    T('0007', 'approved', { rounds: [round(1, 1), round(3, 1)] }),
    T('0008', 'blocked', { rounds: [round(1, 1)] }),
    T('0009', 'blocked'),
    T('0010', 'ready'),
    T('0011', 'building', { self_check: '' }),
  ], ideas: [] });
  const by = id => m.queue.find(t => t.id === id);
  for (const t of m.queue) assert.equal(t.steps.length, 5, t.id);
  assert.deepEqual(by('0001').steps.map(s => s.label), ['Build', 'Self-check', 'Review', 'Approve', 'Ship']);
  assert.deepEqual(steps(by('0001')), ['now', '', '', '', '']);
  assert.deepEqual(steps(by('0002')), ['done', 'now', '', '', ''], 'self_check set, still building');
  assert.deepEqual(steps(by('0003')), ['done', 'done', 'now', '', ''], 'self_check set and reviewing');
  assert.deepEqual(steps(by('0004')), ['now', '', '', '', ''], 'reviewing without self_check or rounds');
  assert.deepEqual(steps(by('0005')), ['done', 'done', 'now', '', '']);
  assert.equal(by('0005').steps[2].label, 'Review 2', 'latest round number');
  assert.deepEqual(steps(by('0006')), ['done', 'done', 'now', '', ''], 'a round, back to building to fix');
  assert.equal(by('0006').steps[2].label, 'Review 1');
  assert.deepEqual(steps(by('0007')), ['done', 'done', 'done', 'done', 'now'], 'approved: Ship is current');
  assert.equal(by('0007').steps[2].label, 'Review 3', 'latest round, not the count');
  assert.deepEqual(steps(by('0008')), ['done', 'done', 'now', '', '']);
  assert.deepEqual(steps(by('0009')), ['now', '', '', '', '']);
  assert.deepEqual(steps(by('0011')), ['now', '', '', '', ''], 'an empty self_check is not set');
});

test('0034 AC2: the bar is drawn on the page with its labels, done steps and current step', async () => {
  const state = { tickets: [T('0001', 'reviewing', { self_check: 'x', rounds: [round(1, 1), round(2, 1)] }), T('0002', 'approved', { rounds: [round(1, 1)] })], ideas: [] };
  const p = fakePage([state]);
  await p.settle();
  const [a, b] = queueRows(p);
  assert.deepEqual(stepText(a), ['Build', 'Self-check', 'Review 2', 'Approve', 'Ship']);
  assert.deepEqual(stepState(a), ['done', 'done', 'now', '', '']);
  assert.deepEqual(stepState(b), ['done', 'done', 'done', 'done', 'now']);
});

test('0034 AC3: a blocked ticket is red on its left edge and current step, with its question under it, and nothing else is red', async () => {
  const state = { tickets: [T('0001', 'blocked', { blocked_question: 'Split it or keep it?', self_check: 'x' }), T('0002', 'approved', { risk: 'high' }),
    T('0003', 'building', { risk: 'high' }), T('0004', 'reviewing'), T('0005', 'ready', { waiting_on: ['0001'] })], ideas: [] };
  assert.deepEqual(panelModel()(state).queue.map(t => t.red), [true, false, false, false, false]);
  const p = fakePage([state]);
  await p.settle();
  const rows = queueRows(p);
  const red = n => /\b(bad|blocked)\b/.test(n.className || '');
  assert.match(rows[0].className, /\bblocked\b/);
  const now = stagesOf(rows[0]).children.find(s => /\bnow\b/.test(s.className));
  assert.equal(now.textContent, 'Self-check');
  assert.match(now.className, /\bbad\b/);
  assert.equal(stagesOf(rows[0]).children.filter(red).length, 1, 'only the current step');
  assert.ok(rows[0].textContent.includes('Split it or keep it?'));
  for (const r of rows.slice(1)) assert.ok(!p.all(r).some(red), `${r.textContent.slice(0, 4)} has nothing red`);
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(css, /\.q\.blocked \{[^}]*border-left:[^}]*var\(--bad\)/);
  assert.match(css, /\.stages \.now\.bad \{[^}]*border-top-color: var\(--bad\)/);
  assert.match(css, /\.q \.tag\.high \{[^}]*color: var\(--warn\)/, 'a high-risk tag in the queue is not red');
});

test('0034 AC4: a ready ticket shows Queued and an empty bar, plus waiting on <ids> when it has any', async () => {
  const state = { tickets: [T('0001', 'ready', { self_check: 'x', rounds: [round(1, 1)] }), T('0002', 'ready', { waiting_on: ['0009', '0004'] })], ideas: [] };
  assert.deepEqual(steps(panelModel()(state).queue[0]), ['', '', '', '', '']);
  const p = fakePage([state]);
  await p.settle();
  const [a, b] = queueRows(p);
  assert.ok(a.textContent.includes('Queued'));
  assert.deepEqual(stepState(a), ['', '', '', '', ''], 'no step done or current');
  assert.deepEqual(stepText(a), ['Build', 'Self-check', 'Review 1', 'Approve', 'Ship'], 'AC2: Review <n> while it has rounds');
  assert.ok(!a.textContent.includes('waiting on'));
  assert.ok(b.textContent.includes('Queued') && b.textContent.includes('waiting on 0009, 0004'));
});

test('0034 AC5: an in-flight ticket shows its worktree path and the whole minutes since started', async () => {
  const ago = ms => new Date(Date.now() - ms).toISOString();
  const state = { tickets: [
    T('0001', 'building', { worktree: '/tmp/wt/0001', started: ago(7.9 * 60000) }),
    T('0002', 'reviewing', { started: ago(30000) }),
    T('0003', 'blocked', { started: 'not a date' }),
    T('0004', 'ready', { worktree: '/tmp/wt/0004', started: ago(60 * 60000) }),
  ], ideas: [] };
  const m = panelModel()(state);
  assert.deepEqual(m.queue.map(t => t.minutes), [7, 0, null, null]);
  const p = fakePage([state]);
  await p.settle();
  const [a, b, c, d] = queueRows(p);
  assert.ok(a.textContent.includes('/tmp/wt/0001') && a.textContent.includes('7 min'));
  assert.ok(b.textContent.includes('0 min') && !b.textContent.includes('worktree'));
  assert.ok(!c.textContent.includes('min') && !c.textContent.includes('worktree'));
  assert.ok(!d.textContent.includes('/tmp/wt/0004') && !d.textContent.includes('min'), 'not for a ready ticket');
});

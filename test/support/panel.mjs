// Shared helpers for the panel tests. Put each ticket's new panel tests in their own file
// (test/panel-<id>.test.mjs) and import what they need from here, so parallel builds don't clash.
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

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
export const PAGE = path.join(ROOT, 'templates', 'panel.html');
export const gitEnv = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
export const env = { ...process.env, ...gitEnv };
export const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
export const fm = (o = {}) => Object.entries({ id: '"0001"', title: 'Export bookings as CSV', status: 'draft', size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', ...o }).map(([k, v]) => `${k}: ${v}`).join('\n');

// A repo with speck installed and one ready ticket, committed.
export function panelRepo({ worktrees = 'false' } = {}) {
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

export const freePort = () => new Promise(resolve => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// Starts `speck panel` (from `cli`, or the repo's own CLI) and resolves once it has printed its URL.
export function startPanel(cwd, args, cli = CLI) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'panel', ...args], { cwd, env });
    let out = '', err = '';
    const done = setTimeout(() => { child.kill(); reject(new Error(`panel didn't start: ${out}${err}`)); }, 10000);
    child.stdout.on('data', d => { out += d; if (/http:\/\/127\.0\.0\.1:\d+/.test(out)) { clearTimeout(done); resolve({ child, out: () => out }); } });
    child.stderr.on('data', d => { err += d; });
    child.on('exit', code => { clearTimeout(done); reject(Object.assign(new Error(`panel exited ${code}: ${out}${err}`), { code, out, err })); });
  });
}
export const stop = p => new Promise(resolve => { p.child.removeAllListeners('exit'); p.child.on('exit', resolve); p.child.kill(); });

export function request(port, { method = 'GET', pathName = '/', host = `127.0.0.1:${port}` } = {}) {
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
export const page = () => fs.readFileSync(PAGE, 'utf8');
export function panelModel() {
  const m = page().match(/\/\/ ---- model[^\n]*\n([\s\S]*?)\/\/ ---- end model/);
  assert.ok(m, 'the page has a marked model section');
  const fn = vm.runInNewContext(`${m[1]}\npanelModel`, {});
  // Back through JSON, so the result's arrays and objects belong to this realm and compare strictly.
  return state => JSON.parse(JSON.stringify(fn(state)));
}

// A state with one ticket in every status, as speck status --json gives it.
export const T = (id, status, o = {}) => ({ id, title: `Ticket ${id}`, status, priority: 2, size: 'S', risk: 'low', path: `speck/tickets/${id}-x.md`, worktree: null,
  acceptance_criteria: ['One.', 'Two.'], blocked_question: null, lint: { errors: 0, warnings: 0 }, rounds: [], waiting_on: [], ...o });
export const round = (n, tokens) => ({ round: n, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens });

// Runs the whole page script against a minimal DOM, fetch and timer, so the view can be checked without a browser.
// `globals` replaces what the page sees, for example a `Date` whose clock the test moves (0040).
export function fakePage(responses, globals = {}) {
  const nodes = new Map();
  const make = tag => {
    const n = { tagName: tag, className: '', hidden: false, children: [], listeners: {}, _text: '' };
    Object.defineProperty(n, 'textContent', {
      get: () => n._text + n.children.map(c => c.textContent).join(''),
      set: v => { n.children = []; n._text = String(v); },
    });
    // Taking a node out of its parent counts in its `detached`, as a browser drops a selection inside a node it takes out (0040).
    const take = c => { if (c.parentNode) { c.parentNode.children = c.parentNode.children.filter(x => x !== c); c.detached = (c.detached || 0) + 1; } c.parentNode = n; };
    n.appendChild = c => { take(c); n.children.push(c); return c; };
    n.insertBefore = (c, ref) => { take(c); const i = ref ? n.children.indexOf(ref) : -1; if (i < 0) n.children.push(c); else n.children.splice(i, 0, c); return c; };
    n.removeChild = c => { n.children = n.children.filter(x => x !== c); c.detached = (c.detached || 0) + 1; c.parentNode = null; return c; };
    n.replaceChildren = (...cs) => { n._text = ''; for (const c of n.children) { c.detached = (c.detached || 0) + 1; c.parentNode = null; } for (const c of cs) take(c); n.children = cs; };
    n.addEventListener = (type, fn) => { n.listeners[type] = fn; };
    return n;
  };
  const document = {
    createElement: make,
    createTextNode: t => ({ tagName: '#text', children: [], textContent: String(t) }),
    getElementById: id => { if (!nodes.has(id)) nodes.set(id, make('div')); return nodes.get(id); },
  };
  const timers = [];
  const calls = []; // every fetch, so a test can check what the page sent
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    if (next && next.then) return next; // a request the test settles later, or never
    if (next && next.pendingBody) return { ok: true, status: 200, json: () => next.pendingBody };
    if (next && next.status) return { ok: false, status: next.status, json: async () => next.body };
    return { ok: true, status: 200, json: async () => next };
  };
  const script = page().match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, { document, fetch, setTimeout: fn => timers.push(fn), AbortController, Date, Math, JSON, String, Number, Array, Set, console, ...globals });
  const all = (n, out = []) => { out.push(n); for (const c of n.children || []) all(c, out); return out; };
  const settle = () => new Promise(r => setTimeout(r, 20));
  return { byId: id => document.getElementById(id), timers, all, settle, calls };
}

export const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); promise.resolve = resolve; return promise; };

export const full = (id, o = {}) => T(id, 'draft', { problem: `Problem of ${id}.`, outcome: `Outcome of ${id}.`, out_of_scope: '- Not this.', notes: '- A note.\n- Self-check: no changes',
  self_check: 'no changes', lint_messages: { errors: [], warnings: [] }, after: [], ...o });
export const idea = (name, status, body = `# ${name}\n\nStatus: ${status}\n\nSome <b>text</b>.\n`) => ({ path: `speck/ideas/${name}.md`, title: name, status, body });
export const click = n => n.listeners.click({ stopPropagation() {} });
export const toggles = p => p.all(p.byId('shaping-toggle')).filter(n => n.listeners.click);
export const items = p => p.byId('shaping').children.filter(n => /\bitem\b/.test(n.className));
export const top = item => item.children.find(n => /\bhead\b/.test(n.className)); // an item's top row, which opens and closes it (0039)

export const queueRows = p => p.byId('queue').children.filter(n => /\bq\b/.test(n.className));
export const stagesOf = row => (function find(n) { if (/\bstages\b/.test(n.className || '')) return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);
export const stepText = row => stagesOf(row).children.map(s => s.textContent);
export const stepState = row => stagesOf(row).children.map(s => (/\bd\b/.test(s.className) ? 'done' : /\bnow\b/.test(s.className) ? 'now' : ''));
export const steps = t => t.steps.map(s => s.state || '');

export function post(port, pathName, { origin = `http://127.0.0.1:${port}`, token, host = `127.0.0.1:${port}`, method = 'POST' } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Host: host };
    if (origin !== null) headers.Origin = origin;
    if (token !== undefined) headers['X-Speck-Token'] = token;
    const req = http.request({ host: '127.0.0.1', port, method, path: pathName, headers }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}
export const tokenOf = html => (html.match(/const TOKEN = '([0-9a-f]+)';/) || [])[1];
export const readyPath = id => `/api/tickets/${id}/ready`;

// A panel repo with a draft 0002 that passes lint (untracked, as a fresh draft is), served on a free port.
export async function readyPanel() {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)]);
  const token = tokenOf((await request(port)).body);
  return { r, port, p, token };
}
export const headOf = r => r.g('rev-parse', 'HEAD');
export const readT = (r, name) => fs.readFileSync(path.join(r.dir, 'speck', 'tickets', name), 'utf8');

export const button = row => (function find(n) { if (n.tagName === 'button') return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);

export const shippedRows = p => p.byId('shipped').children.filter(n => n.tagName === 'tr');
export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

export const exitOf = (message = 'speck ship refused: speck/config.yml has an uncommitted change.') => ({ build_exit: { at: '2026-10-09T14:55:00.000Z', code: 0, message } });
export const isRed = n => /\b(bad|blocked)\b/.test(n.className || '');
export const nowStep = row => stagesOf(row).children.find(s => /\bnow\b/.test(s.className));
export const findText = (p, row, text) => p.all(row).find(n => n._text === text);

// ---------- 0039: a real headless browser, for what the fake page can't show (text selection) ----------

// A headless Chromium driven over the DevTools protocol, with no dependencies: SPECK_TEST_CHROME, or one Playwright installed.
export function findChrome() {
  if (process.env.SPECK_TEST_CHROME) return process.env.SPECK_TEST_CHROME;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  const found = fs.existsSync(cache) ? fs.readdirSync(cache).sort().reverse().flatMap(d => [
    path.join(cache, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell'), path.join(cache, d, 'chrome-linux64', 'chrome')]) : [];
  return [...found, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(f => fs.existsSync(f)) || null;
}
export async function browserPage(url) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-chrome-'));
  const chrome = spawn(findChrome(), ['--headless', '--no-sandbox', '--disable-gpu', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--window-size=1280,900', 'about:blank']);
  const port = await new Promise((resolve, reject) => {
    let err = '';
    const t = setTimeout(() => reject(new Error(`chrome didn't start: ${err}`)), 15000);
    chrome.stderr.on('data', d => { err += d; const m = err.match(/ws:\/\/127\.0\.0\.1:(\d+)\//); if (m) { clearTimeout(t); resolve(m[1]); } });
  });
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const waiting = new Map();
  ws.onmessage = m => { const r = JSON.parse(m.data); if (waiting.has(r.id)) { waiting.get(r.id)(r); waiting.delete(r.id); } };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    waiting.set(id, r => (r.error ? reject(new Error(`${method}: ${r.error.message}`)) : resolve(r.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const js = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`${expr}: ${r.exceptionDetails.text}`);
    return r.result.value;
  };
  const until = async (expr, what) => {
    for (let i = 0; i < 100; i++) { if (await js(expr)) return; await new Promise(r => setTimeout(r, 100)); }
    throw new Error(`timed out waiting for ${what}`);
  };
  const mouse = (type, [x, y]) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
  // A real drag with the mouse, from one point to another, through a point between them.
  const drag = async (from, to) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from[0], y: from[1] });
    await mouse('mousePressed', from);
    await mouse('mouseMoved', [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]);
    await mouse('mouseMoved', to);
    await mouse('mouseReleased', to);
  };
  const move = ([x, y]) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); // the pointer, with no button down (0041)
  const close = async () => { ws.close(); chrome.kill(); await new Promise(r => chrome.once('exit', r)); fs.rmSync(profile, { recursive: true, force: true }); };
  return { js, until, drag, move, close, send }; // send: a raw DevTools call, for example to emulate reduced motion (0055)
}
// The page point at a character offset in the first text node of the element a selector finds.
export const charAt = (sel, offset) => `(() => { const t = document.querySelector(${JSON.stringify(sel)}).firstChild; const r = document.createRange();
  r.setStart(t, ${offset}); r.setEnd(t, ${offset} + 1); const b = r.getBoundingClientRect(); return [b.left + 1, b.top + b.height / 2]; })()`;

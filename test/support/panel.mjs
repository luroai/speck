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
import { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { speck } from './cli.mjs';
import { tickingSource } from './stream.mjs';
import { copied } from './copy.mjs';

// ---------- 0031: a read-only control panel in the browser ----------

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
export const PAGE = path.join(ROOT, 'templates', 'panel.html');
export const gitEnv = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
export const env = { ...process.env, ...gitEnv };
export const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
export const fm = (o = {}) => Object.entries({ id: '"0001"', title: 'Export bookings as CSV', status: 'draft', size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', ...o }).map(([k, v]) => `${k}: ${v}`).join('\n');

// A repo with speck installed and one ready ticket, committed.
// Each kind is built once per test file and copied (copy.mjs), into a new folder named `prefix…`.
export function panelRepo({ worktrees = 'false', prefix = 'speck-' } = {}) {
  const dir = copied('panel', [worktrees], prefix, d => buildPanelRepo(d, worktrees));
  const run = (...a) => speck(dir, env, ...a);
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  const file = path.join(dir, 'speck', 'tickets', '0001-export-bookings.md');
  const write = (name, fmText, body = good, where = 'speck/tickets') => {
    fs.mkdirSync(path.join(dir, where), { recursive: true });
    fs.writeFileSync(path.join(dir, where, name), `---\n${fmText}\n---\n${body}`);
  };
  return { dir, run, g, file, write };
}
function buildPanelRepo(dir, worktrees) {
  const run = (...a) => speck(dir, env, ...a);
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, '  test: "true"').replace(/^worktrees:.*$/m, `worktrees: ${worktrees}`));
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
  assert.equal(run('set', '1', 'status', 'ready').status, 0);
  g('add', '-A'); g('commit', '-qm', 'base');
}

export const freePort = () => new Promise(resolve => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// Starts `speck panel` (from `cli`, or the repo's own CLI), with `extraEnv` added to its environment, and resolves once
// it has printed its URL, with the port it started on. Send requests to that port (`p.port`), not the one picked: when
// the port given with --port is taken by the time the panel starts, as another test file running alongside can take the
// port freePort() picked, it starts the panel again on another free port (0118).
export async function startPanel(cwd, args, cli = CLI, extraEnv = {}) {
  for (let tries = 1; ; tries++) {
    const i = args.findIndex(a => a === '--port' || a.startsWith('--port='));
    const port = i < 0 ? null : args[i] === '--port' ? args[i + 1] : args[i].slice('--port='.length);
    let p;
    try { p = await startPanelOnce(cwd, args, cli, extraEnv); } catch (e) {
      if (port === null || tries >= 5 || !new RegExp(`Port ${port} is already in use`).test(e.err || '')) throw e;
      const next = String(await freePort());
      args = args[i] === '--port' ? [...args.slice(0, i + 1), next, ...args.slice(i + 2)] : [...args.slice(0, i), `--port=${next}`, ...args.slice(i + 1)];
      continue;
    }
    if (port !== null && p.port !== Number(port)) { await stop(p); assert.fail(`the panel serves on ${p.port}, not the port given with --port, ${port}`); }
    return p;
  }
}
function startPanelOnce(cwd, args, cli, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'panel', ...args], { cwd, env: { ...env, ...extraEnv } });
    let out = '', err = '';
    const done = setTimeout(() => { child.kill(); reject(new Error(`panel didn't start: ${out}${err}`)); }, 10000);
    child.stdout.on('data', d => { out += d; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)/); if (m) { clearTimeout(done); resolve({ child, out: () => out, port: Number(m[1]) }); } });
    child.stderr.on('data', d => { err += d; });
    // Its message can still be on its way when it exits: wait for the end of its output (up to a second) before failing.
    child.on('exit', code => {
      clearTimeout(done);
      const fail = () => reject(Object.assign(new Error(`panel exited ${code}: ${out}${err}`), { code, out, err }));
      if (child.stderr.readableEnded) return fail();
      const late = setTimeout(fail, 1000);
      child.stderr.once('end', () => { clearTimeout(late); fail(); });
    });
  });
}
// Ends a child process and resolves once it has exited, at once if it already has. One that hasn't exited `ms` after
// SIGTERM gets SIGKILL, and one still not reported exited `ms` after that fails, naming it, rather than waiting for ever (0159).
export const ended = (child, name, ms = 5000) => new Promise((resolve, reject) => {
  if (child.exitCode !== null || child.signalCode !== null) return resolve();
  const hard = setTimeout(() => child.kill('SIGKILL'), ms);
  const fail = setTimeout(() => reject(new Error(`${name} (pid ${child.pid}) didn't exit within ${(2 * ms) / 1000} s of being stopped`)), 2 * ms);
  child.once('exit', () => { clearTimeout(hard); clearTimeout(fail); resolve(); });
  child.kill();
});
export const stop = (p, ms) => { p.child.removeAllListeners('exit'); return ended(p.child, 'the panel', ms); };

// A request to the panel, with the body as text, or as bytes with `bytes`. One with no answer in `timeout` ms fails,
// naming it, rather than waiting for ever (0159).
export function request(port, { method = 'GET', pathName = '/', host = `127.0.0.1:${port}`, bytes = false, timeout = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: pathName, headers: { Host: host } }, res => {
      const parts = [];
      res.on('data', d => parts.push(d));
      res.on('end', () => { const body = Buffer.concat(parts); resolve({ status: res.statusCode, headers: res.headers, body: bytes ? body : body.toString('utf8') }); });
      res.on('error', reject);
    });
    const t = setTimeout(() => req.destroy(new Error(`no answer to ${method} ${pathName} within ${timeout / 1000} s`)), timeout);
    req.on('close', () => clearTimeout(t));
    req.on('error', reject);
    req.end();
  });
}
// A GET with the body as bytes (0149).
export const raw = (port, pathName, host = `127.0.0.1:${port}`, timeout) => request(port, { pathName, host, bytes: true, timeout });

// A copy of the CLI (the whole scripts/ folder, since it's split into modules: 0018) and its templates, so a test can edit its code or panel.html without touching the repo's own (0059, 0067).
export function cliCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-cli-'));
  fs.cpSync(path.join(ROOT, 'scripts'), path.join(dir, 'scripts'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'templates'), path.join(dir, 'templates'), { recursive: true });
  return { cli: path.join(dir, 'scripts', 'speck.mjs'), page: path.join(dir, 'templates', 'panel.html') };
}

// The page's pure model function, run outside the browser.
export const page = () => fs.readFileSync(PAGE, 'utf8');

// 0126: the panel's agreed colours. 0134 changed them to the zen look's, 0147 to the landing page's.
export const PALETTE = '--bg: #faf9f5; --panel: #ffffff; --raise: #f0eee6; --line: #87847d; --line-soft: #e8e7e3; --text: #141413; --muted: #3d3d3a; --faint: #4d4c48; --accent: #853123; --ok: #3f522e; --warn: #67460b; --bad: #921f2d; --run: #304f6d; --idea: #623f6c';

// Each agreed colour the page's first :root block is missing or has changed, as '--name should be #value'.
export function paletteProblems(html) {
  const root = (html.match(/:root \{([\s\S]*?)\}/) || [])[1] || '';
  const vars = new Map([...root.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
  return PALETTE.split('; ').map(d => d.split(': ')).filter(([k, v]) => vars.get(k) !== v).map(([k, v]) => `${k} should be ${v}`);
}
// `globals` replaces what the model sees, for example a `Date` whose clock is stopped (0246).
export function panelModel(globals = {}) {
  const m = page().match(/\/\/ ---- model[^\n]*\n([\s\S]*?)\/\/ ---- end model/);
  assert.ok(m, 'the page has a marked model section');
  const fn = vm.runInNewContext(`${m[1]}\npanelModel`, { ...globals });
  // Back through JSON, so the result's arrays and objects belong to this realm and compare strictly.
  return state => JSON.parse(JSON.stringify(fn(state)));
}

// 0246: the panel's model of each board, with the page's clock stopped at one moment, read once from `clock`, so a
// second passing between them can't change a live counter and make the same board look different.
export function modelsAtOneMoment(boards, clock = Date.now) {
  const model = panelModel({ Date: stoppedClock(clock()) });
  return boards.map(model);
}
// A `Date` whose clock stays at `at`.
export const stoppedClock = at => class extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } };

// A state with one ticket in every status, as speck status --json gives it.
export const T = (id, status, o = {}) => ({ id, title: `Ticket ${id}`, status, priority: 2, size: 'S', risk: 'low', path: `speck/tickets/${id}-x.md`, worktree: null,
  acceptance_criteria: ['One.', 'Two.'], blocked_question: null, lint: { errors: 0, warnings: 0 }, rounds: [], waiting_on: [], ...o });
export const round = (n, tokens) => ({ round: n, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens });

// Runs the whole page script against a minimal DOM, fetch and timer, so the view can be checked without a browser.
// `globals` replaces what the page sees, for example a `Date` whose clock the test moves (0040).
// `made`, when given, is called with each element the page creates, for example to give it a browser's sizes (0052).
export function fakePage(responses, globals = {}, { made = () => {} } = {}) {
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
    n.setAttribute = (k, v) => { (n.attrs ||= {})[k] = String(v); }; // read back from `attrs` (0141)
    n.click = () => press(n); // a click made by the page itself, as a browser sends it (0141)
    return n;
  };
  const document = {
    createElement: tag => { const n = make(tag); made(n); return n; },
    createElementNS: (ns, tag) => { const n = make(tag); n.namespaceURI = ns; made(n); return n; }, // 0365: the Foreman's board is an SVG
    createTextNode: t => ({ tagName: '#text', children: [], textContent: String(t) }),
    getElementById: id => { if (!nodes.has(id)) nodes.set(id, make('div')); return nodes.get(id); },
    listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; }, // the page's own key handling (0054)
  };
  const timers = [];
  // 0186: the page's waits of 10 seconds or more (how long it goes without a board before it says it's disconnected,
  // and how long it waits for one), by id, apart from `timers`, so a test steps the board's refreshes as it always has.
  const waits = new Map();
  let waitIds = 0;
  const pageTimeout = (fn, ms) => { if (ms >= 10000) { waits.set(`w${++waitIds}`, { fn, ms }); return `w${waitIds}`; } return timers.push(fn); };
  const pageClearTimeout = id => { waits.delete(id); };
  // Repeating timers apart from `timers`, by id, so a test runs the state poll and the queue's 1-second counter (0058) apart.
  const intervals = new Map();
  let intervalIds = 0;
  const setInterval = (fn, ms) => { intervals.set(++intervalIds, { fn, ms }); return intervalIds; };
  const clearInterval = id => { intervals.delete(id); };
  const calls = []; // every fetch, so a test can check what the page sent
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    // A request the page gives up fails, as a browser's does (0186), even one the test settles later or never.
    const given = later => opts && opts.signal ? Promise.race([later, new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))]) : later;
    if (next && next.then) return given(next); // a request the test settles later, or never
    if (next && next.pendingBody) return { ok: true, status: 200, json: () => given(next.pendingBody) };
    if (next && next.status) return { ok: false, status: next.status, json: async () => next.body };
    return { ok: true, status: 200, json: async () => next };
  };
  const script = page().match(/<script>([\s\S]*?)<\/script>/)[1];
  const ctx = { document, fetch, setTimeout: pageTimeout, clearTimeout: pageClearTimeout, setInterval, clearInterval, AbortController, Date, Math, JSON, String, Number, Array, Set, console, ...globals };
  if (!Object.hasOwn(globals, 'EventSource')) ctx.EventSource = tickingSource(ctx); // 0187: the board's changes, as the poll's timer was
  vm.runInNewContext(script, ctx);
  const all = (n, out = []) => { out.push(n); for (const c of n.children || []) all(c, out); return out; };
  const settle = () => new Promise(r => setTimeout(r, 20));
  // Runs the page's waits of `ms` (10000: no board for 10 seconds; 15000: a request for the board given up), as the
  // clock does once they're up (0186).
  const elapse = async ms => { for (const [id, w] of [...waits]) if (w.ms === ms) { waits.delete(id); w.fn(); } await settle(); };
  // A key pressed anywhere on the page, as the browser sends it to the document (0054).
  const key = k => { if (document.listeners.keydown) document.listeners.keydown({ key: k }); };
  // A click as a browser sends it (0077): the page's own listener on the document first, then the node's and those of
  // each node it's in, until one stops it. Returns true when the document's listener stopped it.
  const press = node => {
    let stopped = false;
    const e = { target: node, stopPropagation() { stopped = true; }, preventDefault() {} };
    if (document.listeners.click) document.listeners.click(e);
    const caught = stopped;
    for (let n = node; n && !stopped; n = n.parentNode) if (n.listeners && n.listeners.click) n.listeners.click(e);
    return caught;
  };
  // A pointer of a type ('mouse', 'touch' or 'pen') moving over the page, as the browser tells the document first (0154).
  const pointer = type => { if (document.listeners.pointerover) document.listeners.pointerover({ pointerType: type }); };
  return { byId: id => document.getElementById(id), document, timers, waits, elapse, intervals, all, settle, calls, key, press, pointer }; // document: its listeners (0187)
}

// 0285: the page, with runSwitch() giving the speck run switch, which is in the Settings view's Foreman group now: found
// among the nodes the page made, so a test can check and press it as it did the header's, without opening Settings.
export function switchPage(responses, globals = {}) {
  const made = [];
  const p = fakePage(responses, globals, { made: n => made.push(n) });
  p.runSwitch = () => made.find(n => n.id === 'run-switch');
  return p;
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
// A queue row's node with this class, searched for through the whole row, or null.
const inRow = (row, re) => (function find(n) { if (re.test(n.className || '')) return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);
// An in-flight queue row's builder badge (0168; the ensō and five stage dots before it, the five-part bar before them),
// and the current stage's name beside it. Both null on a ready ticket.
export const badgeOf = row => inRow(row, /^badge\b/);
export const stageOf = row => inRow(row, /^stage\b/);
export const steps = t => t.steps.map(s => s.state || '');

// `body`, when given, is sent as the request's body (0318).
export function post(port, pathName, { origin = `http://127.0.0.1:${port}`, token, host = `127.0.0.1:${port}`, method = 'POST', body: sent } = {}) {
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
    req.end(sent);
  });
}
export const tokenOf = html => (html.match(/const TOKEN = '([0-9a-f]+)';/) || [])[1];
export const readyPath = id => `/api/tickets/${id}/ready`;

// A panel repo with a draft 0002 that passes lint (untracked, as a fresh draft is), served on a free port.
export async function readyPanel() {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = p;
  const token = tokenOf((await request(port)).body);
  return { r, port, p, token };
}
export const headOf = r => r.g('rev-parse', 'HEAD');
export const readT = (r, name) => fs.readFileSync(path.join(r.dir, 'speck', 'tickets', name), 'utf8');

export const button = row => (function find(n) { if (n.tagName === 'button') return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; })(row);

export const shippedRows = p => p.byId('shipped').children.filter(n => n.tagName === 'tr');
// 0162: opens every Shipped card's Details, which hold its labelled figures and its Review pack button.
export async function openDetails(p) {
  for (let i = 0; i < shippedRows(p).length; i++) {
    const d = p.all(shippedRows(p)[i]).find(n => n.tagName === 'button' && /\bdetails\b/.test(n.className || ''));
    if (d && d.attrs['aria-expanded'] === 'false') { p.press(d); await p.settle(); }
  }
}
export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

export const exitOf = (message = 'speck ship refused: speck/config.yml has an uncommitted change.') => ({ build_exit: { at: '2026-10-09T14:55:00.000Z', code: 0, message } });
export const isRed = n => /\b(bad|blocked)\b/.test(n.className || '');
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
// Every wait on Chrome has a time limit, and fails naming what it waited for rather than hanging the suite (0159).

// A DevTools connection to `url`, Chrome's own or one page's. A call fails if Chrome hasn't answered it in `ms`
// milliseconds, and at once when the connection has closed, as it does when Chrome exits. Unless the call gives its
// own, the limit is callMs(): 15 seconds, or SPECK_TEST_DEVTOOLS_MS, which 0206's tests set to make it short.
const callMs = () => Number(process.env.SPECK_TEST_DEVTOOLS_MS) > 0 ? Number(process.env.SPECK_TEST_DEVTOOLS_MS) : 15000;
async function devtools(url) {
  const ws = new WebSocket(url);
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timed out waiting for Chrome\'s DevTools connection to open')), 15000);
      ws.onopen = () => { clearTimeout(t); resolve(); };
      ws.onerror = () => { clearTimeout(t); reject(new Error('Chrome\'s DevTools connection failed to open')); };
    });
  } catch (e) { ws.close(); throw e; }
  let seq = 0;
  const waiting = new Map();
  ws.onmessage = m => { const r = JSON.parse(m.data); if (waiting.has(r.id)) { waiting.get(r.id)(r); waiting.delete(r.id); } };
  ws.onclose = () => { for (const done of waiting.values()) done({ error: { message: 'Chrome\'s DevTools connection closed' } }); waiting.clear(); };
  const send = (method, params = {}, ms = callMs(), what = '') => new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) return reject(new Error(`${method}: Chrome's DevTools connection has closed`));
    const id = ++seq;
    const t = setTimeout(() => { waiting.delete(id); reject(new Error(`Chrome didn't answer ${method} within ${ms / 1000} s${what && `: ${what}`}`)); }, ms);
    waiting.set(id, r => { clearTimeout(t); r.error ? reject(new Error(`${method}: ${r.error.message}`)) : resolve(r.result); });
    ws.send(JSON.stringify({ id, method, params }));
  });
  return { ws, send };
}

// 0182: one headless Chromium for the whole test file. The first browserPage() starts it and the rest share it, each
// page in a browser context of its own, so it keeps nothing from the page before. It ends once the file's tests are
// done, however they ended, or when its process exits.
let chromium = null; // a promise of the file's Chromium, or null before the first page and once the file's tests are done
const running = new Set(); // every Chromium started and not yet exited, with its profile, for the exit handler
async function launch() {
  // Named speck-keep-*, so tmp.mjs leaves it in place between tests, until the file's process exits.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-chrome-'));
  const chrome = spawn(findChrome(), ['--headless', '--no-sandbox', '--disable-gpu', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--window-size=1280,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const me = { chrome, profile };
  running.add(me);
  exitOnSignals();
  chrome.once('exit', () => running.delete(me));
  // Chrome mustn't keep the file's process going once its tests are done: after() below, or the exit handler, ends it.
  chrome.unref();
  chrome.stderr.unref();
  const browserUrl = await new Promise((resolve, reject) => {
    let err = '';
    const t = setTimeout(() => { chrome.kill('SIGKILL'); reject(new Error(`chrome didn't start: ${err}`)); }, 15000);
    chrome.once('error', e => { clearTimeout(t); reject(new Error(`chrome didn't start: ${e.message}`)); });
    chrome.stderr.on('data', d => { err += d; const m = err.match(/ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[\w-]+/); if (m) { clearTimeout(t); resolve(m[0]); } });
  });
  const close = async () => {
    ws?.close();
    try { await ended(chrome, 'Chrome'); } finally { fs.rmSync(profile, { recursive: true, force: true }); }
  };
  let ws;
  let send;
  try { ({ ws, send } = await devtools(browserUrl)); } catch (e) { await close(); throw e; }
  const alive = () => chrome.exitCode === null && chrome.signalCode === null && ws.readyState === WebSocket.OPEN;
  return { chrome, port: new URL(browserUrl).port, send, alive, close };
}
// A file starts Chromium at most once: a page asked for after it has exited, killed by a test for example, fails.
async function sharedChromium() {
  if (!chromium) chromium = launch();
  const c = await chromium;
  if (!c.alive()) throw new Error(`this test file's Chromium (pid ${c.chrome.pid}) has exited, and a test file starts it only once: a test that ends it should be in a file of its own`);
  return c;
}
after(async () => {
  const p = chromium;
  chromium = null;
  const c = await p?.catch(() => null);
  await c?.close();
});
process.on('exit', () => {
  for (const { chrome, profile } of running) {
    try { chrome.kill('SIGKILL'); } catch { /* gone */ }
    fs.rmSync(profile, { recursive: true, force: true });
  }
});
// A file stopped with a signal, as the test runner stops one that runs out of time, exits through the handler above.
let stopping = false;
const exitOnSignals = () => {
  if (stopping) return;
  stopping = true;
  for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) process.once(sig, () => process.exit(128 + n));
};

export async function browserPage(url) {
  const c = await sharedChromium();
  const { browserContextId } = await c.send('Target.createBrowserContext');
  // Closing the page's browser context closes the page and drops everything it kept.
  let closed = false;
  const dispose = async () => {
    if (closed) return;
    closed = true;
    if (c.alive()) await c.send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
  };
  let ws, send;
  try {
    const { targetId } = await c.send('Target.createTarget', { url, browserContextId, width: 1280, height: 900 });
    ({ ws, send } = await devtools(`ws://127.0.0.1:${c.port}/devtools/page/${targetId}`));
  } catch (e) { await dispose(); throw e; }
  const close = async () => { ws.close(); await dispose(); };
  const js = async (expr, ms) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, ms, expr);
    if (r.exceptionDetails) throw new Error(`${expr}: ${r.exceptionDetails.text}`);
    return r.result.value;
  };
  const until = async (expr, what) => {
    for (let i = 0; i < 100; i++) { if (await js(expr)) return; await new Promise(r => setTimeout(r, 100)); }
    throw new Error(`timed out waiting for ${what}`);
  };
  // The page itself loaded. Chrome opens about:blank first, whose readyState is already "complete", so waiting on
  // readyState alone can pass before the page has arrived, and a DevTools call about the page sent then is never answered (0159).
  const loaded = () => until(`location.href === ${JSON.stringify(new URL(url).href)} && document.readyState === "complete"`, `${url} to load`);
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
  // send: a raw DevTools call to the page, for example to emulate reduced motion (0055). browser: one to Chromium itself (0182).
  return { js, until, loaded, drag, move, close, send, browser: c.send, pid: c.chrome.pid };
}
// The page point at a character offset in the first text node of the element a selector finds.
export const charAt = (sel, offset) => `(() => { const t = document.querySelector(${JSON.stringify(sel)}).firstChild; const r = document.createRange();
  r.setStart(t, ${offset}); r.setEnd(t, ${offset} + 1); const b = r.getBoundingClientRect(); return [b.left + 1, b.top + b.height / 2]; })()`;

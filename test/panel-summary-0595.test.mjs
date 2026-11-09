import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0595: a summary of every speck panel running on this machine, for the bridge (0596).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { T, panelModel, panelRepo, freePort, startPanel, stop } from './support/panel.mjs';
import { registerPanel, panelProjects } from '../scripts/panel-projects.mjs';
import { projectSummary } from '../scripts/panel-summary.mjs';
import { totalSpent } from '../scripts/spend.mjs';

const NOW = Date.parse('2026-11-09T12:00:00Z'), DAY = 864e5;
const ago = days => new Date(NOW - days * DAY).toISOString();
const foreman = (o = {}) => ({ word: 'Idle', tone: 'idle', fixing: 'tell', blocked: [], agent: { asks: [] }, ...o });
const summary = (tickets, o = {}) => projectSummary({ board: { tickets }, foreman: foreman(o.foreman), run: { on: o.on ?? true }, now: NOW });
const blockedOf = tickets => tickets.filter(t => t.status === 'blocked').map(t => ({ id: t.id, title: t.title, question: t.blocked_question, foreman: t.foreman_will === true }));
const whys = s => s.needs.map(n => [n.id, n.why]);

// ---------- one panel's summary, from its board and status (quick, in this process) ----------

test('0595 AC1: a summary has the status word and how many are building, queued and need you', () => {
  const tickets = [T('0001', 'building'), T('0002', 'reviewing'), T('0003', 'ready'), T('0004', 'draft'), T('0005', 'blocked', { blocked_question: 'Which?' })];
  const s = summary(tickets, { foreman: { word: 'Needs you 1', tone: 'bad', blocked: blockedOf(tickets) } });
  assert.equal(s.status, 'Needs you 1');
  assert.equal(s.tone, 'bad');
  assert.equal(s.building, 2);
  assert.equal(s.queued, 1);
  assert.equal(s.needs_you, 1);
});

test('0595 AC1: shipped and spent count only the last 7 days', () => {
  const part = (days, cost_usd, tokens = 10, p = 'builder') => ({ part: p, ended: ago(days), tokens, cost_usd });
  const s = summary([
    T('0001', 'done', { finished: ago(1), recent_spend: [part(1, 1.5), part(2, 0.25, 10, 'reviewer')] }),
    T('0002', 'done', { finished: ago(6.9) }),
    T('0003', 'done', { finished: ago(7.1), recent_spend: [part(7.1, 100)] }),
    T('0004', 'done', { finished: null }),
    T('0005', 'done', { finished: ago(1), ship: { running: true } }),
    T('0006', 'building', { recent_spend: [part(3, 2)] }),
  ]);
  assert.equal(s.shipped_week, 2, 'the two finished within 7 days; not older, undated or still shipping');
  assert.equal(s.spent_week_usd, 3.75, 'every part that ended within 7 days, a ticket still building included');
  assert.equal(s.spent_week_unknown, false);
});

test('0595 AC1: spend with no known cost is null, and a part with tokens but no cost says so', () => {
  assert.equal(summary([T('0001', 'done')]).spent_week_usd, null);
  const s = summary([T('0001', 'building', { recent_spend: [{ part: 'builder', ended: ago(1), tokens: 50, cost_usd: null }] })]);
  assert.equal(s.spent_week_usd, null);
  assert.equal(s.spent_week_unknown, true);
});

test('0595 AC1: a ticket\'s board entry gives the parts that ended since the time asked for, and no others', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'));
  const round = (at, cost) => ({ meta: { saved_at: at, tokens_total: 100, cost_usd: cost, reviewer: 'codex' }, verdict: { verdict: 'approve' } });
  const rounds = [round(ago(1), 0.5), round(ago(9), 4)];
  const now = totalSpent(runs, '0001', rounds, NOW - 7 * DAY);
  assert.deepEqual(now.recent_spend.map(p => p.ended), [ago(1)]);
  assert.equal(totalSpent(runs, '0001', rounds).recent_spend, undefined, 'only when asked for');
  assert.equal(totalSpent(runs, '0001', [], NOW - 7 * DAY).recent_spend, undefined, 'none to give: left out');
});

test('0595 AC2: each ticket needing you has its id, title and why', () => {
  const tickets = [
    T('0001', 'blocked', { title: 'Ask me', blocked_question: 'Which one?' }),
    T('0002', 'approved', { title: 'Ship me', auto_ship: false }),
    T('0003', 'approved', { title: 'Risky', risk: 'high', auto_ship: false }),
    T('0004', 'building', { title: 'Looked into' }),
  ];
  const s = summary(tickets, { foreman: { blocked: blockedOf(tickets), agent: { asks: [{ id: '0004', question: 'Carry on?' }] } } });
  assert.deepEqual(s.needs, [
    { id: '0001', title: 'Ask me', why: 'question', detail: 'Which one?' },
    { id: '0004', title: 'Looked into', why: 'manager', detail: 'Carry on?' },
    { id: '0002', title: 'Ship me', why: 'ship', detail: '' },
    { id: '0003', title: 'Risky', why: 'high_risk', detail: '' },
  ]);
  assert.equal(s.needs_you, 4);
});

test('0595 AC2: a question speck will take, or any with watch off, doesn\'t need you, as the status word says', () => {
  const tickets = [T('0001', 'blocked', { foreman_will: true }), T('0002', 'blocked')];
  assert.deepEqual(whys(summary(tickets, { foreman: { blocked: blockedOf(tickets) } })), [['0002', 'question']]);
  assert.deepEqual(summary(tickets, { foreman: { blocked: blockedOf(tickets), fixing: 'off' } }).needs, []);
});

test('0595 AC2: the manager\'s question about a blocked ticket isn\'t listed twice, and one about a ticket off the board is left out', () => {
  const tickets = [T('0001', 'blocked', { blocked_question: 'Q' })];
  const s = summary(tickets, { foreman: { blocked: blockedOf(tickets), agent: { asks: [{ id: '0001', question: 'Also?' }, { id: '9999', question: 'Gone?' }] } } });
  assert.deepEqual(whys(s), [['0001', 'question']]);
});

test('0595 AC2: waiting at Ship agrees with the page\'s own lanes', () => {
  const on = [true, false];
  const shipLate = { running: false, auto: true, ended: ago(0.1) };
  const cases = [
    T('0001', 'approved', { auto_ship: false }),
    T('0002', 'approved', { auto_ship: true }),
    T('0003', 'approved', { auto_ship: true, build_exit: { code: 0, at: ago(0.2) } }),
    T('0004', 'approved', { auto_ship: false, ship: { running: true, started: ago(0.1) } }),
    T('0005', 'approved', { auto_ship: true, approved: ago(0.2), ship: shipLate }),
    T('0006', 'approved', { auto_ship: true, approved: ago(0.2), ship: shipLate, handed_back: ago(0.05), build_running: true }),
    T('0007', 'building'),
  ];
  for (const runOn of on) {
    const state = { tickets: cases, ideas: [], ...(runOn ? { run: { on: true } } : {}) };
    const page = panelModel()(state).queue.filter(t => t.to_ship || t.ship_hint).map(t => t.id).sort();
    const ours = summary(cases, { on: runOn }).needs.filter(n => n.why === 'ship').map(n => n.id).sort();
    assert.deepEqual(ours, page, `with speck run ${runOn ? 'on' : 'off'}`);
  }
});

test('0595 AC2: a board that\'s missing or odd gives an empty summary rather than an error', () => {
  for (const board of [undefined, null, {}, { tickets: 'x' }, { tickets: [null, 7, { id: '0001' }] }]) {
    const s = projectSummary({ board, foreman: undefined, run: undefined, now: NOW });
    assert.deepEqual([s.status, s.building, s.queued, s.needs_you, s.shipped_week, s.spent_week_usd], ['', 0, 0, 0, 0, null]);
  }
});

// ---------- asking every panel (quick: this process's own servers, on the records a panel reads) ----------

const opened = [];
after(() => { for (const f of opened) f(); });
const records = () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'panels-')); process.env.SPECK_PANELS_DIR = dir; return dir; };
// A stand-in for another panel: `answer` gets each request and its response.
function peer(answer) {
  return new Promise(resolve => {
    const s = http.createServer(answer);
    s.listen(0, '127.0.0.1', () => { opened.push(() => { s.closeAllConnections(); s.close(); }); resolve(s.address().port); });
  });
}
const OWN = { status: 'Idle', tone: 'idle', building: 1, queued: 2, needs_you: 0, shipped_week: 3, spent_week_usd: 1.5, spent_week_unknown: false, needs: [] };
const answers = body => (req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
// A panel at `port`'s route() behind a real server, so requests to it are made as a browser's are.
async function theBridge(port) {
  const origins = new Set([`http://127.0.0.1:${port}`]);
  const p = panelProjects({ port, name: 'here', repo: '/x', origins, changed: () => {}, id: 'abc' });
  const s = http.createServer((req, res) => { if (!p.route(req, res)) { res.writeHead(418); res.end(); } });
  await new Promise(r => s.listen(port, '127.0.0.1', r));
  opened.push(() => { p.stop(); s.closeAllConnections(); s.close(); });
}
function ask(port, { method = 'POST', origin = `http://127.0.0.1:${port}`, pathName = '/api/projects/summary', cookie } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { ...(origin ? { Origin: origin } : {}), ...(cookie ? { Cookie: cookie } : {}) };
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

test('0595 AC1: the panel lists each panel in the records with its name and its own summary', async () => {
  const dir = records(), port = await freePort(), seen = [];
  const other = await peer((req, res) => { seen.push({ url: req.url, host: req.headers.host, via: req.headers['x-speck-via'] }); answers(OWN)(req, res); });
  await theBridge(port);
  registerPanel({ port: other, name: 'alpha', repo: '/x/alpha' }, dir);
  const res = await ask(port);
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.self, port);
  const row = body.projects.find(p => p.port === other);
  assert.deepEqual(row, { ...OWN, port: other, name: 'alpha', running: true });
  assert.equal(body.projects.length, 2, 'this panel too, from its own record');
  assert.deepEqual(seen[0], { url: '/api/projects/own', host: `127.0.0.1:${other}`, via: String(port) });
});

test('0595 AC1: an answer can\'t change a panel\'s name, port or whether it\'s running', async () => {
  const dir = records(), port = await freePort();
  const other = await peer(answers({ ...OWN, name: 'spoofed', port: 1, running: false }));
  await theBridge(port);
  registerPanel({ port: other, name: 'alpha', repo: '/x/alpha' }, dir);
  const row = JSON.parse((await ask(port)).body).projects.find(p => p.name === 'alpha');
  assert.equal(row.port, other);
  assert.equal(row.running, true);
});

test('0595 AC1: it\'s the panel at the address that answers, even with another project shown there', async () => {
  const dir = records(), port = await freePort();
  const other = await peer(answers(OWN));
  await theBridge(port);
  registerPanel({ port: other, name: 'alpha', repo: '/x/alpha' }, dir);
  const res = await ask(port, { cookie: `speck-shown-${port}=${other}` });
  assert.equal(JSON.parse(res.body).self, port);
  assert.equal(res.headers['x-speck-panel'], undefined, 'the address\'s own answer, which no page should take for its panel\'s');
});

test('0595 AC3: a panel that doesn\'t answer within 2 seconds is listed as not running, and the rest still are', async () => {
  const dir = records(), port = await freePort();
  const silent = await peer(() => {}), good = await peer(answers(OWN));
  await theBridge(port);
  registerPanel({ port: silent, name: 'silent', repo: '/x/s' }, dir);
  registerPanel({ port: good, name: 'good', repo: '/x/g' }, dir);
  const started = Date.now(), res = await ask(port), took = Date.now() - started;
  assert.equal(res.status, 200);
  const list = JSON.parse(res.body).projects;
  assert.deepEqual(list.find(p => p.name === 'silent'), { port: silent, name: 'silent', running: false });
  assert.equal(list.find(p => p.name === 'good').running, true);
  assert.ok(took >= 1900 && took < 6000, `took ${took} ms`);
});

test('0595 AC3: a panel that starts answering but never finishes counts as not answering', async () => {
  const dir = records(), port = await freePort();
  const stuck = await peer((req, res) => { res.writeHead(200); res.write('{"status":'); });
  await theBridge(port);
  registerPanel({ port: stuck, name: 'stuck', repo: '/x/s' }, dir);
  const row = JSON.parse((await ask(port)).body).projects.find(p => p.name === 'stuck');
  assert.equal(row.running, false);
});

test('0595 AC3: a refused connection, an error status, or an answer that isn\'t a summary is listed as not running', async () => {
  const dir = records(), port = await freePort();
  const closed = await freePort();
  const bad = await peer((req, res) => { res.writeHead(500); res.end(JSON.stringify(OWN)); });
  const garbage = await peer(answers('<html>not ours</html>'));
  const wrong = await peer(answers('[1,2]'));
  const empty = await peer(answers('null'));
  const huge = await peer(answers(JSON.stringify({ ...OWN, pad: 'x'.repeat(3e6) })));
  await theBridge(port);
  const named = { closed, bad, garbage, wrong, empty, huge };
  for (const [name, p] of Object.entries(named)) registerPanel({ port: p, name, repo: `/x/${name}` }, dir);
  const list = JSON.parse((await ask(port)).body).projects;
  for (const name of Object.keys(named)) assert.equal(list.find(p => p.name === name).running, false, name);
});

test('0595 AC4: it answers only a panel page at this address', async () => {
  records();
  const port = await freePort();
  await theBridge(port);
  for (const origin of ['http://evil.example', `http://127.0.0.1:${port + 1}`, null]) {
    const res = await ask(port, { origin });
    assert.equal(res.status, 403, String(origin));
    assert.ok(!res.body.includes('projects'), 'nothing of the summaries');
    assert.match(JSON.parse(res.body).error, /only a panel page/i);
  }
});

test('0595 AC4: only POST, so that the browser says which page is asking', async () => {
  records();
  const port = await freePort();
  await theBridge(port);
  const res = await ask(port, { method: 'GET' });
  assert.equal(res.status, 405);
  assert.equal(res.headers.allow, 'POST');
});

// ---------- the real server (its own reading of its board, which only a real panel does) ----------

test('0595 AC1, AC4: a real panel gives its own summary through its record, and its own part only to another panel', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'panels-')), repo = panelRepo();
  const p = await startPanel(repo.dir, ['--port', String(await freePort())], undefined, { SPECK_PANELS_DIR: dir });
  try {
    const res = await ask(p.port);
    assert.equal(res.status, 200, res.body);
    const [row] = JSON.parse(res.body).projects;
    assert.equal(row.port, p.port);
    assert.equal(row.running, true);
    assert.equal(row.queued, 1, 'its one ready ticket');
    assert.equal(row.status, 'Off');
    assert.equal((await ask(p.port, { method: 'GET', pathName: '/api/projects/own', origin: null })).status, 403, 'a panel\'s own part needs another panel\'s header');
  } finally { await stop(p); }
});

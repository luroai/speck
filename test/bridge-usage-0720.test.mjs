import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0720: the bridge warns when an agent nears its usage limit.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fakePage, panelRepo, gitEnv, freePort } from './support/panel.mjs';
import { panelProjects } from '../scripts/panel-projects.mjs';
import { usageWarnings } from '../scripts/subscriptions.mjs';
import { saveUsage, readUsage } from '../scripts/agent-usage.mjs';

Object.assign(process.env, gitEnv);

const NOW = Date.now();
const at = mins => new Date(NOW + mins * 60000).toISOString();
const claude = (five, week, o = {}) => ({ read_at: at(-4), windows: { five_hour: { used_percent: five, resets_at: at(90), refused: false }, seven_day: { used_percent: week, resets_at: at(3 * 1440), refused: false } }, ...o });

// ---------- which agents are warned about (quick, in this process) ----------

test('0720 AC1: an agent with a window at 90% or more is warned about, with that window and when it resets', () => {
  const [w, ...rest] = usageWarnings({ claude: claude(93, 40) }, NOW);
  assert.equal(rest.length, 0);
  assert.equal(w.name, 'Claude Code');
  assert.deepEqual(w.windows.map(x => [x.label, x.used_percent, x.limited, x.resets_at]), [['5 hours', 93, false, at(90)]], 'only the window at 90% or more');
});

test('0720 AC1: a limited agent is warned about, with the window it reached', () => {
  const codex = { read_at: at(-10), limit_reached: true, limit_type: 'secondary', windows: { five_hour: { used_percent: 20, resets_at: at(60) }, seven_day: { used_percent: 100, resets_at: at(2000) } } };
  const [w] = usageWarnings({ codex }, NOW);
  assert.equal(w.name, 'Codex');
  assert.deepEqual(w.windows.map(x => [x.label, x.limited]), [['Week', true]]);
  const refused = usageWarnings({ claude: claude(50, 40, { windows: { five_hour: { used_percent: 50, resets_at: at(30), refused: true } } }) }, NOW);
  assert.deepEqual(refused[0].windows.map(x => [x.label, x.limited]), [['5 hours', true]], 'limited under 90% still counts');
});

test('0720 AC1: a Codex limit whose type naming no window still warns, with each open window\'s reset', () => {
  // readingShown only marks a window limited for an unrecognised limit_type when that window is at 100%; a kept
  // reading can still say limit_reached with lower percentages (codexUsageInSession keeps any non-empty type).
  const odd = { read_at: at(-3), limit_reached: true, limit_type: 'credits_exhausted',
    windows: { five_hour: { used_percent: 12, resets_at: at(45) }, seven_day: { used_percent: null, resets_at: at(1800) } } };
  const [w] = usageWarnings({ codex: odd }, NOW);
  assert.equal(w.name, 'Codex');
  assert.deepEqual(w.windows.map(x => [x.label, x.limited, x.used_percent, x.resets_at]),
    [['5 hours', true, 12, at(45)], ['Week', true, null, at(1800)]]);
  const over = { ...odd, windows: { five_hour: { used_percent: 12, resets_at: at(-1) }, seven_day: { used_percent: 8, resets_at: at(-2) } } };
  assert.deepEqual(usageWarnings({ codex: over }, NOW), [], 'windows that have already reset are not warned about');
});

test('0720 AC1 AC2: a recognised Codex limit that has already reset does not warn about another low window', () => {
  const expired = { read_at: at(-10), limit_reached: true, limit_type: 'primary',
    windows: { five_hour: { used_percent: 100, resets_at: at(-5) }, seven_day: { used_percent: 20, resets_at: at(2000) } } };
  assert.deepEqual(usageWarnings({ codex: expired }, NOW), [], 'the five-hour limit has reset; 20% of the week is not a warning');
});

test('0720 AC2: each agent at or over 90% is named; one under 90% everywhere, or with no reading, is not', () => {
  const cursor = { read_at: at(-1), resets_on: '2026-12-12', windows: { included: { used_percent: 90 }, auto: { used_percent: 0 } } };
  const ws = usageWarnings({ claude: claude(89.9, 10), codex: { read_at: at(-1), windows: { five_hour: { used_percent: 95, resets_at: at(60) } } }, cursor }, NOW);
  assert.deepEqual(ws.map(w => w.name), ['Codex', 'Cursor'], '89.9% isn\'t 90%; exactly 90% is');
  assert.equal(ws[1].windows[0].resets_on, '2026-12-12', 'a window with a reset day only keeps the day');
  assert.deepEqual(usageWarnings({}, NOW), []);
});

test('0720 AC2: odd readings give no warning and no error', () => {
  for (const bad of [null, undefined, [], 'x', { claude: null }, { claude: [] }, { __proto__: { claude: claude(99, 99) } }, { constructor: claude(99, 99) }, { claude: { windows: { five_hour: { used_percent: 99 } } } }])
    assert.deepEqual(usageWarnings(bad, NOW), [], JSON.stringify(bad));
});

test('0720 AC3: a window whose reset time has passed has reset, so it gives no warning', () => {
  const old = { read_at: at(-400), windows: { five_hour: { used_percent: 99, resets_at: at(-5) }, seven_day: { used_percent: 30, resets_at: at(2000) } } };
  assert.deepEqual(usageWarnings({ claude: old }, NOW), []);
});

test('0720 AC3: the warning goes once the newest kept reading is under 90% in every window', () => {
  const r = panelRepo();
  assert.ok(saveUsage(r.dir, 'claude', claude(95, 40)));
  assert.deepEqual(usageWarnings(readUsage(r.dir), NOW).map(w => w.name), ['Claude Code']);
  assert.ok(saveUsage(r.dir, 'claude', claude(10, 40, { read_at: at(-1) })));
  assert.deepEqual(usageWarnings(readUsage(r.dir), NOW), []);
});

// ---------- the summary the bridge reads carries them (quick: this process's own server) ----------

const closing = [];
after(() => { for (const f of closing) f(); });
async function summaryWith(usage) {
  process.env.SPECK_PANELS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'panels-'));
  const port = await freePort(), p = panelProjects({ port, name: 'here', repo: '/x', origins: new Set([`http://127.0.0.1:${port}`]), changed: () => {}, id: 'abc', usage });
  const s = http.createServer((req, res) => { if (!p.route(req, res)) { res.writeHead(418); res.end(); } });
  await new Promise(r => s.listen(port, '127.0.0.1', r));
  closing.push(() => { p.stop(); s.closeAllConnections(); s.close(); });
  const res = await fetch(`http://127.0.0.1:${port}/api/projects/summary`, { method: 'POST', headers: { Origin: `http://127.0.0.1:${port}` } });
  return { status: res.status, body: await res.json() };
}

test('0720 AC1: the summary the bridge reads gives the usage warnings, and none when they can\'t be read', async () => {
  const warn = [{ id: 'codex', name: 'Codex', windows: [{ label: 'Week', used_percent: 95, limited: false, resets_at: at(60), resets_on: null }] }];
  const ok = await summaryWith(() => warn);
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.usage, warn);
  const broken = await summaryWith(() => { throw new Error('unreadable'); });
  assert.equal(broken.status, 200);
  assert.deepEqual(broken.body.usage, []);
});

// ---------- the bridge shows them (the page, with a stand-in for the panel) ----------

const list = { self: 4777, list: [{ port: 4777, name: 'speck' }, { port: 4778, name: 'alpha' }] };
const board = { tickets: [], ideas: [], run: { on: false }, foreman: { word: 'Idle', tone: 'idle', mood: 'asleep', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [] }, projects: list };
const summary = (port, name) => ({ port, name, running: true, status: 'Idle', tone: 'idle', mood: 'watching', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0, spent_week_usd: null, spent_week_unknown: false, build_minutes: [] });
const body = usage => ({ self: 4777, projects: [summary(4777, 'speck'), summary(4778, 'alpha')], ...(usage === undefined ? {} : { usage }) });
const nodes = (n, out = []) => { out.push(n); for (const c of n.children || []) nodes(c, out); return out; };
const lines = p => nodes(p.byId('bridge')).filter(n => String(n.className || '').split(' ').includes('bridge-usage')).map(n => n.textContent);
async function opened(...answers) {
  const p = fakePage([board, ...answers]);
  await p.settle();
  p.byId('project').value = 'all';
  p.byId('project').listeners.change();
  await p.settle();
  return p;
}
const resetIn = mins => { const d = new Date(NOW + mins * 60000); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

test('0720 AC1: the bridge shows a line naming the agent, the window and when it resets', async () => {
  const soon = at(2);
  const p = await opened(body([{ id: 'claude', name: 'Claude Code', windows: [{ label: '5 hours', used_percent: 93.7, limited: false, resets_at: soon, resets_on: null }] },
    { id: 'codex', name: 'Codex', windows: [{ label: 'Week', used_percent: 100, limited: true, resets_at: null, resets_on: '2026-12-12' }] }]));
  const shown = lines(p);
  assert.equal(shown.length, 2);
  assert.match(shown[0], /Claude Code/);
  assert.match(shown[0], /5 hours 93% used/);
  if (new Date(NOW + 120000).getDate() === new Date(NOW).getDate()) assert.match(shown[0], new RegExp(`resets ${resetIn(2)}`));
  else assert.match(shown[0], /resets tomorrow/);
  assert.match(shown[1], /Codex · Week limited, resets 12 Dec/);
});

test('0720 AC2: with no agent near its limit, or an older panel that sends none, the bridge shows no line', async () => {
  assert.deepEqual(lines(await opened(body([]))), []);
  assert.deepEqual(lines(await opened(body(undefined))), []);
  assert.deepEqual(lines(await opened(body([null, 'x', { name: 'Codex', windows: [] }, { name: '', windows: [{ label: 'Week' }] }, { name: 'Cursor', windows: 'x' }]))), [], 'odd entries are left out');
});

test('0720 AC3: the line goes when the next summary has no warning for the agent', async () => {
  const warn = [{ id: 'claude', name: 'Claude Code', windows: [{ label: 'Week', used_percent: 95, limited: false, resets_at: at(3000), resets_on: null }] }];
  const p = await opened(body(warn), body([]));
  assert.equal(lines(p).length, 1);
  for (const { fn, ms } of p.intervals.values()) if (ms === 5000) fn();
  await p.settle();
  assert.deepEqual(lines(p), []);
});

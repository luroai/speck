import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { openSettings } from './support/settings.mjs';
import { agentsPage, agentsBox, AGENTS_FOUND, YOURS_VIEW, settingsWithAgents } from './support/your-agents.mjs';
import { subscriptionsAnswer, readingShown, providerSpend, weekStart } from '../scripts/subscriptions.mjs';
import { saveUsage } from '../scripts/agent-usage.mjs';
import { yourAgentsFile } from '../scripts/your-agents.mjs';
import { knownProviders } from '../scripts/custom-providers.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0646: show your subscriptions' usage in Settings ----------

const NOW = Date.now();
const at = mins => new Date(NOW + mins * 60000).toISOString();
const found = (cursor = false) => async () => {
  const f = structuredClone(AGENTS_FOUND), c = f.agents.find(a => a.id === 'cursor');
  if (cursor) { c.installed = c.signed_in = true; delete c.why; }
  return f;
};
const noCursor = async () => { throw new Error('Cursor was read'); };
// A repo whose list of your agents is `ids`.
function repoWith(ids) {
  const r = panelRepo();
  fs.mkdirSync(path.dirname(yourAgentsFile(r.dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(r.dir), JSON.stringify({ agents: ids }));
  return r;
}
const CLAUDE = { read_at: at(-4), windows: { five_hour: { used_percent: 40, resets_at: at(90), refused: false }, seven_day: { used_percent: 34, resets_at: at(3 * 1440), refused: false } } };
const CODEX = { read_at: at(-120), reported_at: at(-120), plan: 'plus', limit_reached: false, limit_type: null, windows: { five_hour: { used_percent: 12, resets_at: at(60) }, seven_day: { used_percent: 91, resets_at: at(2000) } } };
const CURSOR = { read_at: at(-1), plan: 'Premium', resets_on: '2026-12-12', windows: { included: { used_percent: 1 }, auto: { used_percent: 0 }, api: { used_percent: 3 } }, on_demand: { spent: 0, limit: null } };
const rowOf = (answer, id) => answer.agents.find(a => a.id === id);

test('0646 AC1: the answer lists each of your agents with its plan and each window speck read, with when it resets', async () => {
  const r = repoWith(['claude', 'codex', 'cursor']);
  saveUsage(r.dir, 'claude', CLAUDE);
  saveUsage(r.dir, 'codex', CODEX);
  saveUsage(r.dir, 'cursor', CURSOR);
  const answer = await subscriptionsAnswer(r.dir, { find: found(true), readCursor: noCursor, now: () => NOW });
  assert.deepEqual(answer.agents.map(a => a.id), ['claude', 'codex', 'cursor'], 'your agents, in order');
  const claude = rowOf(answer, 'claude').reading, codex = rowOf(answer, 'codex').reading, cursor = rowOf(answer, 'cursor').reading;
  assert.deepEqual(claude.windows.map(w => [w.label, w.used_percent, w.resets_at]), [['5 hours', 40, at(90)], ['Week', 34, at(3 * 1440)]]);
  assert.equal(claude.plan, null, 'Claude Code reports no plan');
  assert.equal(codex.plan, 'Plus');
  assert.equal(cursor.plan, 'Premium');
  assert.deepEqual(cursor.windows.map(w => [w.label, w.used_percent, w.resets_on]), [['Month', 1, '2026-12-12'], ['Auto', 0, '2026-12-12'], ['API', 3, '2026-12-12']]);
  assert.deepEqual(cursor.on_demand, { spent: 0, limit: null });
});

test('0646 AC1: Settings has a Your subscriptions group after Your agents, each agent with its plan, a bar and figure for each window and when it resets', async () => {
  const usage = { agents: [
    { id: 'claude', name: 'Claude Code', kind: 'agent', reading: readingShown('claude', CLAUDE, NOW) },
    { id: 'cursor', name: 'Cursor', kind: 'agent', reading: readingShown('cursor', CURSOR, NOW) }] };
  const p = await openWith(usage);
  const pane = p.byId('settings');
  const groups = pane.children.filter(n => /\b(sgroup|switches)\b/.test(n.className || ''));
  assert.equal(groups[1], agentsBox(p));
  assert.match(groups[2].className, /\bsubs\b/, 'Your subscriptions comes after Your agents');
  assert.match(groups[2].textContent, /^Your subscriptions/);
  const rows = subRows(p);
  assert.match(rows[0].textContent, /^Claude Code/);
  assert.match(rows[1].textContent, /^Cursor · Premium/);
  const wins = p.all(rows[0]).filter(n => /\bwin\b/.test(n.className || ''));
  assert.deepEqual(wins.map(w => p.all(w).find(n => /\bwname\b/.test(n.className || '')).textContent), ['5 hours', 'Week']);
  assert.deepEqual(wins.map(w => p.all(w).find(n => /\bfigure\b/.test(n.className || '')).textContent), ['40%', '34%']);
  const bar = p.all(wins[0]).find(n => /\bbar\b/.test(n.className || ''));
  assert.equal(bar.attrs.role, 'meter');
  assert.equal(bar.attrs['aria-valuenow'], '40');
  assert.equal(p.all(bar).find(n => /\bfill\b/.test(n.className || '')).attrs.style, 'width: 40%');
  for (const w of wins) assert.match(p.all(w).find(n => /\bwhen\b/.test(n.className || '')).textContent, /^resets /);
  assert.match(rows[1].textContent, /Month.*1%.*resets 12 Dec/);
  assert.match(rows[1].textContent, /On-demand \$0\.00 spent, no monthly limit/);
});

test('0646 AC2: a window at 90% or more has its bar in the needs-you colour, and a refused one says Limited with when it resets', async () => {
  const refused = { read_at: at(-2), windows: { five_hour: { used_percent: 100, resets_at: at(45), refused: true }, seven_day: { used_percent: 89.9, resets_at: at(4000), refused: false } } };
  const shown = readingShown('claude', refused, NOW);
  assert.deepEqual(shown.windows.map(w => [w.high, w.limited]), [[true, true], [false, false]]);
  assert.deepEqual(readingShown('codex', CODEX, NOW).windows.map(w => [w.high, w.limited]), [[false, false], [true, false]], '91% is high, not limited');
  const reached = { ...CODEX, limit_reached: true, limit_type: 'secondary' };
  assert.deepEqual(readingShown('codex', reached, NOW).windows.map(w => w.limited), [false, true], 'Codex names the window it reached');
  const over = { read_at: at(-300), windows: { five_hour: { used_percent: 100, resets_at: at(-10), refused: true } } };
  assert.equal(readingShown('claude', over, NOW).windows[0].limited, false, 'no longer limited once its reset has passed');
  const p = await openWith({ agents: [{ id: 'claude', name: 'Claude Code', kind: 'agent', reading: shown }] });
  const wins = p.all(subRows(p)[0]).filter(n => /\bwin\b/.test(n.className || ''));
  assert.match(wins[0].className, /\bhigh\b/);
  assert.match(wins[0].className, /\blimited\b/);
  assert.equal(p.all(wins[0]).find(n => /\bfigure\b/.test(n.className || '')).textContent, 'Limited');
  assert.match(p.all(wins[0]).find(n => /\bwhen\b/.test(n.className || '')).textContent, /^resets (\d\d:\d\d|tomorrow \d\d:\d\d)$/);
  assert.doesNotMatch(wins[1].className, /\bhigh\b/);
  assert.equal(p.all(wins[1]).find(n => /\bfigure\b/.test(n.className || '')).textContent, '89%', 'never shown as 90% unless it is');
  const css = fs.readFileSync(new URL('../templates/panel-settings.css', import.meta.url), 'utf8');
  assert.match(css, /#settings \.sub \.win\.high \.fill \{[^}]*background: var\(--needs-you\)/);
});

test('0646 AC3: a model provider on an API key shows this week\'s spend from what speck recorded, and says it has no limit to show', async () => {
  const r = repoWith(['claude', 'deepseek']);
  const ds = knownProviders(r.dir).find(p => p.name === 'deepseek');
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const line = (run, ended, model, cost) => JSON.stringify({ id: '0001', run, ended, tokens: 1000, cost_usd: cost, models: [{ model, tokens: { input: 900, cached: 0, write: 0, output: 100 }, cost_usd: cost }] });
  fs.writeFileSync(path.join(runs, 'run.watch-spend.jsonl'), [line('a', new Date(NOW).toISOString(), ds.models[0], 1.25), line('b', new Date(NOW).toISOString(), 'claude-opus-5-5', 9),
    line('c', new Date(NOW - 8 * 86400e3).toISOString(), ds.models[0], 4)].join('\n') + '\n');
  const answer = await subscriptionsAnswer(r.dir, { find: found(), readCursor: noCursor, now: () => NOW });
  const row = rowOf(answer, 'deepseek');
  assert.equal(row.kind, 'provider');
  assert.deepEqual(row.spend, { cost_usd: 1.25, cost_unknown: false, since: weekStart(NOW) }, 'only its own models, this week');
  assert.equal(row.read_at, new Date(NOW).toISOString());
  assert.deepEqual(providerSpend({ models: ['m'] }, [{ model: 'm', cost_usd: null, cost_unknown: true }]), { cost_usd: 0, cost_unknown: true });
  assert.deepEqual(providerSpend({ models: ['m'] }, null), { cost_usd: null, cost_unknown: false }, 'spend that can\'t be read isn\'t $0');
  const p = await openWith({ agents: [row] });
  const text = subRows(p)[0].textContent;
  assert.match(text, /^DeepSeek/);
  assert.match(text, /This week \$1\.25/);
  assert.match(text, /no limit to show/);
  assert.doesNotMatch(text, /%/);
  const q = await openWith({ agents: [{ ...row, spend: { cost_usd: null, cost_unknown: false, since: row.spend.since } }] });
  assert.match(subRows(q)[0].textContent, /This week's spend couldn't be read/);
});

test('0646 self-check: a plan or window named like a built-in key is shown as plain words, or not at all', () => {
  const odd = { read_at: at(-1), plan: 'constructor', windows: { constructor: { used_percent: 5 }, __proto__: { used_percent: 6 }, five_hour: { used_percent: 7, resets_at: at(30) } } };
  const shown = readingShown('codex', odd, NOW);
  assert.equal(shown.plan, 'constructor');
  assert.deepEqual(shown.windows.map(w => w.name), ['five_hour']);
});

test('0646 AC4: each agent says how long ago it was read, and one with no reading says so in one line', async () => {
  const r = repoWith(['claude', 'codex', 'cursor']);
  saveUsage(r.dir, 'claude', CLAUDE);
  const answer = await subscriptionsAnswer(r.dir, { find: found(true), readCursor: async () => ({ why: 'the screen didn\'t show its usage' }), now: () => NOW });
  assert.match(rowOf(answer, 'codex').none, /^No reading yet: [^\n]+\.$/);
  assert.equal(rowOf(answer, 'codex').reading, undefined);
  assert.match(rowOf(answer, 'cursor').why, /Couldn't read Cursor's usage just now: the screen didn't show its usage\./);
  const p = await openWith(answer);
  const [claude, codex, cursor] = subRows(p);
  assert.match(p.all(claude).find(n => /\bstate\b/.test(n.className || '')).textContent, /^read (4 min ago|just now|\d+ min ago)$/);
  const none = p.all(codex).filter(n => n.tagName === 'p');
  assert.equal(none.length, 1, 'one line');
  assert.match(none[0].textContent, /^No reading yet/);
  assert.equal(p.all(codex).filter(n => /\bwin\b/.test(n.className || '')).length, 0);
  assert.match(cursor.textContent, /Couldn't read Cursor's usage just now/);
});

test('0646 AC4: a fresh read of Cursor\'s usage screen is kept and shown, and a fresh reading isn\'t read again', async () => {
  const r = repoWith(['claude', 'cursor']);
  let reads = 0;
  const readCursor = async () => { reads++; return { reading: { ...CURSOR, read_at: new Date(NOW).toISOString() } }; };
  const first = await subscriptionsAnswer(r.dir, { find: found(true), readCursor, now: () => NOW });
  assert.equal(reads, 1);
  assert.equal(rowOf(first, 'cursor').reading.windows[0].label, 'Month');
  await subscriptionsAnswer(r.dir, { find: found(true), readCursor, now: () => NOW + 60000 });
  assert.equal(reads, 1, 'its reading is a minute old');
});

test('0646 AC5: it reads afresh each time Settings opens, and its styles take the look\'s colours and fit a phone-width panel', async () => {
  const p = await openWith({ agents: [] });
  const usageCalls = () => p.agentCalls.filter(c => c.url === '/api/usage').length;
  assert.equal(usageCalls(), 1);
  p.press(p.all(p.byId('settings')).find(n => n.tagName === 'button' && n.textContent === 'Close'));
  await p.settle();
  assert.equal(p.byId('settings').hidden, true);
  await openSettings(p);
  assert.equal(usageCalls(), 2, 'read again on opening');
  const css = fs.readFileSync(new URL('../templates/panel-settings.css', import.meta.url), 'utf8');
  const mine = css.split('\n').filter(l => /#settings \.sub\b/.test(l)).join('\n');
  assert.ok(mine.length > 0);
  assert.doesNotMatch(mine, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'only the look\'s colours, so it works in light and dark');
  assert.match(mine, /\.win \{[^}]*grid-template-columns: 7ch minmax\(0, 1fr\) 7ch/, 'the bar takes what the line has left');
});

test('0646 AC5: a failed read says so in the group, in one line', async () => {
  const p = await openWith({ status: 500, body: { error: 'Couldn\'t read your subscriptions: boom' } });
  assert.match(subsBox(p).textContent, /Couldn't read your subscriptions: boom/);
  const r = panelRepo();
  const out = await subscriptionsAnswer(r.dir, { find: async () => { throw new Error('no agents'); }, readCursor: noCursor });
  assert.deepEqual(out, { why: 'Couldn\'t read your agents: no agents.' });
});

// The group's box, and each agent's row in it.
function subsBox(p) { return p.all(p.byId('settings')).find(n => n.tagName === 'section' && /\bsubs\b/.test(n.className || '')); }
function subRows(p) { return p.all(subsBox(p)).filter(n => /\bsub\b/.test(n.className || '') && /\barow\b/.test(n.className || '')); }
// Settings opened on a page whose GET /api/usage answers `usage`.
async function openWith(usage) {
  const p = agentsPage(settingsWithAgents(YOURS_VIEW()), { 'GET /api/usage': usage });
  await openSettings(p);
  return p;
}

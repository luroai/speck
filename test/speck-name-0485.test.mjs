import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, openQueueRows, page as panelHtml } from './support/panel.mjs';
import { openSettings } from './support/settings.mjs';
import { settingsWithAgents, YOURS_VIEW, agentsBox } from './support/your-agents.mjs';
import { foremanView } from '../scripts/foreman.mjs';
import { rolesUsing, removeAgent } from '../scripts/your-agents.mjs';
import { panelRepo } from './support/panel.mjs';

// ---------- 0485: call the Foreman speck in the panel ----------

const QUESTION = 'Should it keep the old test?';
const OPTION = 'Keep the old test';
const AT = '2026-10-24T10:00:00.000Z';
const time = `${AT.slice(0, 16).replace('T', ' ')} UTC`;
const ON = { on: true, pid: process.pid };

// A board with every state that named the Foreman: a blocked ticket it will take the recommendation for, one blocked
// on a question for you, one it went with the recommendation for, one it's looking into and asks you about, and a
// shipped one.
function board() {
  const tickets = [
    T('0001', 'blocked', { blocked_question: 'Which test?', blocked_recommendation: OPTION, foreman_will: true }),
    T('0002', 'blocked', { blocked_question: 'Which name?', blocked_recommendation: 'A', foreman_will: false }),
    T('0003', 'building', { went_with: { option: OPTION, by: 'foreman', at: AT } }),
    T('0004', 'building'),
    T('0005', 'done'),
  ];
  const agent = { running: { id: '0004', what: 'its build ended', started: AT }, waiting: [], asks: [{ id: '0004', question: QUESTION, at: AT }],
    did: [{ id: '0004', action: 'ask', did: 'asked you', text: QUESTION, why: 'the build stopped on a choice', at: AT, outcome: '' }] };
  const foreman = foremanView({ run: ON, record: { lock: process.pid }, tickets, fixing: 'fix', agent });
  return { tickets, ideas: [], resume_command: '', run: ON, foreman };
}

// A page answering the board, Settings, the run log and every POST, and keeping each node it makes and each confirm.
function page(globals = {}) {
  const made = [], confirms = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    const body = method === 'POST' ? { ok: true } : u.startsWith('/api/settings') ? settingsWithAgents(YOURS_VIEW())
      : u.startsWith('/api/agent-models') ? { agent: '', why: 'no' } : u.startsWith('/api/run-log') ? { lines: [], stamp: null } : board();
    return { ok: true, status: 200, json: async () => structuredClone(body) };
  };
  const p = fakePage([], { fetch, confirm: m => { confirms.push(String(m)); return false; }, ...globals }, { made: n => made.push(n) });
  return { p, made, confirms };
}

// Everything a person can see or hear of `nodes` and what's in them: text, tooltips, placeholders and attributes.
function said(p, nodes) {
  const out = [];
  for (const n of new Set(nodes.flatMap(x => p.all(x)))) {
    out.push(n.tagName === '#text' ? n.textContent : n._text, n.title, n.placeholder, n.label, ...Object.values(n.attrs || {}));
  }
  return out.filter(s => typeof s === 'string' && s);
}
// The setting names 0487 keeps, which are excepted.
const SETTING_NAMES = /\bforeman(_fixing|_model|_effort)?\b/g;
const foremanIn = list => list.filter(s => /foreman/i.test(s.replace(SETTING_NAMES, '')));
const card = (p, id) => queueRows(p).find(r => p.all(r).find(n => n.className === 'id')?._text === id);

const IDS = ['run', 'queue', 'shaping', 'shipped', 'settings', 'foreman', 'full-ticket', 'tab-plan', 'tab-build', 'tab-shipped'];

test('0485 AC1: nowhere in the panel says Foreman, in any case: header, lanes, open cards, a full ticket, the Pipeline log pop-up, Settings and Your agents', async () => {
  const { p, made, confirms } = page();
  await p.settle();
  for (const lane of ['plan', 'shipped', 'build']) { p.press(p.byId(`tab-${lane}`)); await p.settle(); }
  await openQueueRows(p);
  const fullButton = p.all(card(p, '0001')).find(n => n.tagName === 'button' && n.textContent === 'Full ticket');
  assert.ok(fullButton, 'the blocked card has a Full ticket button');
  p.press(fullButton);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false, 'the full ticket is open');
  const dismiss = p.all(card(p, '0004')).find(n => n.tagName === 'button' && n.textContent === 'Dismiss');
  p.press(dismiss);
  await p.settle();
  assert.equal(confirms.length, 1, 'the dismiss asked to confirm');
  p.key('Escape');
  await p.settle();
  p.press(p.byId('run')); // the Pipeline log pop-up
  await p.settle();
  assert.equal(p.byId('foreman').hidden, false, 'the Pipeline log is open');
  const shown = said(p, [...made, ...IDS.map(id => p.byId(id))]);
  await openSettings(p);
  shown.push(...said(p, [...made, p.byId('settings')]));
  assert.ok(agentsBox(p), 'Your agents is drawn');
  for (const words of ['speck will take its recommendation', 'speck asks you', 'speck went with the recommendation', 'Watching'])
    assert.ok(shown.some(s => s.includes(words)), `the scan saw "${words}"`);
  assert.deepEqual(foremanIn([...shown, ...confirms]), []);
  // the page's own markup, outside its ids and classes
  const html = panelHtml().replace(/<!--[\s\S]*?-->/g, '').replace(/\b(id|class|aria-controls)="[^"]*"/g, '');
  assert.doesNotMatch(html, /foreman/i);
});

test('0485 AC1: the scan finds Foreman where it shows, and lets the setting names through', () => {
  assert.deepEqual(foremanIn(['watch is fix', 'set watch_model', 'The FOREMAN asks', 'foremen']), ['The FOREMAN asks']);
});

test('0485 AC2: the cards, the full ticket and the dismiss confirm use the new wording', async () => {
  const { p, confirms } = page();
  await p.settle();
  const closed = card(p, '0001');
  assert.ok(closed.textContent.includes('speck will answer'), closed.textContent);
  await openQueueRows(p);
  const one = card(p, '0001').textContent;
  assert.ok(one.includes(`speck will take its recommendation: ${OPTION}`), one);
  const nowCell = p.all(card(p, '0001')).find(n => n.title === 'Blocked · speck will take its recommendation');
  assert.ok(nowCell, 'the sentence is its tooltip');
  assert.ok(card(p, '0003').textContent.includes(`speck went with the recommendation: ${OPTION} · ${time}`), card(p, '0003').textContent);
  const four = card(p, '0004');
  assert.ok(four.textContent.includes(`speck asks you: ${QUESTION}`), four.textContent);
  const box = p.all(four).find(n => n.tagName === 'textarea');
  assert.equal(box.attrs['aria-label'], 'Your answer to speck\'s question about 0004');
  p.press(p.all(four).find(n => n.tagName === 'button' && n.textContent === 'Dismiss'));
  await p.settle();
  assert.match(confirms[0], /^Dismiss speck's question about 0004: "Should it keep the old test\?"/);
});

test('0485 AC3: speck\'s screen is named speck\'s screen, and its tooltip starts "speck: " before the status word', async () => {
  assert.match(panelHtml(), /<button class="glass" id="run" type="button" aria-label="speck's screen"/);
  const { p } = page();
  await p.settle();
  const run = p.byId('run');
  assert.equal(run.attrs['aria-label'], 'speck\'s screen', 'still its name once the board is drawn');
  assert.match(run.title, /^speck: Needs you 2 · The pipeline: speck run's log$/);
});

test('0485 AC4: Settings titles the group Watching, and the role is called speck in Your agents', async () => {
  const { p } = page();
  await p.settle();
  await openSettings(p);
  const titles = p.all(p.byId('settings')).filter(n => n.tagName === 'h4').map(n => n.textContent);
  assert.ok(titles.includes('Watching'), titles.join(', '));
  assert.deepEqual(rolesUsing('deepseek', { builder: 'claude', reviewer: 'codex', foreman: 'deepseek' }), ['speck']);
  assert.deepEqual(rolesUsing('claude', { builder: 'claude', reviewer: 'codex' }), ['builder', 'speck']);
});

test('0485 AC4: removing the agent speck watches with is still refused, in the same words', () => {
  const r = panelRepo();
  assert.throws(() => removeAgent(r.dir, 'claude', { builder: 'claude', reviewer: 'codex' }),
    { message: 'Claude Code is the builder and the agent speck watches with, so it wasn\'t removed. Set the builder and the agent speck watches with to another agent first, then remove it.' });
});

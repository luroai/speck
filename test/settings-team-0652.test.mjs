import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { openSettings, rowOf, controlOf, changeTo, saveButton } from './support/settings.mjs';
import { agentsPage, YOURS_VIEW, AGENTS_FOUND } from './support/your-agents.mjs';
import { panelSettings, panelSaveSettings, settingsAnswer, EDITABLE, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { teamNow, teamShown, TEAM_KEYS } from '../scripts/team.mjs';
import { machineConfig } from '../scripts/machine.mjs';

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

// ---------- 0652: turn Settings into your team ----------

const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), default_model: 'sonnet' },
  { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', description: null, efforts: ['low', 'high'] }], default_model: 'gpt-6.1-sol' }];
// GET /api/settings as the server gives it for a fresh project, with Virgil as speck_name, your agents and their models.
function viewOf(dir, extra = {}) {
  const v = { ...panelSettings(dir), your_agents: YOURS_VIEW(), agent_models: structuredClone(AGENT_MODELS), ...extra };
  for (const g of v.groups) for (const s of g.settings) if (s.key === 'speck_name') s.value = 'Virgil';
  return v;
}
async function opened(view) {
  const p = agentsPage(view, { 'GET /api/usage': { agents: [] } });
  await openSettings(p);
  return p;
}
const pane = p => p.byId('settings');
const has = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const cards = p => p.all(pane(p)).filter(n => has(n, 'member'));
const cardOf = (p, member) => cards(p).find(n => n.attrs['data-member'] === member);
const inside = (p, outer, n) => !!n && p.all(outer).includes(n);
const sections = p => pane(p).children.filter(n => /\b(sgroup|switches)\b/.test(n.className || ''));
const limitOf = (p, member) => p.all(cardOf(p, member)).find(n => has(n, 'limit'));

test('0652 AC1: Settings opens with Your team, a card each for Virgil, the Builder, the Reviewer and QA, with its character and job', async () => {
  const p = await opened(viewOf(panelRepo().dir));
  const [team] = sections(p);
  assert.ok(has(team, 'team'), 'Your team comes first');
  assert.equal(p.all(team).find(n => n.tagName === 'h4').textContent, 'Your team');
  assert.deepEqual(cards(p).map(c => c.attrs['data-member']), ['manager', 'builder', 'reviewer', 'qa']);
  assert.deepEqual(cards(p).map(c => p.all(c).find(n => n.tagName === 'h5').textContent), ['Virgil', 'Builder', 'Reviewer', 'QA'], 'Virgil named with speck_name');
  for (const c of cards(p)) {
    const face = p.all(c).find(n => n.tagName === 'svg');
    assert.ok(face && /\bspeck-face\b/.test(face.attrs.class || face.className || ''), 'its character');
    if (c.attrs['data-member'] === 'manager') assert.match(face.attrs['aria-label'], /^Virgil/);
    else assert.equal(face.attrs['data-role'], c.attrs['data-member']);
    const job = p.all(c).find(n => has(n, 'job'));
    assert.ok(job && job.textContent.length > 10 && !job.textContent.includes('\n'), 'its job in one line');
  }
});

test('0652 AC1: each card holds the agent, model and effort its member runs on, and its bench in order', async () => {
  const p = await opened(viewOf(panelRepo().dir));
  const keys = { manager: ['speck_name', 'watch', 'watch_agent', 'watch_effort', 'watch_bench'], builder: ['builder', 'builder_effort', 'builder_bench'],
    reviewer: ['reviewer', 'reviewer_effort', 'reviewer_bench'], qa: ['qa_agent', 'qa_effort', 'qa_bench'] };
  for (const [member, list] of Object.entries(keys)) for (const key of list) assert.ok(inside(p, cardOf(p, member), rowOf(p, key)), `${key} on ${member}'s card`);
  // One list each for the agent and model, as "<agent>|<model>", with the effort beside it.
  assert.equal(controlOf(p, 'builder').value, 'claude|');
  assert.equal(controlOf(p, 'reviewer').value, 'codex|');
  assert.equal(controlOf(p, 'qa_agent').value, '|', 'QA blank: the watch agent\'s');
  assert.match(p.all(controlOf(p, 'qa_agent')).find(n => n.tagName === 'option').textContent, /^Virgil's agent, now Claude Code/);
  // The bench in order: blank is your agents in order, without the member's own.
  const bench = key => p.all(rowOf(p, key)).find(n => has(n, 'bench')).textContent;
  assert.equal(bench('builder_bench'), 'Blank: your agents in order: Codex.');
  assert.equal(bench('reviewer_bench'), 'Blank: your agents in order: Claude Code.');
  assert.equal(bench('qa_bench'), 'With QA\'s settings blank, QA uses Virgil\'s bench: Codex.');
  changeTo(p, 'builder_bench', 'cursor, codex');
  assert.equal(bench('builder_bench'), 'Stands in, in order: Cursor, then Codex.');
  changeTo(p, 'builder', 'codex|');
  assert.equal(bench('watch_bench'), 'Blank: your agents in order: Claude Code.', 'the watch agent runs on a Codex builder\'s agent');
});

test('0652 AC2: a card\'s agent, model, effort and bench are saved with Save, each for this machine', async () => {
  const p = await opened(viewOf(panelRepo().dir));
  changeTo(p, 'qa_agent', 'claude|opus');
  changeTo(p, 'qa_effort', 'high');
  changeTo(p, 'builder_bench', 'codex');
  changeTo(p, 'reviewer', 'claude|opus');
  assert.equal(saveButton(p).disabled, false);
  p.press(saveButton(p));
  await p.settle();
  const [sent] = p.posts().map(c => decodeURIComponent(c.url));
  assert.ok(sent.startsWith('/api/settings/save?'), sent);
  for (const part of ['machine:qa_agent=claude', 'machine:qa_model=opus', 'machine:qa_effort=high', 'machine:builder_bench=codex', 'machine:reviewer=claude', 'machine:reviewer_model=opus'])
    assert.ok(sent.split('?')[1].split('&').includes(part), `${part} in ${sent}`);
});

test('0652 AC2: the server saves Your team\'s settings for this machine only, with the same checks as speck config set', () => {
  const r = panelRepo(), cfg = path.join(r.dir, 'speck', 'config.yml'), before = fs.readFileSync(cfg, 'utf8');
  for (const key of TEAM_KEYS) assert.ok(EDITABLE.includes(key), `${key} can be changed in the panel`);
  const rows = Object.fromEntries(panelSettings(r.dir).groups.flatMap(g => g.settings).map(s => [s.key, s]));
  for (const key of TEAM_KEYS) {
    assert.equal(rows[key].for_machine, true, key);
    assert.match(rows[key].explain, /saved for your machine only/, key);
  }
  assert.deepEqual(rows.qa_agent.choices.slice(0, 4), ['', 'claude', 'codex', 'cursor']);
  const save = changes => panelSaveSettings(r.dir, changes.map(([key, value]) => ({ key, value, machine: true })));
  const ok = save([['builder_bench', 'codex, cursor'], ['qa_agent', 'cursor'], ['qa_model', 'auto'], ['qa_effort', 'high'], ['qa_bench', 'codex']]);
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const mine = machineConfig(r.dir);
  assert.deepEqual(mine.builder_bench, ['codex', 'cursor']);
  assert.deepEqual([mine.qa_agent, mine.qa_model, mine.qa_effort], ['cursor', 'auto', 'high']);
  assert.equal(fs.readFileSync(cfg, 'utf8'), before, 'nothing written to speck/config.yml');
  // Refused as speck config set refuses them, and nothing saved.
  for (const [key, value, why] of [['builder_bench', 'claude', /builder's own agent/], ['reviewer_bench', 'nosuch', /doesn't know/], ['qa_agent', 'nosuch', /qa_agent must be/], ['qa_effort', 'huge', /qa_effort must be/]]) {
    const out = save([[key, value]]);
    assert.equal(out.status, 422, `${key} ${value}`);
    assert.match(out.body.refused[key], why);
  }
  assert.deepEqual(machineConfig(r.dir), mine, 'the refusals changed nothing');
});

test('0652 AC3: Your subscriptions sits under the cards, then the rest of Settings as it was', async () => {
  const p = await opened(viewOf(panelRepo().dir));
  const kinds = sections(p).map(s => ['team', 'subs', 'switches', 'agents'].find(c => has(s, c)) ?? p.all(s).find(n => n.tagName === 'h4').textContent);
  assert.deepEqual(kinds, ['team', 'subs', 'switches', 'agents', 'Shipping', 'Building and reviewing']);
  const building = sections(p)[5];
  for (const key of ['allow_same_model_review', 'max_parallel_builds', 'max_parallel_tests', 'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds'])
    assert.ok(inside(p, building, rowOf(p, key)), `${key} stays in Building and reviewing`);
  for (const key of ['builder', 'reviewer']) assert.ok(!inside(p, building, rowOf(p, key)), `${key} is on its card`);
  for (const key of ['auto_ship', 'auto_ship_risk', 'ship_mode']) assert.ok(inside(p, sections(p)[4], rowOf(p, key)), `${key} stays in Shipping`);
});

test('0652 AC4: while a member\'s agent is limited, the first ready agent on its bench that isn\'t limited stands in', () => {
  const ready = ['claude', 'codex', 'cursor'], held = a => a === 'claude';
  const t = teamNow({ builder: 'claude', reviewer: 'codex' }, { ready, held });
  assert.deepEqual(t.builder, { agent: 'claude', limited: true, stand_in: 'codex' });
  assert.deepEqual(t.reviewer, { agent: 'codex', limited: false });
  assert.deepEqual(t.manager, { agent: 'claude', limited: true, stand_in: 'codex' });
  assert.deepEqual(t.qa, { agent: 'claude', limited: true, stand_in: 'codex' });
  // Its own bench, in order, skipping one not ready or limited itself.
  assert.equal(teamNow({ builder: 'claude', builder_bench: ['cursor', 'codex'] }, { ready: ['claude', 'codex'], held }).builder.stand_in, 'codex');
  assert.equal(teamNow({ builder: 'claude', builder_bench: ['codex', 'cursor'] }, { ready, held: a => a !== 'cursor' }).builder.stand_in, 'cursor');
  assert.equal(teamNow({ builder: 'claude' }, { ready: ['claude'], held }).builder.stand_in, null, 'none can');
  // The reviewer's stand-in mustn't be the builder's model family.
  assert.equal(teamNow({ builder: 'codex', reviewer: 'claude', reviewer_bench: ['codex', 'cursor'] }, { ready, held }).reviewer.stand_in, 'cursor');
  // QA's settings blank: the watch agent's bench. Set: its own.
  assert.equal(teamNow({ builder: 'claude', watch_bench: ['cursor'] }, { ready, held }).qa.stand_in, 'cursor');
  assert.equal(teamNow({ builder: 'claude', watch_bench: ['cursor'], qa_bench: ['codex'] }, { ready, held }).qa.stand_in, 'codex');
  // A bench speck refuses has no one to stand in.
  assert.equal(teamNow({ builder: 'claude', builder_bench: ['nosuch'] }, { ready, held }).builder.stand_in, null);
});

test('0652 AC4: the settings answer says each member\'s limit, from your agents that are ready', async () => {
  const r = panelRepo(), yours = YOURS_VIEW({ cursor: true });
  assert.equal(teamShown(r.dir, yours, [], { held: a => a === 'claude' }).builder.stand_in, 'cursor', 'Codex isn\'t ready, Cursor is');
  const answer = await settingsAnswer(r.dir, async () => ({ models: [] }), async () => ({ models: [] }), async () => structuredClone(AGENTS_FOUND), []);
  assert.deepEqual(answer.team.builder, { agent: 'claude', limited: false }, 'no limit on record');
  assert.deepEqual(Object.keys(answer.team), ['manager', 'builder', 'reviewer', 'qa']);
});

test('0652 AC4: a limited member\'s card says so and which bench agent stands in', async () => {
  const team = { manager: { agent: 'claude', limited: true, stand_in: null }, builder: { agent: 'claude', limited: true, stand_in: 'codex' },
    reviewer: { agent: 'codex', limited: false }, qa: { agent: 'claude', limited: true, stand_in: 'codex' } };
  const p = await opened(viewOf(panelRepo().dir, { team }));
  assert.equal(limitOf(p, 'builder').hidden, false);
  assert.equal(limitOf(p, 'builder').textContent, 'Claude Code is limited, so Codex stands in from the bench until the limit resets.');
  assert.equal(limitOf(p, 'manager').textContent, 'Claude Code is limited, so no agent on the bench can stand in, and its work waits until the limit resets.');
  assert.equal(limitOf(p, 'reviewer').hidden, true, 'not limited: nothing said');
  // Another agent picked for it: the limit isn't its any more.
  changeTo(p, 'qa_agent', 'codex|');
  assert.equal(limitOf(p, 'qa').hidden, true);
});

test('0652 AC5: no setting is lost from Settings, with or without your agents\' models', async () => {
  const dir = panelRepo().dir, keys = panelSettings(dir).groups.flatMap(g => g.settings).map(s => s.key);
  for (const team of [true, false]) {
    const v = viewOf(dir);
    if (!team) delete v.agent_models; // each agent and its model in lists of their own
    const p = await opened(v);
    for (const key of keys) {
      if (team && /_model$/.test(key) && key !== 'allow_same_model_review') continue; // in its agent's one list
      assert.ok(rowOf(p, key), `${key} is shown${team ? '' : ' without the models'}`);
    }
  }
});

// ---------- AC5: at a phone's width, in both looks, in a real browser ----------

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0652 AC5: at 320 px, in the light and the dark look, Your team\'s cards fit with nothing past the view', { skip, timeout: 60000 }, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.until(`document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`document.getElementById('settings-open').click(), true`);
    await b.until(`document.querySelectorAll('#settings .member').length === 4`, 'the cards');
    for (const look of ['light', 'dark']) {
      await b.js(`document.getElementById('look-${look}').click(), true`);
      await b.until(`document.documentElement.dataset.theme === '${look}'`, 'the look');
      const d = await b.js(`(() => {
        const pane = document.getElementById('settings'), right = Math.min(innerWidth, pane.getBoundingClientRect().right);
        const wide = [...pane.querySelectorAll('.team *')].filter(n => n.getClientRects().length && !n.closest('p.explain') && n.getBoundingClientRect().right > right + 0.5).map(n => n.tagName + '.' + n.className);
        const heads = [...pane.querySelectorAll('.member .mhead')].map(h => { const f = h.querySelector('.speck-face').getBoundingClientRect(), n = h.querySelector('h5').getBoundingClientRect(); return f.width > 0 && f.right <= n.left && f.top < n.bottom && n.top < f.bottom; });
        return { wide, heads, sw: pane.scrollWidth, cw: pane.clientWidth };
      })()`);
      assert.deepEqual(d.wide, [], `${look}: nothing in Your team past the view`);
      assert.ok(d.sw <= d.cw, `${look}: no sideways scroll`);
      assert.deepEqual(d.heads, [true, true, true, true], `${look}: each character beside its name`);
    }
  } finally { await b.close(); await stop(panel); }
});

test('0652 AC1 (self-check): a bench naming a built-in such as constructor or __proto__ is shown as typed', async () => {
  const p = await opened(viewOf(panelRepo().dir));
  changeTo(p, 'builder_bench', 'constructor, __proto__');
  assert.equal(p.all(rowOf(p, 'builder_bench')).find(n => has(n, 'bench')).textContent, 'Stands in, in order: constructor, then __proto__.');
});

test('0652 AC1 (round 1 F1): with QA\'s settings blank, QA\'s card says it runs on the watch agent\'s model and effort', async () => {
  const v = viewOf(panelRepo().dir);
  for (const g of v.groups) for (const s of g.settings) { if (s.key === 'watch_model') s.value = 'opus'; if (s.key === 'watch_effort') s.value = 'high'; }
  const p = await opened(v);
  const line = () => p.all(rowOf(p, 'qa_agent')).find(n => has(n, 'inherit'))?.textContent ?? null;
  assert.equal(line(), 'With QA\'s settings blank, QA runs as Virgil\'s agent does: Claude Code · Opus, high effort. Set any of them to give QA its own, where blank is its agent\'s default.');
  changeTo(p, 'watch_effort', 'low');
  assert.match(line(), /Claude Code · Opus, low effort\./, 'follows the watch agent\'s effort as it\'s picked');
  changeTo(p, 'qa_effort', 'max');
  assert.equal(line(), null, 'QA\'s own once any is set');
});

test('0652 AC1 (round 2 F1): without your agents\' models, QA\'s line follows the watch agent and the builder it falls back on', async () => {
  const v = viewOf(panelRepo().dir);
  delete v.agent_models; // each agent and its model in lists of their own
  const p = await opened(v);
  const line = () => p.all(rowOf(p, 'qa_agent')).find(n => has(n, 'inherit'))?.textContent ?? '';
  assert.match(line(), /Virgil's agent does: Claude Code · /);
  changeTo(p, 'builder', 'codex');
  assert.match(line(), /Virgil's agent does: Codex · /, 'the watch agent left blank runs on a Codex builder\'s agent');
  changeTo(p, 'watch_agent', 'cursor');
  assert.match(line(), /Virgil's agent does: Cursor · /);
});

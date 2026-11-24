import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heldTimeouts, page, styles } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, changeTo } from './support/settings.mjs';
import { CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0405: one info button on a role's Settings row. 0729: its name, which shows the one explanation ----------

const SAVED = 'A change here is saved for your machine only, without a commit.';
const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })) },
  { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', efforts: ['low', 'high'] }] },
  { id: 'cursor', name: 'Cursor', efforts: false, models: [{ slug: 'auto', display_name: 'Auto' }] }];
const YOURS = { list: true, agents: AGENT_MODELS.map(a => ({ id: a.id, name: a.name, kind: 'agent', yours: true, ready: true, roles: [] })) };
const EFFORTS = ['', 'low', 'medium', 'high', 'xhigh', 'max'];
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does. ${SAVED}`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const view = ({ builder = 'claude', models = true, effortFrom = 'repo' } = {}) => ({ groups: [
  { title: 'Your engineering manager', settings: [S('watch_agent', '', { choices: ['', 'claude', 'codex', 'cursor'] }), S('watch_model', ''), S('watch_effort', '', { choices: EFFORTS })] },
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex', 'cursor'], build_command: { value: '', own: { claude: '', codex: '', cursor: '' }, each_ticket: true } }),
    S('builder_model', ''), S('builder_effort', '', { choices: EFFORTS }),
    S('reviewer', 'codex', { choices: ['codex', 'claude', 'cursor'] }),
    S('reviewer_model', ''), S('reviewer_effort', 'high', { choices: EFFORTS, from: effortFrom, repo_value: 'low' })] },
  { title: 'Ticket size limits', settings: [S('limits.max_review_rounds', 3, { editable: false, for_machine: false })] }],
  builder_models: { builder, models: [] }, reviewer_models: { reviewer: 'codex', models: [] }, foreman_models: { foreman: builder, models: [] },
  claude_models: CLAUDE_MODELS, providers: [],
  ...(models ? { your_agents: YOURS, agent_models: AGENT_MODELS } : {}) });

const cls = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
// 0729: the buttons that show an explanation, each a setting's name, by the key of the row it names
const rowKey = n => { for (; n; n = n.parentNode) if (n.attrs?.['data-key']) return n.attrs['data-key']; return null; };
const infos = (p, node) => p.all(node).filter(n => n.tagName === 'button' && cls(n, 'name')).map(b => ({ b, key: rowKey(b) }));
const tipsIn = (p, node) => p.all(node).filter(n => n.tagName === 'p' && cls(n, 'explain'));
const shown = (p, n) => { for (let m = n; m && m !== p.byId('settings'); m = m.parentNode) if (m.hidden) return false; return true; };
const opened = async (v, globals = {}) => { const p = settingsPage([v], [], globals); await p.settle(); await openSettings(p); return p; };
const ROLES = ['builder', 'reviewer', 'watch_agent'];
const effortOf = role => role === 'watch_agent' ? 'watch_effort' : `${role}_effort`; // 0487

test('0405 AC1: builder, reviewer and Foreman each show one name, which shows the explanation, in the row that holds their effort', async () => {
  const p = await opened(view());
  for (const role of ROLES) {
    const row = rowOf(p, role), effort = rowOf(p, effortOf(role));
    assert.ok(p.all(row).includes(effort), `${role}'s effort sits in its row`);
    assert.ok(shown(p, effort), `${role}'s agent takes an effort`);
    assert.deepEqual(infos(p, row).map(i => i.key), [role], `${role}: one name, the role's`);
    assert.equal(tipsIn(p, row).length, 1, `${role}: one explanation`);
  }
});

test('0405 AC1: a role still has one name after its agent changes, back to one that takes an effort', async () => {
  const p = await opened(view());
  changeTo(p, 'builder', 'cursor|auto');
  changeTo(p, 'builder', 'codex|gpt-6.1-sol');
  for (const role of ['builder', 'watch_agent']) {
    assert.deepEqual(infos(p, rowOf(p, role)).map(i => i.key), [role], role);
    assert.equal(tipsIn(p, rowOf(p, role))[0].textContent, `What ${role} does. What ${effortOf(role)} does. ${SAVED}`, `${role}: its effort explained again`);
  }
});

test('0405 AC2: the one explanation covers the role and its effort, saying where a change is saved once', async () => {
  const p = await opened(view());
  for (const role of ROLES) {
    const tip = tipsIn(p, rowOf(p, role))[0];
    assert.equal(tip.textContent, `What ${role} does. What ${effortOf(role)} does. ${SAVED}`, role);
    assert.equal(infos(p, rowOf(p, role))[0].b.attrs['aria-describedby'], tip.id, 'a screen reader reads it with the button');
  }
});

test('0405 AC2: a press and Escape show and hide it as for any setting (0729: a press of its name)', async () => {
  const clock = heldTimeouts();
  const p = await opened(view(), { setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  const info = infos(p, rowOf(p, 'reviewer'))[0].b, tip = () => tipsIn(p, rowOf(p, 'reviewer'))[0];
  assert.equal(tip().hidden, true, 'hidden until asked');
  assert.equal(info.listeners.mouseenter, undefined, 'nothing shows from the pointer resting on it');
  p.press(info);
  assert.equal(tip().hidden, false, 'a press shows it');
  p.key('Escape');
  assert.equal(tip().hidden, true, 'Escape hides it');
  p.press(info);
  p.press(info);
  assert.equal(tip().hidden, true, 'and so does a second press');
});

test('0405 AC2: this machine\'s own effort is said, with its button, in the role\'s one explanation', async () => {
  const p = await opened(view({ effortFrom: 'machine' }));
  const tip = tipsIn(p, rowOf(p, 'reviewer'))[0];
  assert.match(tip.textContent, /This is your machine's own value, used over the project's: low\./);
  const clear = p.all(tip).find(n => n.tagName === 'button' && n.textContent === 'Clear this machine\'s value');
  assert.ok(clear, 'its button is there');
  p.press(clear);
  const after = tipsIn(p, rowOf(p, 'reviewer'))[0];
  assert.match(after.textContent, /This machine's value, high, is being cleared\./); // 0731: at once
  assert.equal(after.hidden, false, 'the role\'s explanation stays open');
  assert.deepEqual(infos(p, rowOf(p, 'reviewer')).map(i => i.key), ['reviewer']);
});

test('0405 AC3: a role whose agent takes no effort keeps one name, explaining only the role', async () => {
  const p = await opened(view({ builder: 'cursor|auto' }));
  changeTo(p, 'builder', 'cursor|auto');
  for (const role of ['builder', 'watch_agent']) {
    const row = rowOf(p, role);
    assert.equal(shown(p, rowOf(p, effortOf(role))), false, `${role}: Cursor takes no effort`);
    assert.deepEqual(infos(p, row).map(i => i.key), [role], role);
    assert.equal(tipsIn(p, row)[0].textContent, `What ${role} does. ${SAVED}`, role);
  }
});

test('0405 AC3: other rows keep their own name and explanation, the effort rows without your agents\' models too', async () => {
  const p = await opened(view({ models: false }));
  for (const key of ['reviewer_effort', 'builder_effort', 'limits.max_review_rounds']) {
    const own = infos(p, rowOf(p, key)).filter(i => i.key === key);
    assert.equal(own.length, 1, key);
  }
  // 0729: a model drawn in its agent's row (0381) has no name of its own, so it's explained with its agent
  assert.deepEqual(infos(p, rowOf(p, 'reviewer_model')), [], 'the model has no name of its own');
  assert.equal(tipsIn(p, rowOf(p, 'reviewer'))[0].textContent, `What reviewer does. What reviewer_model does. ${SAVED}`, 'its agent\'s explanation covers it');
  const q = await opened(view());
  assert.deepEqual(infos(q, rowOf(q, 'limits.max_review_rounds')).map(i => i.key), ['limits.max_review_rounds']);
  assert.equal(tipsIn(q, rowOf(q, 'limits.max_review_rounds'))[0].textContent, `What limits.max_review_rounds does. ${SAVED}`);
});

test('0405 AC2: an effort with no explanation of its own leaves the role\'s as it is', async () => {
  const v = view();
  delete v.groups[1].settings.find(x => x.key === 'reviewer_effort').explain;
  const p = await opened(v);
  assert.equal(tipsIn(p, rowOf(p, 'reviewer'))[0].textContent, `What reviewer does. ${SAVED}`);
});

test('0405 AC2: an explanation taller than a narrow view scrolls inside it rather than running off it', () => {
  const css = styles();
  const rules = [...css.matchAll(/#settings \.setting p\.explain \{([^}]*)\}/g)].map(m => m[1]).join(';');
  assert.match(rules, /max-height: 60vh/);
  assert.match(rules, /overflow-y: auto/);
});

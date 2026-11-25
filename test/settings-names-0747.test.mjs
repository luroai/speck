// 0747: each Settings control is named by its setting's plain name, as its row shows it, not by its key; a row with
// two controls names each for which it is; and each control keeps its key in data-setting, for tests to find it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { settingsPage, openSettings, rowOf } from './support/settings.mjs';
import { panelSettings, CLAUDE_MODELS } from '../scripts/settings.mjs';

function repoWith(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0747-'));
  fs.mkdirSync(path.join(dir, 'speck', '.cache', 'machine'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), config);
  return dir;
}
const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })) },
  { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', efforts: ['low', 'high'] }] }];
const YOURS = { list: true, agents: AGENT_MODELS.map(a => ({ id: a.id, name: a.name, kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: [] })) };
const CONFIG = 'speck_name: Virgil\nreviewer: codex\nwatch_agent: claude\n';
// What speck panel answers, with your agents' models (one list per role, its effort beside it) or without (an agent's
// list with its model's beside it).
const withAgents = () => ({ ...panelSettings(repoWith(CONFIG)), your_agents: YOURS, agent_models: AGENT_MODELS });
const withoutAgents = () => panelSettings(repoWith(CONFIG));
const opened = async v => { const p = settingsPage([v]); await p.settle(); await openSettings(p); return p; };
const pane = p => p.byId('settings');
const isControl = n => n.tagName === 'select' || n.tagName === 'input' || (n.tagName === 'button' && n.attrs?.role === 'switch');
// The controls of a setting, found by the key they keep in data-setting.
const controlsOf = (p, key) => p.all(pane(p)).filter(n => isControl(n) && n.attrs?.['data-setting'] === key);
const nameOf = n => n.attrs?.['aria-label'];
// The agents and the models and efforts drawn in their rows: AC2's.
const TWOS = ['builder', 'builder_model', 'builder_effort', 'reviewer', 'reviewer_model', 'reviewer_effort', 'watch_agent', 'watch_model', 'watch_effort', 'qa_agent', 'qa_model', 'qa_effort'];

for (const [how, view] of [['with your agents\' models', withAgents], ['without them', withoutAgents]]) {
  test(`0747 AC1: each list, box and switch in Settings is named by its row's plain name, never its key (${how})`, async () => {
    const v = view(), p = await opened(v);
    const served = v.groups.flatMap(g => g.settings), keys = served.map(s => s.key);
    const controls = p.all(pane(p)).filter(isControl);
    assert.ok(controls.length > 20, `the view's controls: ${controls.length}`);
    for (const c of controls) {
      assert.ok(nameOf(c) || c.id === 'run-switch', `${c.tagName} ${c.attrs?.['data-setting']}: has a name`);
      assert.ok(!keys.includes(nameOf(c)), `${c.attrs?.['data-setting']}: named ${nameOf(c)}, a key`);
      assert.doesNotMatch(String(nameOf(c) ?? ''), /\b[a-z]+_[a-z_]+\b|\blimits\./, `${c.attrs?.['data-setting']}: no key in its name`);
    }
    const shown = served.filter(s => s.editable === true && controlsOf(p, s.key).length);
    assert.ok(shown.length > 15, `controls found by their keys: ${shown.length}`);
    for (const s of shown.filter(s => !TWOS.includes(s.key) && s.key !== 'auto_ship_risk')) {
      assert.equal(controlsOf(p, s.key).length, 1, `${s.key}: one control`);
      assert.equal(nameOf(controlsOf(p, s.key)[0]), s.label, `${s.key}: named as its row shows it`);
    }
    assert.equal(nameOf(controlsOf(p, 'speck_name')[0]), 'Name');
    assert.equal(nameOf(controlsOf(p, 'watch')[0]), 'Watch');
    assert.equal(nameOf(controlsOf(p, 'auto_ship')[0]), 'Auto-ship', 'a switch too');
    assert.equal(nameOf(controlsOf(p, 'max_parallel_builds')[0]), 'Builds at once', 'a box too');
  });
}

test('0747 AC1: each of auto-ship\'s risk boxes is named by its setting\'s plain name and its risk', async () => {
  const p = await opened(withoutAgents());
  assert.deepEqual(controlsOf(p, 'auto_ship_risk').map(nameOf), ['Auto-ship risks: low', 'Auto-ship risks: high']);
});

test('0747 AC2: with your agents\' models, each role\'s list and its effort beside it are named for which they are', async () => {
  const p = await opened(withAgents());
  const named = key => controlsOf(p, key).map(nameOf);
  assert.deepEqual(named('builder'), ['Builder']);
  assert.deepEqual(named('builder_effort'), ['Builder effort']);
  assert.deepEqual(named('reviewer'), ['Reviewer']);
  assert.deepEqual(named('reviewer_effort'), ['Reviewer effort']);
  assert.deepEqual(named('watch_agent'), ['Virgil'], 'the engineering manager by the name you gave it');
  assert.deepEqual(named('watch_effort'), ['Virgil effort']);
  // each pair is in one row, the role's
  assert.ok(p.all(rowOf(p, 'builder')).includes(controlsOf(p, 'builder_effort')[0]), 'one row');
});

test('0747 AC2: without them, each agent\'s list and its model\'s beside it are named for which they are', async () => {
  const p = await opened(withoutAgents());
  const named = key => controlsOf(p, key).map(nameOf);
  assert.deepEqual(named('builder'), ['Builder']);
  assert.deepEqual(named('builder_model'), ['Builder model']);
  assert.deepEqual(named('reviewer'), ['Reviewer']);
  assert.deepEqual(named('reviewer_model'), ['Reviewer model']);
  assert.deepEqual(named('watch_agent'), ['Virgil']);
  assert.deepEqual(named('watch_model'), ['Virgil model']);
  assert.deepEqual(named('builder_effort'), ['Effort'], 'an effort on a row of its own keeps its row\'s name');
  assert.ok(p.all(rowOf(p, 'builder')).includes(controlsOf(p, 'builder_model')[0]), 'one row');
});

test('0747 AC3: every setting\'s control keeps its key in data-setting, so it can be found without its name', async () => {
  const v = withoutAgents(), p = await opened(v);
  for (const s of v.groups.flatMap(g => g.settings).filter(s => s.editable === true)) {
    if (!rowOf(p, s.key)) continue; // not drawn in this view
    assert.ok(controlsOf(p, s.key).length >= 1, `${s.key}: its control is found by its key`);
  }
});

test('0747 AC2 self-check: a role\'s list picked for an agent without efforts is named as its row shows it, alone, and again for its pair once one with efforts is picked', async () => {
  const models = [...AGENT_MODELS, { id: 'cursor', name: 'Cursor', efforts: false, models: [{ slug: 'auto' }] }];
  const yours = { list: true, agents: models.map(a => ({ id: a.id, name: a.name, kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: [] })) };
  const p = await opened({ ...panelSettings(repoWith(CONFIG)), your_agents: yours, agent_models: models });
  const list = controlsOf(p, 'reviewer')[0];
  assert.equal(nameOf(list), 'Reviewer');
  const pick = v => { list.value = v; list.listeners.change({ target: list }); };
  pick('cursor|');
  await p.settle();
  assert.equal(controlsOf(p, 'reviewer')[0], list, 'the same list, kept');
  assert.equal(rowOf(p, 'reviewer_effort').hidden, true, 'no effort beside it');
  assert.equal(nameOf(list), 'Agent', 'named as its row shows it');
  pick('codex|');
  await p.settle();
  assert.equal(nameOf(list), 'Reviewer');
});

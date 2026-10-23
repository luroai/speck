import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deferred } from './support/panel.mjs';
import { settingsPage, openSettings, controlOf, changeTo, saveButton } from './support/settings.mjs';
import { CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0409: Settings opens straight onto its groups, with no full-view loading line ----------

const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const quick = () => ({ groups: [
  { title: 'Building and reviewing', settings: [
    S('builder', 'claude', { choices: ['claude', 'codex'], build_command: { value: '', own: { claude: '', codex: '' }, each_ticket: true } }),
    S('reviewer', 'codex', { choices: ['codex', 'claude'] }), S('max_parallel_builds', 2, { for_machine: false })] }],
  claude_models: CLAUDE_MODELS, providers: [], loading: true });
const full = () => {
  const v = quick();
  delete v.loading;
  return { ...v, builder_models: { builder: 'claude', models: CLAUDE_MODELS }, reviewer_models: { reviewer: 'codex', models: [] }, foreman_models: null,
    your_agents: { list: true, agents: [{ id: 'claude', name: 'Claude Code', kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: ['builder'] }] },
    agent_models: [{ id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), default_model: 'sonnet' }] };
};

const pane = p => p.byId('settings');
const groupTitles = p => p.all(pane(p)).filter(n => n.tagName === 'h4').map(n => n.textContent);
// Each time the view is drawn while it shows: what it says, and the group headings in it.
function paints(p) {
  const seen = [], el = pane(p), draw = el.replaceChildren;
  el.replaceChildren = (...cs) => {
    draw(...cs);
    if (!el.hidden) seen.push({ text: el.textContent, titles: groupTitles(p) });
  };
  return seen;
}
const LOADING_VIEW = /Loading the settings|Loading Settings/i;

test('0409 AC1: opening Settings never shows a full-view loading line, and its first paint has the groups and their values', async () => {
  const first = deferred();
  const p = settingsPage([first, deferred()]);
  const seen = paints(p);
  await openSettings(p);
  assert.equal(pane(p).hidden, true, 'not shown until the config has come back');
  assert.doesNotMatch(pane(p).textContent, LOADING_VIEW);
  assert.equal(seen.length, 0, 'nothing drawn yet');
  first.resolve(quick());
  await p.settle();
  assert.equal(pane(p).hidden, false);
  assert.ok(seen.length > 0);
  assert.ok(seen[0].titles.includes('Building and reviewing'), `the first paint has the groups: ${seen[0].titles}`);
  for (const s of seen) assert.doesNotMatch(s.text, LOADING_VIEW);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '2');
});

test('0409 AC1: a second press while Settings is opening reads the settings once', async () => {
  const first = deferred();
  const p = settingsPage([first, deferred(), quick(), deferred()]);
  await openSettings(p);
  await openSettings(p);
  first.resolve(quick());
  await p.settle();
  assert.equal(p.settingsCalls.filter(c => c.url === '/api/settings?quick=1').length, 1);
  assert.equal(pane(p).hidden, false);
});

test('0409 AC1: settings that can\'t be read open onto why, not a loading line', async () => {
  const p = settingsPage([{ status: 500, body: { error: 'speck/config.yml is not valid YAML.' } }]);
  const seen = paints(p);
  await openSettings(p);
  assert.equal(pane(p).hidden, false);
  assert.match(pane(p).textContent, /not valid YAML/);
  for (const s of seen) assert.doesNotMatch(s.text, LOADING_VIEW);
});

test('0409 AC2: Your agents and the role lists say they are loading in place, then fill in without closing or clearing edits', async () => {
  const later = deferred();
  const p = settingsPage([quick(), later]);
  await openSettings(p);
  assert.match(pane(p).textContent, /Loading your agents/);
  const options = key => p.all(controlOf(p, key)).filter(n => n.tagName === 'option').map(o => o.textContent).join(' ');
  assert.match(options('builder'), /Loading your agents' models/);
  changeTo(p, 'max_parallel_builds', '3');
  pane(p).scrollTop = 300;
  later.resolve(full());
  await p.settle();
  assert.equal(pane(p).hidden, false, 'still open');
  assert.doesNotMatch(pane(p).textContent, /Loading your agents/);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '3', 'the edit is kept');
  assert.equal(pane(p).scrollTop, 300, 'not scrolled');
});

test('0409 AC3: after a Save, the groups stay with the last lists while they are read again, and no full-view loading line returns', async () => {
  const again = deferred(), lists = deferred();
  const p = settingsPage([quick(), full(), again, lists], [{ ok: true }]);
  await openSettings(p);
  await p.settle();
  const seen = paints(p);
  changeTo(p, 'max_parallel_builds', '3');
  p.press(saveButton(p));
  await p.settle();
  assert.equal(pane(p).hidden, false);
  assert.ok(groupTitles(p).includes('Building and reviewing'), 'the groups stay while the settings are read again');
  assert.match(pane(p).textContent, /Claude Code/, 'with the lists read last time');
  again.resolve({ ...quick(), groups: quick().groups.map(g => ({ ...g, settings: g.settings.map(x => x.key === 'max_parallel_builds' ? { ...x, value: 3 } : x) })) });
  await p.settle();
  assert.match(pane(p).textContent, /Claude Code/, 'the last lists still show while they refresh');
  assert.doesNotMatch(pane(p).textContent, /Loading your agents/);
  lists.resolve(full());
  await p.settle();
  for (const s of seen) assert.doesNotMatch(s.text, LOADING_VIEW);
});

// 0666: each build level picks its builder and model from the Builder's own list, and its effort from theirs.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';
import { openSettings, rowOf } from './support/settings.mjs';
import { agentsPage, YOURS_VIEW } from './support/your-agents.mjs';
import { panelSettings, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { panelLevelRequest, setLevelsText } from '../scripts/levels-panel.mjs';
import { parseConfig } from '../scripts/core.mjs';
import { levelsOf } from '../scripts/levels.mjs';

Object.assign(process.env, gitEnv); // panelLevelRequest commits in this process

const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), default_model: 'sonnet' },
  { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', description: null, efforts: ['low', 'high'] }], default_model: 'gpt-6.1-sol' }];
const cfgText = dir => fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8');
// A project whose speck/config.yml gives `levels`, a block of YAML under levels: (none for null), committed.
function repoWith(levels) {
  const r = panelRepo(), file = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(file, setLevelsText(cfgText(r.dir), {}).replace(/\nlevels: \{\}\n/, levels === null ? '\n' : `\nlevels:\n${levels}\n`));
  r.g('commit', '-qam', 'levels');
  return r;
}
// The page for project `dir`, with your agents and their models and the Builder's settings in `saved`, Settings open.
async function opened(dir, { saved = {}, answers = {} } = {}) {
  const view = { ...panelSettings(dir), your_agents: YOURS_VIEW(), agent_models: structuredClone(AGENT_MODELS) };
  for (const g of view.groups) for (const s of g.settings) if (Object.hasOwn(saved, s.key)) s.value = saved[s.key];
  const p = agentsPage(view, { 'GET /api/usage': { agents: [] }, ...answers });
  await openSettings(p);
  return p;
}
const has = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const levelsBox = p => p.all(p.byId('settings')).find(n => has(n, 'levels'));
const rowNamed = (p, name) => p.all(levelsBox(p)).find(n => has(n, 'level') && n.attrs['data-level'] === name);
const adding = p => p.all(levelsBox(p)).find(n => has(n, 'adding'));
const controlIn = (p, label) => p.all(levelsBox(p)).find(n => (n.tagName === 'select' || n.tagName === 'input') && n.attrs['aria-label'] === label);
const options = (p, label) => p.all(controlIn(p, label)).filter(n => n.tagName === 'option').map(o => ({ value: o.value, label: o.textContent }));
function pick(p, label, value) {
  const c = controlIn(p, label);
  c.value = value;
  for (const type of ['input', 'change']) if (c.listeners[type]) c.listeners[type]({ target: c });
}
const ok = levels => ({ ok: true, said: 'Saved.', defaults: false, levels });

// ---------- AC1 ----------

test('0666 AC1: each level and the add form offer the Builder\'s own choices, in its words, after Default naming the Builder\'s now', async () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const p = await opened(r.dir, { saved: { builder: 'claude', builder_model: 'opus' } });
  const own = p.all(rowOf(p, 'builder')).find(n => n.tagName === 'select');
  const builders = p.all(own).filter(n => n.tagName === 'option' && !n.disabled).map(o => ({ value: o.value, label: o.textContent }));
  assert.ok(builders.some(b => b.label === 'Claude Code · Opus'), JSON.stringify(builders));
  for (const label of ['Quick level builder', 'New level builder']) {
    assert.deepEqual(options(p, label), [{ value: '', label: 'Default (Claude Code · Opus)' }, ...builders], label);
    assert.equal(controlIn(p, label).value, '', `${label}: Default while the level gives neither`);
  }
  assert.equal(p.all(levelsBox(p)).filter(n => n.tagName === 'input').length, 1, 'no box to type a model in: only the new level\'s name');
  assert.equal(p.all(levelsBox(p)).filter(n => n.tagName === 'datalist').length, 0);
});

test('0666 AC1: Default names the Builder\'s agent on its default model when the Builder leaves the model blank', async () => {
  const r = repoWith('  quick: {}');
  const p = await opened(r.dir, { saved: { builder: 'claude', builder_model: '' } });
  assert.deepEqual(options(p, 'Quick level builder')[0], { value: '', label: 'Default (Claude Code · Sonnet)' });
});

test('0666 AC1: picking a choice saves the level\'s builder and model together, and Default blanks both', async () => {
  const r = repoWith('  graphics:\n    builder: codex\n    builder_model: gpt-6.1-sol');
  const p = await opened(r.dir, { answers: {
    '/api/levels/graphics/set?builder=claude&builder_model=opus': ok([{ name: 'graphics', builder: 'claude', builder_model: 'opus', builder_effort: '' }]),
    '/api/levels/graphics/set?builder=&builder_model=': ok([{ name: 'graphics', builder: '', builder_model: '', builder_effort: '' }]) } });
  assert.equal(controlIn(p, 'Graphics level builder').value, 'codex|');
  pick(p, 'Graphics level builder', 'claude|opus');
  await p.settle();
  assert.equal(controlIn(p, 'Graphics level builder').value, 'claude|opus');
  pick(p, 'Graphics level builder', '');
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/levels/graphics/set?builder=claude&builder_model=opus', '/api/levels/graphics/set?builder=&builder_model=']);
  assert.equal(controlIn(p, 'Graphics level builder').value, '');
});

test('0666 AC1: a level whose builder and model aren\'t among the choices shows them as picked; a model with no builder is the Builder\'s agent\'s', async () => {
  const r = repoWith('  odd:\n    builder: codex\n    builder_model: gpt-old\n  bare:\n    builder_model: opus\n  stray:\n    builder: constructor');
  const p = await opened(r.dir, { saved: { builder: 'claude' } });
  const shown = label => options(p, label).find(o => o.value === controlIn(p, label).value);
  assert.deepEqual(shown('Odd level builder'), { value: 'codex|gpt-old', label: 'Codex · gpt-old' });
  assert.deepEqual(shown('Bare level builder'), { value: 'claude|opus', label: 'Claude Code · Opus' });
  assert.equal(shown('Stray level builder').value, 'constructor|', 'a built-in name is shown as it is');
  assert.match(shown('Stray level builder').label, /^constructor/);
});

// ---------- AC2 ----------

test('0666 AC2: each level\'s Effort has Default naming the Builder\'s effort, then the efforts its builder and model offer', async () => {
  const r = repoWith('  graphics:\n    builder: codex\n    builder_model: gpt-6.1-sol\n  quick:\n    builder_effort: low');
  const p = await opened(r.dir, { saved: { builder: 'claude', builder_effort: 'medium' } });
  assert.deepEqual(options(p, 'Graphics level effort'), [{ value: '', label: 'Default (medium)' }, { value: 'low', label: 'low' }, { value: 'high', label: 'high' }]);
  assert.equal(controlIn(p, 'Graphics level effort').value, '');
  assert.equal(controlIn(p, 'Quick level effort').value, 'low');
  const blank = await opened(r.dir, { saved: { builder: 'claude', builder_effort: '' } });
  assert.equal(options(blank, 'Quick level effort')[0].label, 'Default (the agent\'s own)');
  // The add form follows the choice picked there.
  pick(p, 'New level builder', 'codex|gpt-6.1-sol');
  assert.deepEqual(options(p, 'New level effort').map(o => o.value), ['', 'low', 'high']);
});

test('0666 AC2: Default blanks the level\'s effort', async () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const p = await opened(r.dir, { answers: { '/api/levels/quick/set?builder_effort=': ok([{ name: 'quick', builder: '', builder_model: '', builder_effort: '' }]) } });
  pick(p, 'Quick level effort', '');
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/levels/quick/set?builder_effort=']);
  assert.equal(controlIn(p, 'Quick level effort').value, '');
});

// ---------- AC3 ----------

test('0666 AC3: every list and box has a visible label, no line repeats a level\'s values, and settings and speck/config.yml aren\'t said', async () => {
  for (const levels of ['  quick:\n    builder: codex\n    builder_effort: low', null]) {
    const r = repoWith(levels);
    const p = await opened(r.dir);
    const box = levelsBox(p);
    for (const c of p.all(box).filter(n => n.tagName === 'select' || n.tagName === 'input')) {
      const label = p.all(box).find(n => n.tagName === 'label' && p.all(n).includes(c));
      assert.ok(label, `${c.attrs['aria-label']} is in a label`);
      const text = p.all(label).find(n => has(n, 'ltext'))?.textContent;
      assert.ok(['Builder', 'Effort', 'Name'].includes(text), `${c.attrs['aria-label']}: ${text}`);
    }
    assert.deepEqual(p.all(adding(p)).filter(n => has(n, 'ltext')).map(n => n.textContent), ['Name', 'Builder', 'Effort']);
    const words = p.all(box).filter(n => n.tagName !== 'option').map(n => n._text).join(' ');
    assert.doesNotMatch(words, /settings|speck\/config\.yml/i);
    assert.equal(p.all(box).filter(n => has(n, 'lsum')).length, 0, 'no line repeating its values');
  }
});

// ---------- AC4 ----------

test('0666 AC4: Remove is a small text button, and Add level comes after the add form\'s fields', async () => {
  const p = await opened(repoWith('  quick: {}').dir);
  const remove = p.all(rowNamed(p, 'quick')).find(n => n.tagName === 'button');
  assert.equal(remove.textContent, 'Remove');
  assert.ok(has(remove, 'ltextbtn') && !has(remove, 'save'), remove.className);
  const rule = styles().match(/#settings \.levels \.ltextbtn \{([^}]*)\}/)?.[1] ?? '';
  assert.match(rule, /font-size: 12px/);
  assert.match(rule, /border: 0/);
  assert.match(rule, /background: none/);
  const order = p.all(adding(p)).filter(n => ['select', 'input', 'button'].includes(n.tagName)).map(n => n.tagName);
  assert.deepEqual(order, ['input', 'select', 'select', 'button']);
});

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0666 AC4: at 375 px, Build levels has no sideways scroll, and each level\'s name, Builder and Effort fit the card', { skip, timeout: 60000 }, async () => {
  const r = repoWith('  a-rather-long-level-name-for-a-phone:\n    builder: codex\n    builder_model: gpt-6.1-sol\n  quick:\n    builder_effort: low');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.until(`document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`document.getElementById('settings-open').click(), true`);
    await b.until(`document.querySelectorAll('#settings .levels .level:not(.adding)').length === 2`, 'the levels');
    const d = await b.js(`(() => {
      const pane = document.getElementById('settings'), card = document.querySelector('#settings .member[data-member="builder"]').getBoundingClientRect();
      const fits = n => { const x = n.getBoundingClientRect(); return x.width > 0 && x.left >= card.left - 0.5 && x.right <= card.right + 0.5; };
      const levels = [...document.querySelectorAll('#settings .levels .level')].map(l => ({
        name: fits(l.querySelector('.name')), lists: [...l.querySelectorAll('select, input')].map(fits) }));
      const box = document.querySelector('#settings .levels');
      return { levels, sw: pane.scrollWidth, cw: pane.clientWidth, box: box.scrollWidth <= box.clientWidth, page: document.documentElement.scrollWidth <= innerWidth };
    })()`);
    assert.ok(d.sw <= d.cw && d.box && d.page, `no sideways scroll: ${JSON.stringify(d)}`);
    for (const l of d.levels) {
      assert.ok(l.name, JSON.stringify(d.levels));
      assert.ok(l.lists.length >= 2 && l.lists.every(Boolean), JSON.stringify(d.levels));
    }
  } finally { await b.close(); await stop(panel); }
});

// ---------- AC5 ----------

test('0666 AC5: a choice saves to speck/config.yml as 0661 did, Default leaves the level out, and refusals are as before', () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const ask = (name, action, q) => panelLevelRequest(r.dir, name, action, new URLSearchParams(q).toString());
  assert.equal(ask('quick', 'set', { builder: 'claude', builder_model: 'opus' }).status, 200);
  assert.deepEqual(levelsOf(parseConfig(cfgText(r.dir))).quick, { builder_effort: 'low', builder: 'claude', builder_model: 'opus' });
  assert.equal(ask('quick', 'set', { builder: '', builder_model: '' }).status, 200);
  assert.deepEqual(levelsOf(parseConfig(cfgText(r.dir))).quick, { builder_effort: 'low' });
  assert.equal(ask('graphics', 'add', { builder: 'claude', builder_model: 'opus' }).status, 200);
  assert.deepEqual(levelsOf(parseConfig(cfgText(r.dir))).graphics, { builder: 'claude', builder_model: 'opus' });
  const before = cfgText(r.dir);
  assert.equal(ask('quick', 'set', { builder: 'nobody', builder_model: 'x' }).status, 422);
  assert.equal(ask('quick', 'add', {}).status, 422);
  assert.equal(cfgText(r.dir), before);
});

test('0666 AC5: the add form sends its name with the choices picked, and empties again once added', async () => {
  const r = repoWith('  quick: {}');
  const p = await opened(r.dir, { answers: { '/api/levels/graphics/add?builder=codex&builder_model=gpt-6.1-sol&builder_effort=high':
    ok([{ name: 'quick', builder: '', builder_model: '', builder_effort: '' }, { name: 'graphics', builder: 'codex', builder_model: 'gpt-6.1-sol', builder_effort: 'high' }]) } });
  const name = controlIn(p, 'New level name');
  name.value = 'graphics';
  name.listeners.input({ target: name });
  pick(p, 'New level builder', 'codex|gpt-6.1-sol');
  pick(p, 'New level effort', 'high');
  p.all(adding(p)).find(n => n.tagName === 'button').listeners.click({});
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/levels/graphics/add?builder=codex&builder_model=gpt-6.1-sol&builder_effort=high']);
  assert.equal(controlIn(p, 'Graphics level builder').value, 'codex|');
  assert.equal(controlIn(p, 'New level name').value, '');
  assert.equal(controlIn(p, 'New level builder').value, '');
});

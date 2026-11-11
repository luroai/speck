import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, ROOT, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf } from './support/settings.mjs';
import { speck } from './support/cli.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { panelSettings, panelSaveRequest, SETTING_GROUPS } from '../scripts/settings.mjs';
import { parseConfig, speckNameOf } from '../scripts/core.mjs';

// ---------- 0575: let you name speck, your engineering manager ----------

Object.assign(process.env, gitEnv); // panelSaveRequest commits in this process
const TITLE = 'Your engineering manager';
const WATCH = ['watch', 'watch_agent', 'watch_model', 'watch_effort'];
const configOf = r => path.join(r.dir, 'speck', 'config.yml');
const read = r => fs.readFileSync(configOf(r), 'utf8');
const named = (r, name) => fs.appendFileSync(configOf(r), `speck_name: ${name}\n`);
const settingsOf = r => Object.fromEntries(panelSettings(r.dir, { providers: [] }).groups.flatMap(g => g.settings).map(s => [s.key, s]));
const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
const view = () => ({ groups: [
  { title: TITLE, settings: [S('speck_name', 'Virgil'), S('watch', 'tell', { choices: ['off', 'tell', 'fix'] })] },
  { title: 'Shipping', settings: [S('ship_mode', 'local', { choices: ['local', 'pr'] })] },
] });

test('0575 AC1: speck_name is speck by default, and takes the names a name can be', () => {
  assert.equal(speckNameOf({}), 'speck');
  for (const name of ['Virgil', 'a', 'Mary-Jane', "O'Brien", 'R2 D2', 'Zoë', 'x'.repeat(24)])
    assert.equal(checkConfigValue('speck_name', name), name, name);
});

test('0575 AC1: spaces at the end of a name are dropped, so it reads back clean, and a curly apostrophe counts', () => {
  assert.equal(checkConfigValue('speck_name', 'Virgil  '), 'Virgil');
  assert.equal(speckNameOf({ speck_name: 'Virgil ' }), 'Virgil');
  assert.equal(checkConfigValue('speck_name', 'O’Brien'), 'O’Brien');
});

test('0575 AC1: speck config set saves the name in speck/config.yml, and speck reads it back', () => {
  const r = panelRepo();
  for (const name of ['Virgil', "O'Brien", 'true', 'Mary-Jane the 2nd']) {
    const out = speck(r.dir, process.env, 'config', 'set', 'speck_name', name);
    assert.equal(out.status, 0, out.stderr);
    assert.equal(parseConfig(read(r)).speck_name, name, name);
    assert.equal(speckNameOf(parseConfig(read(r))), name, name);
  }
});

test('0575 AC1: anything else is refused, saying what is allowed and changing nothing', () => {
  const r = panelRepo(), before = read(r);
  for (const bad of ['', ' ', ' Virgil', '1Virgil', '-Virgil', "'Virgil", 'x'.repeat(25), 'Vir$gil', 'a:b', 'a#b', 'a\nb', 'a"b', 'a_b', 'a/b', '__proto__', 'constructor!']) {
    assert.throws(() => checkConfigValue('speck_name', bad), /1 to 24 .*letters.*digits.*spaces.*hyphens.*apostrophes.*starting with a letter/, JSON.stringify(bad));
    if (bad === '' || bad === '\n') continue;
    const out = speck(r.dir, process.env, 'config', 'set', 'speck_name', bad);
    assert.notEqual(out.status, 0, bad);
    assert.match(out.stderr + out.stdout, /starting with a letter/, bad);
    assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.equal(read(r), before);
});

test('0575 AC2: the group is the first of Settings, headed Your engineering manager, with speck_name first, editable', () => {
  assert.equal(SETTING_GROUPS[0].title, TITLE);
  assert.deepEqual(SETTING_GROUPS[0].settings.map(s => s.key), ['speck_name', ...WATCH]);
  assert.ok(!SETTING_GROUPS.some(g => g.title === 'Watching'));
  const s = settingsOf(panelRepo()).speck_name;
  assert.equal(s.value, 'speck');
  assert.equal(s.editable, true);
  assert.equal(s.choices, undefined, 'typed in');
  assert.equal(s.for_machine, undefined, 'a project setting');
  assert.match(s.explain, /When it isn't set, speck uses speck as its name\./);
});

test('0575 AC2: the panel saves speck_name in speck/config.yml, and refuses a bad one beside it, changing nothing', () => {
  const r = panelRepo();
  const saved = panelSaveRequest(r.dir, `repo%3Aspeck_name=${encodeURIComponent("Virgil O'Brien")}`);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(parseConfig(read(r)).speck_name, "Virgil O'Brien");
  assert.equal(settingsOf(r).speck_name.value, "Virgil O'Brien");
  const before = read(r);
  for (const bad of ['', '9lives']) {
    const refused = panelSaveRequest(r.dir, `repo%3Aspeck_name=${encodeURIComponent(bad)}`);
    assert.notEqual(refused.status, 200, bad);
    assert.match(refused.body.refused.speck_name, /starting with a letter/, bad);
    assert.equal(read(r), before);
  }
});

test('0575 AC2: the page heads the group Your engineering manager, under the switch, with speck_name as a box you can type in', async () => {
  const p = settingsPage([view()]);
  await p.settle();
  await openSettings(p);
  const settings = p.byId('settings');
  const titles = p.all(settings).filter(n => n.tagName === 'h4').map(n => n.textContent);
  assert.ok(!titles.includes('Watching'), titles.join(', '));
  // 0652: its card in Your team, first in the view, named as you named it, its job saying what it is
  assert.ok(titles[0] === 'Your team' && titles.includes('Shipping'), titles.join(', '));
  const group = p.all(settings).find(n => /\bmember\b/.test(n.className || '') && n.attrs['data-member'] === 'manager');
  assert.match(p.all(group).find(n => /\bjob\b/.test(n.className || '')).textContent, new RegExp(`^${TITLE}: `));
  assert.ok(p.all(group).includes(rowOf(p, 'speck_name')), 'in the group');
  assert.equal(p.all(rowOf(p, 'speck_name')).find(n => n.tagName === 'input').value, 'Virgil');
});

test('0575 AC3: the watch settings\' explanations call the engineering manager by its name', () => {
  const r = panelRepo();
  named(r, 'Virgil');
  const s = settingsOf(r);
  assert.match(s.watch.explain, /^What Virgil does when a build stops with a question/);
  assert.match(s.watch.explain, /When it isn't set, Virgil uses tell\./);
  assert.match(s.watch_agent.explain, /^The agent Virgil runs on/);
  assert.match(s.watch_model.explain, /^The model Virgil's agent runs on/);
  assert.match(s.watch_effort.explain, /^How hard Virgil's agent thinks/);
  for (const key of WATCH) assert.doesNotMatch(s[key].explain.replaceAll('speck/config.yml', ''), /\bspeck\b/, key);
});

test('0575 AC3: and speck when it is unset, or when the file holds something that is no name', () => {
  for (const line of [null, '""', '"9lives"', '42', 'true']) {
    const r = panelRepo();
    if (line !== null) named(r, line);
    const s = settingsOf(r);
    assert.match(s.watch.explain, /^What speck does when a build stops with a question/, String(line));
    assert.match(s.watch_model.explain, /^The model speck's agent runs on/, String(line));
  }
  assert.equal(speckNameOf({ speck_name: { toString: () => 'x' } }), 'speck');
  assert.equal(speckNameOf(null), 'speck');
});

test('0575 AC3: a setting outside the group keeps calling speck speck', () => {
  const r = panelRepo();
  named(r, 'Virgil');
  const s = settingsOf(r);
  assert.match(s['limits.max_review_rounds'].explain, /speck uses 3\./);
  assert.doesNotMatch(s.ship_mode.explain, /Virgil/);
  assert.doesNotMatch(s.speck_name.explain, /Virgil/);
});

test('0575 AC3: speck config show gives the same names', () => {
  const r = panelRepo();
  named(r, 'Virgil');
  const out = speck(r.dir, process.env, 'config', 'show', '--json');
  assert.equal(out.status, 0, out.stderr);
  const all = JSON.parse(out.stdout).groups.flatMap(g => g.settings);
  assert.match(all.find(s => s.key === 'watch').explain, /^What Virgil does when a build stops with a question/);
  assert.equal(all.find(s => s.key === 'speck_name').value, 'Virgil');
});

test('0575 AC4: docs/brief.md has a section on the engineering manager naming speck_name and the watch settings', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const at = brief.search(/^##+ .*engineering manager/im);
  assert.notEqual(at, -1, 'a heading for it');
  const rest = brief.slice(at + 3), end = rest.search(/^## /m), section = end === -1 ? rest : rest.slice(0, end);
  for (const name of ['speck_name', 'watch', 'watch_agent', 'watch_model', 'watch_effort']) assert.ok(section.includes(`\`${name}\``), name);
  assert.doesNotMatch(brief, /\bWatching group\b|group, Watching\b/, 'the old group name is gone');
});

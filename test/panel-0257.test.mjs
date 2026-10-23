import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fakePage, deferred, page, panelRepo, freePort, startPanel, stop, request, post, tokenOf } from './support/panel.mjs';
import { panelSettings, SETTING_GROUPS, explainFully } from '../scripts/settings.mjs';

// ---------- 0257: show speck's settings, explained, in the panel ----------

const GROUPS = [
  ['Foreman', ['foreman_fixing', 'foreman', 'foreman_model', 'foreman_effort']], // 0286, 0287
  ['Shipping', ['auto_ship', 'auto_ship_risk', 'ship_mode']], // 0295 added ship_mode
  ['Building and reviewing', ['builder', 'builder_model', 'builder_effort', 'reviewer', // 0402 added builder_effort
    'reviewer_model', 'reviewer_effort', 'allow_same_model_review', // 0406 folded in the parallel and size-limit settings
    'max_parallel_builds', 'max_parallel_tests', 'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds']],
];
const repoWith = config => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0257-'));
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), config);
  return dir;
};
const byKey = view => Object.fromEntries(view.groups.flatMap(g => g.settings).map(s => [s.key, s]));
const state = () => ({ tickets: [], ideas: [], resume_command: '' });

// A page whose fetch answers the board with an empty one and /api/settings with each of `answers` in turn.
function settingsPage(answers) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), method: (opts.method || 'GET').toUpperCase() });
    const body = String(url).startsWith('/api/settings') ? answers.shift() : state();
    if (body && body.status) return { ok: false, status: body.status, json: async () => body.body };
    return { ok: true, status: 200, json: async () => body };
  };
  const p = fakePage([], { fetch });
  p.settingsCalls = calls;
  return p;
}
const view = (pairs = {}) => ({ groups: GROUPS.map(([title, keys]) => ({ title, settings: keys.map(key => ({ key, value: pairs[key] ?? false, default: !(key in pairs), explain: `What ${key} does.` })) })) });
const open = async p => { p.press(p.byId('settings-open')); await p.settle(); };
const pane = p => p.byId('settings');

test('0257 AC1: the header has a Settings button, which opens the Settings view', async () => {
  const header = page().match(/<header>([\s\S]*?)<\/header>/)[1];
  assert.match(header, /<button[^>]*id="settings-open"[^>]*type="button"/);
  assert.match(header, /id="settings-open"[^>]*aria-label="Settings"|aria-label="Settings"[^>]*id="settings-open"/);
  const p = settingsPage([view()]);
  await p.settle();
  assert.equal(pane(p).hidden, true, 'closed at first');
  await open(p);
  assert.equal(pane(p).hidden, false, 'open once pressed');
  assert.match(pane(p).textContent, /Settings/);
});

test('0257 AC1: the close button and Escape each close it, and focus goes back to the Settings button', async () => {
  for (const how of ['button', 'Escape']) {
    const p = settingsPage([view()]);
    await p.settle();
    let focused = null;
    p.byId('settings-open').focus = () => { focused = 'settings-open'; };
    await open(p);
    if (how === 'button') {
      const close = p.all(pane(p)).find(n => n.tagName === 'button' && /\bclose\b/.test(n.className));
      assert.ok(close, 'the view has a close button');
      p.press(close);
    } else p.key('Escape');
    await p.settle();
    assert.equal(pane(p).hidden, true, `${how} closes it`);
    assert.equal(focused, 'settings-open', `${how}: focus is back on the Settings button`);
  }
});

test('0257 AC2: speck reads the four groups in order, with each setting\'s name and value, and "default" for one missing from the file', () => {
  const dir = repoWith('auto_ship: true\nauto_ship_risk: [low, high]\nreviewer: claude-subagent\nreviewer_model: ""\nmax_parallel_builds: 4\nlimits:\n  max_review_rounds: 5\n');
  const v = panelSettings(dir);
  assert.deepEqual(v.groups.map(g => [g.title, g.settings.map(s => s.key)]), GROUPS);
  const s = byKey(v);
  assert.deepEqual([s.auto_ship.value, s.auto_ship.default], [true, false]);
  assert.deepEqual([s.auto_ship_risk.value, s.auto_ship_risk.default], [['low', 'high'], false]);
  assert.deepEqual([s.reviewer.value, s.reviewer.default], ['claude-subagent', false]);
  assert.deepEqual([s.reviewer_model.value, s.reviewer_model.default], ['', false], 'a blank value in the file is the file\'s');
  assert.deepEqual([s.max_parallel_builds.value, s.max_parallel_builds.default], [4, false]);
  assert.deepEqual([s['limits.max_review_rounds'].value, s['limits.max_review_rounds'].default], [5, false]);
  // Missing from the file: speck's own defaults.
  assert.deepEqual([s.builder.value, s.builder.default], ['claude', true]);
  assert.deepEqual([s.reviewer_effort.value, s.reviewer_effort.default], ['', true]);
  assert.deepEqual([s.allow_same_model_review.value, s.allow_same_model_review.default], [false, true]);
  assert.deepEqual([s.max_parallel_tests.value, s.max_parallel_tests.default], [1, true]);
  assert.deepEqual([s['limits.max_acceptance_criteria'].value, s['limits.max_acceptance_criteria'].default], [5, true]);
  assert.deepEqual([s['limits.max_changed_lines'].value, s['limits.max_changed_lines'].default], [300, true]);
});

test('0257 AC2: an empty file shows every setting as its default, and a key named like a built-in isn\'t mistaken for one', () => {
  const s = byKey(panelSettings(repoWith('constructor: 1\n__proto__: 2\nlimits:\n  toString: 3\n')));
  for (const k of Object.keys(s)) assert.equal(s[k].default, true, `${k} is the default`);
  assert.deepEqual(s.auto_ship_risk.value, ['low']);
  assert.equal(s.auto_ship.value, false);
});

test('0257 AC2: the view shows each group in order, each setting\'s name and value, and "default" only beside defaults', async () => {
  const p = settingsPage([view({ auto_ship: true, auto_ship_risk: ['low', 'high'], reviewer_model: '', max_parallel_builds: 4 })]);
  await p.settle();
  await open(p);
  const text = pane(p).textContent;
  const at = GROUPS.map(([title]) => text.indexOf(title));
  assert.ok(at.every(i => i >= 0), `every group is shown: ${text}`);
  assert.deepEqual([...at].sort((a, b) => a - b), at, 'in order');
  const rows = p.all(pane(p)).filter(n => /\bsetting\b/.test(n.className || ''));
  assert.deepEqual(rows.map(r => p.all(r).find(n => /\bname\b/.test(n.className || '')).textContent), GROUPS.flatMap(([, keys]) => keys));
  const row = key => rows.find(r => r.textContent.includes(key) && p.all(r).find(n => /\bname\b/.test(n.className || '')).textContent === key);
  const valueOf = key => p.all(row(key)).find(n => /\bvalue\b/.test(n.className || '')).textContent;
  assert.equal(valueOf('auto_ship'), 'true');
  assert.equal(valueOf('auto_ship_risk'), '[low, high]');
  assert.equal(valueOf('reviewer_model'), '""');
  assert.equal(valueOf('max_parallel_builds'), '4');
  assert.equal(valueOf('builder'), 'false');
  // 0397: no row is marked "default"; its explanation says what speck uses when it isn't set.
  const flagged = key => p.all(row(key)).some(n => /\bdefault\b/.test(n.className || '') && n.textContent === 'default');
  for (const key of ['builder', 'auto_ship', 'reviewer_model']) assert.equal(flagged(key), false, key);
});

test('0257 AC3: each setting has an explanation of one or two sentences, and the shipping ones say a ticket they cover is merged and pushed without waiting for you', () => {
  const all = SETTING_GROUPS.flatMap(g => g.settings);
  assert.equal(all.length, 19); // 0279 added builder_model, 0286 foreman_fixing, 0287 foreman, foreman_model and foreman_effort, 0295 ship_mode, 0402 builder_effort
  for (const s of all) {
    assert.equal(typeof s.explain, 'string');
    const sentences = s.explain.trim().split(/(?<=[.!?])\s+(?=[A-Z])/);
    assert.ok(sentences.length >= 1 && sentences.length <= 2, `${s.key}: one or two sentences: ${s.explain}`);
    assert.match(s.explain, /\.$/, `${s.key} ends in a full stop`);
  }
  for (const k of ['auto_ship', 'auto_ship_risk']) assert.match(all.find(s => s.key === k).explain, /merged and pushed to the base branch without waiting for you/, k);
  // And the view shows them, from the server's answer.
  const s = byKey(panelSettings(repoWith('')));
  for (const x of all) assert.equal(s[x.key].explain, explainFully(x)); // 0397: with where a change is saved
});

test('0257 AC3: the view shows each setting\'s explanation', async () => {
  const p = settingsPage([view()]);
  await p.settle();
  await open(p);
  const text = pane(p).textContent;
  for (const [, keys] of GROUPS) for (const k of keys) assert.ok(text.includes(`What ${k} does.`), k);
});

test('0257 AC4: after speck/config.yml changes, opening the view again shows the new values, without reloading', async () => {
  const dir = repoWith('max_parallel_builds: 2\n');
  assert.equal(byKey(panelSettings(dir)).max_parallel_builds.value, 2);
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'max_parallel_builds: 3\n');
  assert.equal(byKey(panelSettings(dir)).max_parallel_builds.value, 3, 'read afresh each time');

  const p = settingsPage([view({ max_parallel_builds: 2 }), view({ max_parallel_builds: 3 })]);
  await p.settle();
  await open(p);
  assert.match(pane(p).textContent, /max_parallel_builds2/);
  p.key('Escape');
  await p.settle();
  await open(p);
  assert.match(pane(p).textContent, /max_parallel_builds3/, 'the new value, from a new request');
  assert.equal(p.settingsCalls.filter(c => c.url.startsWith('/api/settings')).length, 2);
});

test('0257 AC4: a failed request says why in the view, and opening it again tries again', async () => {
  const p = settingsPage([{ status: 500, body: { error: "Couldn't read speck/config.yml: gone" } }, view({ max_parallel_builds: 3 })]);
  await p.settle();
  await open(p);
  assert.match(pane(p).textContent, /Couldn't read speck\/config.yml: gone/);
  p.key('Escape');
  await p.settle();
  await open(p);
  assert.match(pane(p).textContent, /max_parallel_builds3/);
});

test('0257 AC5: the view has no control that changes a setting, and opening and closing it sends only GETs', async () => {
  const p = settingsPage([view({ auto_ship: true })]);
  await p.settle();
  await open(p);
  // 0268: and each setting's info button, which only shows its explanation
  // 0285: and the speck run switch in the Foreman group, which turns speck run on or off rather than change a setting
  // 0372: and the list of looks, kept in this browser rather than in speck/config.yml
  const controls = p.all(pane(p)).filter(n => ['button', 'input', 'select', 'textarea', 'form'].includes(n.tagName) && n.className !== 'info' && !/\brun-switch\b/.test(n.className) && n.id !== 'look');
  assert.deepEqual(controls.map(n => n.className), ['close'], 'only the close button');
  p.press(controls[0]);
  await p.settle();
  assert.ok(p.settingsCalls.length > 0);
  assert.deepEqual([...new Set(p.settingsCalls.map(c => c.method))], ['GET']);
});

test('0257 AC4-AC5: the panel serves the settings afresh on a GET, and refuses anything else', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const first = JSON.parse((await request(p.port, { pathName: '/api/settings' })).body);
    assert.equal(byKey(first).max_parallel_builds.value, 1);
    const cfg = path.join(r.dir, 'speck', 'config.yml');
    fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^max_parallel_builds:.*$/m, 'max_parallel_builds: 3'));
    const second = JSON.parse((await request(p.port, { pathName: '/api/settings' })).body);
    assert.deepEqual([byKey(second).max_parallel_builds.value, byKey(second).max_parallel_builds.default], [3, false]);
    const token = tokenOf((await request(p.port)).body);
    assert.equal((await post(p.port, '/api/settings', { token })).status, 405);
  } finally { await stop(p); }
});

// 0409: the view opens once its answer has come back, so there's no view to close while it's read: a second press
// waits for the same answer, and the answer is the one drawn, with no loading line before it.
test('0257 self-check: a press while the view is opening reads the settings once, and an odd value still reads plainly', async () => {
  const slow = deferred();
  const p = settingsPage([slow, view({ max_parallel_builds: 9 })]);
  await p.settle();
  await open(p);
  assert.equal(pane(p).hidden, true, 'not open until the settings have come back');
  p.key('Escape');
  await p.settle();
  await open(p);
  slow.resolve(view({ auto_ship: { on: true } }));
  await p.settle();
  assert.equal(pane(p).hidden, false);
  assert.doesNotMatch(pane(p).textContent, /Loading the settings|max_parallel_builds9/, 'one read, drawn as it came');
  assert.match(pane(p).textContent, /auto_ship\{"on":true\}/);
  assert.equal(p.settingsCalls.filter(c => c.url.startsWith('/api/settings')).length, 1);
});

import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakePage, panelRepo, freePort, startPanel, stop, request, post, tokenOf, headOf, gitEnv } from './support/panel.mjs';
import { panelSettings, panelSetSetting, EDITABLE } from '../scripts/settings.mjs';

// ---------- 0258: change a setting from the panel ----------

Object.assign(process.env, gitEnv); // panelSetSetting commits in this process

const KEYS = ['reviewer', 'reviewer_model', 'reviewer_effort', 'max_parallel_builds', 'max_parallel_tests',
  'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds'];
const GROUPS = [
  ['Shipping', ['auto_ship', 'auto_ship_risk']],
  ['Building and reviewing', ['builder', 'reviewer', 'reviewer_model', 'reviewer_effort', 'allow_same_model_review']],
  ['How much runs at once', ['max_parallel_builds', 'max_parallel_tests']],
  ['Ticket size limits', ['limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds']],
];
const byKey = v => Object.fromEntries(v.groups.flatMap(g => g.settings).map(s => [s.key, s]));
const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const readCfg = r => fs.readFileSync(cfgOf(r), 'utf8');
// What a refusal must leave as it was: the file, HEAD and what git says has changed.
const snapshot = r => ({ text: readCfg(r), head: headOf(r), status: r.g('status', '--porcelain') });

test('0258 AC1: the eight settings can be changed, with reviewer and reviewer_effort offering only what speck accepts, and the rest stay read-only', () => {
  assert.deepEqual([...EDITABLE], KEYS);
  const r = panelRepo();
  fs.writeFileSync(cfgOf(r), readCfg(r).replace(/^reviewer_options:\n/m, 'reviewer_options:\n  my-reviewer:\n    command: "x {prompt}"\n'));
  const s = byKey(panelSettings(r.dir));
  for (const [, keys] of GROUPS) for (const k of keys) assert.equal(s[k].editable, KEYS.includes(k), k);
  assert.deepEqual(s.reviewer_effort.choices, ['', 'low', 'medium', 'high', 'xhigh', 'max']);
  assert.deepEqual([...s.reviewer.choices].sort(), ['claude-subagent', 'codex', 'my-reviewer']);
  assert.equal(s.reviewer_model.choices, undefined, 'a free value');
  assert.equal(s.auto_ship.choices, undefined);
});

// A page whose fetch answers the board with an empty one, GET /api/settings with each of `views` in turn and a POST
// with each of `saves` in turn.
function settingsPage(views, saves = []) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: String(url), method, headers: opts.headers || {} });
    const body = method === 'POST' ? saves.shift() : String(url).startsWith('/api/settings') ? views.shift() : { tickets: [], ideas: [], resume_command: '' };
    if (body && body.status) return { ok: false, status: body.status, json: async () => body.body };
    return { ok: true, status: 200, json: async () => body };
  };
  const p = fakePage([], { fetch });
  p.settingsCalls = calls;
  return p;
}
const CHOICES = { reviewer: ['codex', 'claude-subagent'], reviewer_effort: ['', 'low', 'medium', 'high', 'xhigh', 'max'] };
const view = (pairs = {}) => ({ groups: GROUPS.map(([title, keys]) => ({ title, settings: keys.map(key => ({
  key, value: pairs[key] ?? (key.startsWith('max') || key.startsWith('limits') ? 1 : ''), default: false, explain: `What ${key} does.`,
  editable: KEYS.includes(key), ...(CHOICES[key] ? { choices: CHOICES[key] } : {}) })) })) });
const open = async p => { p.press(p.byId('settings-open')); await p.settle(); };
const rowOf = (p, key) => p.all(p.byId('settings')).filter(n => /\bsetting\b/.test(n.className || ''))
  .find(r => p.all(r).find(n => /\bname\b/.test(n.className || ''))?.textContent === key);
const controlOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'select' || n.tagName === 'input');
const saveOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && /\bsave\b/.test(n.className));

test('0258 AC1: in the view, each of the eight has a control and a Save button, the pickers offer only their choices, and the rest have none', async () => {
  const p = settingsPage([view({ reviewer: 'codex', reviewer_effort: 'high', reviewer_model: 'gpt-x' })]);
  await p.settle();
  await open(p);
  for (const [, keys] of GROUPS) for (const k of keys) {
    assert.equal(!!controlOf(p, k), KEYS.includes(k), `${k} control`);
    assert.equal(!!saveOf(p, k), KEYS.includes(k), `${k} Save`);
  }
  const options = k => p.all(controlOf(p, k)).filter(n => n.tagName === 'option').map(n => n.value);
  assert.equal(controlOf(p, 'reviewer').tagName, 'select');
  assert.deepEqual(options('reviewer'), ['codex', 'claude-subagent']);
  assert.equal(controlOf(p, 'reviewer').value, 'codex');
  assert.equal(controlOf(p, 'reviewer_effort').tagName, 'select');
  assert.deepEqual(options('reviewer_effort'), ['', 'low', 'medium', 'high', 'xhigh', 'max']);
  assert.equal(controlOf(p, 'reviewer_effort').value, 'high');
  assert.equal(controlOf(p, 'reviewer_model').value, 'gpt-x');
  assert.equal(controlOf(p, 'max_parallel_builds').value, '1');
  // Read-only ones still show their value.
  assert.ok(p.all(rowOf(p, 'builder')).some(n => /\bvalue\b/.test(n.className || '')));
});

test('0258 AC2: saving rewrites only that setting\'s line, keeping its comment, and commits only speck/config.yml on the base branch', () => {
  const r = panelRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'not mine\n'); // another session's file, left alone
  const before = readCfg(r).split('\n'), head = headOf(r);
  const out = panelSetSetting(r.dir, 'max_parallel_builds', '2');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const after = readCfg(r).split('\n');
  assert.equal(after.length, before.length);
  const changed = after.map((l, i) => l !== before[i] ? i : -1).filter(i => i >= 0);
  assert.equal(changed.length, 1, 'one line changed');
  assert.match(after[changed[0]], /^max_parallel_builds: 2\s+# how many builds speck run keeps going at once$/);
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config max_parallel_builds 2');
  assert.equal(r.g('rev-parse', 'HEAD~1'), head);
  assert.equal(r.g('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), 'speck/config.yml');
  assert.equal(r.g('status', '--porcelain'), '?? other.txt');
  assert.equal(byKey(panelSettings(r.dir)).max_parallel_builds.value, 2, 'and speck reads the new value');

  // A nested one, and a blank and a picked value.
  assert.equal(panelSetSetting(r.dir, 'limits.max_review_rounds', '5').status, 200);
  assert.match(readCfg(r), /^limits:\n(?: {2}.*\n)*? {2}max_review_rounds: 5\n/m);
  assert.equal(panelSetSetting(r.dir, 'reviewer_effort', 'high').status, 200);
  assert.equal(panelSetSetting(r.dir, 'reviewer_effort', '').status, 200);
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config reviewer_effort ""');
  assert.equal(byKey(panelSettings(r.dir)).reviewer_effort.value, '');
  assert.equal(panelSetSetting(r.dir, 'reviewer_model', 'gpt-6.1-sol').status, 200);
  assert.equal(byKey(panelSettings(r.dir)).reviewer_model.value, 'gpt-6.1-sol');
  assert.equal(r.g('status', '--porcelain'), '?? other.txt');
});

test('0258 AC2: saving the value a setting already has writes and commits nothing', () => {
  const r = panelRepo();
  const was = snapshot(r);
  for (const [k, v] of [['max_parallel_builds', '1'], ['reviewer', 'codex'], ['reviewer_effort', ''], ['limits.max_review_rounds', '3']]) {
    const out = panelSetSetting(r.dir, k, v);
    assert.equal(out.status, 200, `${k}: ${JSON.stringify(out.body)}`);
    assert.equal(out.body.changed, false, k);
  }
  assert.deepEqual(snapshot(r), was);
});

test('0258 AC2: Save sends the change with the token, then the view shows the new value', async () => {
  const p = settingsPage([view({ max_parallel_builds: 1 }), view({ max_parallel_builds: 2 })], [{ ok: true, changed: true }]);
  await p.settle();
  await open(p);
  controlOf(p, 'max_parallel_builds').value = '2';
  p.press(saveOf(p, 'max_parallel_builds'));
  await p.settle();
  const sent = p.settingsCalls.filter(c => c.method === 'POST');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, '/api/settings/max_parallel_builds/2');
  assert.ok(sent[0].headers['X-Speck-Token'], 'with the token');
  assert.equal(controlOf(p, 'max_parallel_builds').value, '2', 'the new value, read afresh');
  assert.equal(p.settingsCalls.filter(c => c.method === 'GET' && c.url.startsWith('/api/settings')).length, 2);

  // A blank and a value with a slash go whole.
  const q = settingsPage([view({ reviewer_effort: 'high' }), view(), view()], [{ ok: true }, { ok: true }]);
  await q.settle();
  await open(q);
  controlOf(q, 'reviewer_effort').value = '';
  q.press(saveOf(q, 'reviewer_effort'));
  await q.settle();
  controlOf(q, 'reviewer_model').value = 'openai/gpt x';
  q.press(saveOf(q, 'reviewer_model'));
  await q.settle();
  assert.deepEqual(q.settingsCalls.filter(c => c.method === 'POST').map(c => c.url),
    ['/api/settings/reviewer_effort/', '/api/settings/reviewer_model/openai%2Fgpt%20x']);
});

test('0258 AC3: a value speck wouldn\'t accept is refused, saying what\'s allowed, and changes nothing', () => {
  const r = panelRepo();
  const was = snapshot(r);
  const refused = (k, v, re) => {
    const out = panelSetSetting(r.dir, k, v);
    assert.equal(out.status, 422, `${k}=${v}: ${JSON.stringify(out.body)}`);
    assert.match(out.body.error, re, `${k}=${v}`);
  };
  refused('max_parallel_builds', '0', /whole number of 1 or more/);
  refused('limits.max_changed_lines', 'lots', /whole number of 1 or more/);
  refused('reviewer_effort', 'huge', /blank or one of low, medium, high, xhigh, max/);
  refused('reviewer', 'claude-subagent', /same.*allow_same_model_review/);
  refused('reviewer', 'nobody', /codex, claude-subagent/);
  refused('reviewer', '', /codex, claude-subagent/);
  refused('reviewer_model', 'a\nb', /one line/);
  assert.deepEqual(snapshot(r), was);
});

test('0258 AC3: the view shows a refusal beside the setting, keeping what was typed', async () => {
  const p = settingsPage([view()], [{ status: 422, body: { error: 'max_parallel_builds must be a whole number of 1 or more (got "0").' } }]);
  await p.settle();
  await open(p);
  controlOf(p, 'max_parallel_builds').value = '0';
  p.press(saveOf(p, 'max_parallel_builds'));
  await p.settle();
  assert.match(rowOf(p, 'max_parallel_builds').textContent, /must be a whole number of 1 or more/);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '0');
  assert.doesNotMatch(rowOf(p, 'max_parallel_tests').textContent, /whole number/);
});

test('0258 AC4: a change is refused off the base branch, or while speck/config.yml has uncommitted changes, and changes nothing', () => {
  const r = panelRepo();
  r.g('checkout', '-q', '-b', 'elsewhere');
  let was = snapshot(r);
  let out = panelSetSetting(r.dir, 'max_parallel_builds', '2');
  assert.equal(out.status, 409);
  assert.match(out.body.error, /"elsewhere", not main/);
  assert.deepEqual(snapshot(r), was);
  r.g('checkout', '-q', 'main');

  fs.appendFileSync(cfgOf(r), '# a note of mine\n');
  was = snapshot(r);
  out = panelSetSetting(r.dir, 'max_parallel_builds', '2');
  assert.equal(out.status, 409);
  assert.match(out.body.error, /uncommitted changes/);
  assert.deepEqual(snapshot(r), was);

  // Staged counts too.
  r.g('add', 'speck/config.yml');
  was = snapshot(r);
  assert.equal(panelSetSetting(r.dir, 'max_parallel_builds', '2').status, 409);
  assert.deepEqual(snapshot(r), was);
});

test('0258 AC5: without the token or from another origin it gets 403, a setting not in the list is refused, and nothing changes', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    const was = snapshot(r);
    assert.equal((await post(p.port, '/api/settings/max_parallel_builds/2')).status, 403);
    assert.equal((await post(p.port, '/api/settings/max_parallel_builds/2', { token: 'nope' })).status, 403);
    assert.equal((await post(p.port, '/api/settings/max_parallel_builds/2', { token, origin: 'http://evil.example' })).status, 403);
    assert.equal((await post(p.port, '/api/settings/max_parallel_builds/2', { token, origin: null })).status, 403);
    for (const [k, v] of [['build_command', 'rm%20-rf'], ['auto_ship', 'true'], ['allow_same_model_review', 'true'], ['builder', 'codex'], ['__proto__', 'x']]) {
      const out = await post(p.port, `/api/settings/${k}/${v}`, { token });
      assert.equal(out.status, 403, k);
      assert.match(JSON.parse(out.body).error, /can't be changed from the panel/, k);
    }
    // Self-check: a value that isn't written properly in the address is refused plainly.
    const bad = await post(p.port, '/api/settings/max_parallel_builds/%E0%A4%A', { token });
    assert.equal(bad.status, 400);
    assert.match(JSON.parse(bad.body).error, /isn't written properly/);
    assert.deepEqual(snapshot(r), was);
    // And with both, it does change.
    const ok = await post(p.port, '/api/settings/max_parallel_builds/2', { token });
    assert.equal(ok.status, 200, ok.body);
    assert.match(readCfg(r), /^max_parallel_builds: 2 /m);
  } finally { await stop(p); }
});

test('0258 self-check: the brief\'s panel entry names each setting the panel can change', () => {
  const line = fs.readFileSync(path.join(import.meta.dirname, '..', 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck panel'));
  for (const k of KEYS) assert.ok(line.includes(`\`${k}\``), k);
});

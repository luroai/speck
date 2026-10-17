import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { lintTicket } from '../scripts/speck.mjs';
import { panelSettings, panelSetSetting, panelSaveSettings } from '../scripts/settings.mjs';
import { cfg, ticket, good, fm } from './support/speck.mjs';
import { panelRepo, gitEnv } from './support/panel.mjs';

// ---------- 0280: a same-family reviewer is allowed when it runs a different model ----------

Object.assign(process.env, gitEnv); // panelSetSetting commits in this process

const subagent = (o = {}) => ticket(fm({ reviewer: 'claude-subagent', ...o }), good);
const errorsOf = (t, c = {}) => lintTicket(t, { ...cfg, builder: 'claude', ...c }).errors;

// A panel repo whose config has these values, committed, and whose ticket 0001 has these fields, left as a draft.
function repoWith(config = {}, fields = {}) {
  const r = panelRepo();
  const file = path.join(r.dir, 'speck', 'config.yml');
  let text = fs.readFileSync(file, 'utf8');
  for (const [k, v] of Object.entries(config)) text = text.replace(new RegExp(`^${k}:.*$`, 'm'), `${k}: ${v}`);
  fs.writeFileSync(file, text);
  let t = fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: draft');
  for (const [k, v] of Object.entries(fields)) t = t.replace(new RegExp(`^${k}:.*$`, 'm'), `${k}: ${v}`);
  fs.writeFileSync(r.file, t);
  r.g('commit', '-qam', 'setup');
  return r;
}
const setReady = r => r.run('set', '1', 'status', 'ready');

test('0280 AC1: lint accepts a same-family reviewer when builder_model and the reviewer model differ', () => {
  assert.deepEqual(errorsOf(subagent({ reviewer_model: 'fable' }), { builder_model: 'opus' }), [], 'ticket reviewer_model');
  assert.deepEqual(errorsOf(subagent(), { builder_model: 'opus', reviewer_model: 'fable' }), [], 'config reviewer_model');
  assert.deepEqual(errorsOf(subagent({ reviewer_model: 'sonnet' }), { builder_model: 'opus', reviewer_model: 'opus' }), [], 'the ticket\'s wins');
});

test('0280 AC1: speck set ready accepts it', () => {
  const r = repoWith({ builder_model: 'opus' }, { reviewer: 'claude-subagent', reviewer_model: 'fable' });
  const out = setReady(r);
  assert.equal(out.status, 0, out.stderr);
});

test('0280 AC1: saving reviewer in the panel accepts it, with the models already set or saved with it', () => {
  const r = repoWith({ builder_model: 'opus', reviewer_model: 'fable' });
  const out = panelSetSetting(r.dir, 'reviewer', 'claude-subagent');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const s = repoWith();
  const both = panelSaveSettings(s.dir, [{ key: 'reviewer', value: 'claude-subagent' }, { key: 'builder_model', value: 'opus' }, { key: 'reviewer_model', value: 'fable' }]);
  assert.equal(both.status, 200, JSON.stringify(both.body));
});

test('0280 AC2: lint refuses the same model, or a blank one, unless allow_same_model_review is true', () => {
  const cases = [
    [subagent({ reviewer_model: 'opus' }), { builder_model: 'opus' }],
    [subagent({ reviewer_model: 'Opus' }), { builder_model: 'opus' }],
    [subagent({ reviewer_model: 'fable' }), {}],
    [subagent({ reviewer_model: 'fable' }), { builder_model: '' }],
    [subagent(), { builder_model: 'opus' }],
    [subagent(), {}],
    [ticket(fm({ builder: 'codex', reviewer: 'codex', reviewer_model: 'b' }), good), { builder: 'codex', builder_model: 'a' }],
  ];
  for (const [t, c] of cases) {
    assert.equal(errorsOf(t, c).length, 1, JSON.stringify(c));
    assert.deepEqual(errorsOf(t, { ...c, allow_same_model_review: true }), [], JSON.stringify(c));
  }
});

test('0280 AC2: speck set ready refuses it', () => {
  for (const [config, fields] of [[{ builder_model: 'opus' }, { reviewer: 'claude-subagent', reviewer_model: 'opus' }],
    [{}, { reviewer: 'claude-subagent', reviewer_model: 'fable' }]]) {
    const r = repoWith(config, fields);
    const out = setReady(r);
    assert.notEqual(out.status, 0, JSON.stringify(config));
    assert.match(out.stderr + out.stdout, /allow_same_model_review/);
    const allowed = repoWith({ ...config, allow_same_model_review: 'true' }, fields);
    assert.equal(setReady(allowed).status, 0);
  }
});

test('0280 AC2: saving reviewer, builder_model or reviewer_model in the panel refuses it, changing nothing', () => {
  const r = repoWith({ builder_model: 'opus', reviewer_model: 'opus' });
  const head = r.g('rev-parse', 'HEAD');
  const out = panelSetSetting(r.dir, 'reviewer', 'claude-subagent');
  assert.equal(out.status, 422);
  assert.match(out.body.error, /allow_same_model_review/);
  const blank = repoWith({ builder_model: 'opus' });
  assert.equal(panelSetSetting(blank.dir, 'reviewer', 'claude-subagent').status, 422, 'reviewer_model blank');
  const s = repoWith({ reviewer: 'claude-subagent', builder_model: 'opus', reviewer_model: 'fable', allow_same_model_review: 'false' });
  const same = panelSaveSettings(s.dir, [{ key: 'reviewer_model', value: 'opus' }]);
  assert.equal(same.status, 422);
  assert.deepEqual(Object.keys(same.body.refused), ['reviewer_model']);
  assert.equal(panelSetSetting(s.dir, 'builder_model', 'fable').status, 422);
  assert.equal(panelSetSetting(s.dir, 'builder_model', 'sonnet').status, 200, 'still different');
  assert.equal(r.g('rev-parse', 'HEAD'), head);
  const allowed = repoWith({ builder_model: 'opus', reviewer_model: 'opus', allow_same_model_review: 'true' });
  assert.equal(panelSetSetting(allowed.dir, 'reviewer', 'claude-subagent').status, 200);
});

test('0280 AC3: the refusal says which models it compared, or which wasn\'t set, and what to change', () => {
  const [same] = errorsOf(subagent({ reviewer_model: 'opus' }), { builder_model: 'opus' });
  assert.match(same, /"opus"/);
  assert.match(same, /builder_model/);
  assert.match(same, /reviewer_model/);
  assert.match(same, /allow_same_model_review: true/);
  const [noBuilder] = errorsOf(subagent({ reviewer_model: 'fable' }));
  assert.match(noBuilder, /builder_model isn't set/);
  assert.match(noBuilder, /"fable"/);
  const [noReviewer] = errorsOf(subagent(), { builder_model: 'opus' });
  assert.match(noReviewer, /reviewer_model isn't set/);
  assert.match(noReviewer, /"opus"/);
  const [neither] = errorsOf(subagent());
  assert.match(neither, /builder_model isn't set/);
  assert.match(neither, /reviewer_model isn't set/);
  const [codex] = errorsOf(ticket(fm({ builder: 'codex', reviewer: 'codex', reviewer_model: 'b' }), good), { builder: 'codex', builder_model: 'a' });
  assert.match(codex, /builder_model \("a"\) is only passed to Claude Code builds/);
  const r = repoWith({ builder_model: 'opus', reviewer_model: 'opus' });
  const out = panelSetSetting(r.dir, 'reviewer', 'claude-subagent');
  assert.match(out.body.error, /"opus"/);
  assert.match(out.body.error, /builder_model/);
});

test('0280 AC4: a reviewer from another family is accepted whatever the models', () => {
  for (const c of [{ builder_model: 'x', reviewer_model: 'x' }, {}, { builder_model: 'opus' }])
    assert.deepEqual(errorsOf(ticket(fm({ reviewer: 'codex' }), good), c), [], JSON.stringify(c));
  const r = repoWith({ reviewer: 'claude-subagent', builder_model: 'x', reviewer_model: 'x', allow_same_model_review: 'true' });
  assert.equal(panelSetSetting(r.dir, 'reviewer', 'codex').status, 200);
  const s = repoWith({ builder_model: 'x', reviewer_model: 'x' });
  assert.equal(panelSaveSettings(s.dir, [{ key: 'reviewer_model', value: 'x2' }, { key: 'builder_model', value: 'x2' }]).status, 200);
});

test('0280 AC5: the Settings view explains allow_same_model_review as needed only for one family and the same or a default model', () => {
  const r = repoWith();
  const s = panelSettings(r.dir).groups.flatMap(g => g.settings).find(x => x.key === 'allow_same_model_review');
  assert.match(s.explain, /family/);
  assert.match(s.explain, /same model/);
  assert.match(s.explain, /default/);
});

test('0280 self-check: the README, the brief and the config template name builder_model where they explain allow_same_model_review', () => {
  const root = path.resolve(import.meta.dirname, '..');
  for (const f of ['README.md', 'docs/brief.md', 'templates/config.yml']) {
    const lines = fs.readFileSync(path.join(root, f), 'utf8').split('\n').filter(l => /allow_same_model_review/.test(l) && !/^\s*\|?\s*`?speck /.test(l));
    assert.ok(lines.length, f);
    for (const l of lines) assert.match(l, /builder_model/, `${f}: ${l.slice(0, 120)}`);
  }
});

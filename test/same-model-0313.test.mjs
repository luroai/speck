import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { lintTicket } from '../scripts/speck.mjs';
import { panelSettings, panelSaveSettings } from '../scripts/settings.mjs';
import { sameModelProblem } from '../scripts/same-model.mjs';
import { cfg, ticket, good, fm } from './support/speck.mjs';
import { panelRepo, gitEnv } from './support/panel.mjs';

// ---------- 0313: builder_model counts in the same-model check for Codex builds speck starts itself ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const codexTicket = (o = {}) => ticket(fm({ builder: 'codex', reviewer: 'codex', ...o }), good);
const codexCfg = (o = {}) => ({ ...cfg, builder: 'codex', build_command: '', ...o });
const errorsOf = (t, c) => lintTicket(t, c).errors;

// A panel repo whose config has these values, committed, and whose ticket 0001 has these fields, left as a draft.
function repoWith(config = {}, fields = {}) {
  const r = panelRepo();
  const file = path.join(r.dir, 'speck', 'config.yml');
  let text = fs.readFileSync(file, 'utf8');
  for (const [k, v] of Object.entries(config)) {
    const line = `${k}: ${v}`;
    text = new RegExp(`^${k}:.*$`, 'm').test(text) ? text.replace(new RegExp(`^${k}:.*$`, 'm'), line) : `${text}\n${line}\n`;
  }
  fs.writeFileSync(file, text);
  let t = fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: draft');
  for (const [k, v] of Object.entries(fields)) t = t.replace(new RegExp(`^${k}:.*$`, 'm'), `${k}: ${v}`);
  fs.writeFileSync(r.file, t);
  r.g('commit', '-qam', 'setup');
  return r;
}
const codexRepo = (o = {}, fields = {}) => repoWith({ builder: 'codex', reviewer: 'codex', build_command: "''", ...o },
  { builder: 'codex', reviewer: 'codex', ...fields });

test('0313 AC1: lint accepts a Codex builder and reviewer on different models when build_command is blank', () => {
  assert.deepEqual(errorsOf(codexTicket({ reviewer_model: 'b' }), codexCfg({ builder_model: 'a' })), [], 'ticket reviewer_model');
  assert.deepEqual(errorsOf(codexTicket(), codexCfg({ builder_model: 'a', reviewer_model: 'b' })), [], 'config reviewer_model');
  assert.equal(sameModelProblem('codex', 'codex', codexCfg({ builder_model: ' a ' }), 'b'), null, 'trimmed');
});

test('0313 AC1: speck set ready accepts it', () => {
  const r = codexRepo({ builder_model: 'a' }, { reviewer_model: 'b' });
  const out = r.run('set', '1', 'status', 'ready');
  assert.equal(out.status, 0, out.stderr + out.stdout);
});

test('0313 AC1: saving in the Settings view accepts it', () => {
  const r = codexRepo({ builder_model: 'a', reviewer_model: 'c' });
  const out = panelSaveSettings(r.dir, [{ key: 'reviewer_model', value: 'b' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
});

test('0313 AC2: the same model, or either blank, is refused unless allow_same_model_review is true', () => {
  const cases = [
    [codexTicket({ reviewer_model: 'a' }), codexCfg({ builder_model: 'a' })],
    [codexTicket({ reviewer_model: 'A' }), codexCfg({ builder_model: 'a' })],
    [codexTicket({ reviewer_model: 'b' }), codexCfg({ builder_model: '' })],
    [codexTicket({ reviewer_model: 'b' }), codexCfg()],
    [codexTicket(), codexCfg({ builder_model: 'a' })],
  ];
  for (const [t, c] of cases) {
    assert.equal(errorsOf(t, c).length, 1, JSON.stringify(c));
    assert.match(errorsOf(t, c)[0], /allow_same_model_review: true/);
    assert.deepEqual(errorsOf(t, { ...c, allow_same_model_review: true }), [], JSON.stringify(c));
  }
  const [same] = errorsOf(codexTicket({ reviewer_model: 'a' }), codexCfg({ builder_model: 'a' }));
  assert.match(same, /both would run "a"/);
});

test('0313 AC2: speck set ready and the Settings view refuse the same model', () => {
  const r = codexRepo({ builder_model: 'a' }, { reviewer_model: 'a' });
  const out = r.run('set', '1', 'status', 'ready');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr + out.stdout, /allow_same_model_review/);
  const s = codexRepo({ builder_model: 'a', reviewer_model: 'c' });
  const head = s.g('rev-parse', 'HEAD');
  const save = panelSaveSettings(s.dir, [{ key: 'reviewer_model', value: 'a' }]);
  assert.equal(save.status, 422);
  assert.match(save.body.refused.reviewer_model, /allow_same_model_review/);
  assert.equal(s.g('rev-parse', 'HEAD'), head);
});

test('0313 AC3: with build_command set, builder_model isn\'t counted for a Codex builder', () => {
  for (const build_command of ['codex exec "/speck-build {id}"', undefined]) {
    const c = { ...codexCfg({ builder_model: 'a' }), build_command };
    const errors = errorsOf(codexTicket({ reviewer_model: 'b' }), c);
    assert.equal(errors.length, 1, String(build_command));
    assert.match(errors[0], /builder_model \("a"\) is only passed/);
    assert.match(errors[0], /build_command is blank/);
  }
  const r = codexRepo({ builder_model: 'a', build_command: '\'codex exec "/speck-build {id}"\'' }, { reviewer_model: 'b' });
  assert.notEqual(r.run('set', '1', 'status', 'ready').status, 0);
});

test('0313 AC4: the Settings view no longer says builder_model counts only for Claude Code', () => {
  const r = repoWith();
  const s = panelSettings(r.dir).groups.flatMap(g => g.settings).find(x => x.key === 'allow_same_model_review');
  assert.doesNotMatch(s.explain, /only (for|passed to|given to) Claude Code/i);
  assert.doesNotMatch(s.explain, /only Claude Code/i);
});

test('0313 AC1 self-check: switching the builder to codex in the Settings view counts builder_model, as build_command is blanked with it', () => {
  const r = repoWith({ builder_model: 'a', reviewer: 'codex', reviewer_model: 'b' });
  const out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }], { offered: { builder: 'codex', models: ['a', 'b'] } });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const s = repoWith({ builder_model: 'a', reviewer: 'codex', reviewer_model: 'a' });
  assert.equal(panelSaveSettings(s.dir, [{ key: 'builder', value: 'codex' }], { offered: { builder: 'codex', models: ['a'] } }).status, 422);
});

test('0313 AC3: a Claude builder still counts builder_model with build_command set, as speck adds --model to it', () => {
  const sub = (o = {}) => ticket(fm({ builder: 'claude', reviewer: 'claude-subagent', ...o }), good);
  const c = { ...cfg, builder: 'claude', build_command: 'my-claude-wrapper {id}', builder_model: 'opus' };
  assert.deepEqual(errorsOf(sub({ reviewer_model: 'fable' }), c), [], 'different models');
  assert.equal(errorsOf(sub({ reviewer_model: 'opus' }), c).length, 1, 'same model');
});

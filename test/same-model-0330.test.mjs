import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { lintTicket } from '../scripts/speck.mjs';
import { panelSaveSettings } from '../scripts/settings.mjs';
import { sameModelProblem } from '../scripts/same-model.mjs';
import { cfg, ticket, good, fm } from './support/speck.mjs';
import { panelRepo, gitEnv } from './support/panel.mjs';

// ---------- 0330: a Cursor builder's model counts in the same-model check, auto when builder_model is blank ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const cursorTicket = (o = {}) => ticket(fm({ builder: 'cursor', reviewer: 'cursor', ...o }), good);
const cursorCfg = (o = {}) => ({ ...cfg, builder: 'cursor', reviewer: 'cursor', build_command: '', ...o });
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
const cursorRepo = (o = {}, fields = {}) => repoWith({ builder: 'cursor', reviewer: 'cursor', build_command: "''", ...o },
  { builder: 'cursor', reviewer: 'cursor', ...fields });

test('0330 AC1: lint accepts a Cursor builder and reviewer on different models when build_command is blank', () => {
  assert.deepEqual(errorsOf(cursorTicket({ reviewer_model: 'b' }), cursorCfg({ builder_model: 'a' })), [], 'ticket reviewer_model');
  assert.deepEqual(errorsOf(cursorTicket(), cursorCfg({ builder_model: 'a', reviewer_model: 'b' })), [], 'config reviewer_model');
  assert.equal(sameModelProblem('cursor', 'cursor', cursorCfg({ builder_model: ' a ' }), 'b'), null, 'trimmed');
});

test('0330 AC1: speck set ready and saving in the Settings view accept it', () => {
  const r = cursorRepo({ builder_model: 'a' }, { reviewer_model: 'b' });
  const out = r.run('set', '1', 'status', 'ready');
  assert.equal(out.status, 0, out.stderr + out.stdout);
  const s = cursorRepo({ builder_model: 'a', reviewer_model: 'c' });
  const save = panelSaveSettings(s.dir, [{ key: 'reviewer_model', value: 'b' }]);
  assert.equal(save.status, 200, JSON.stringify(save.body));
});

test('0330 AC2: lint accepts a Cursor build on auto when the reviewer has a model other than auto', () => {
  assert.deepEqual(errorsOf(cursorTicket({ reviewer_model: 'b' }), cursorCfg()), [], 'builder_model missing');
  assert.deepEqual(errorsOf(cursorTicket({ reviewer_model: 'b' }), cursorCfg({ builder_model: '' })), [], 'builder_model blank');
  assert.deepEqual(errorsOf(cursorTicket(), cursorCfg({ builder_model: 'auto', reviewer_model: 'b' })), [], 'builder_model auto');
  // 0312: a ticket recording builder: cursor while speck/config.yml names another builder is built on auto.
  const other = { ...cfg, builder: 'claude', build_command: '', builder_model: 'opus' };
  assert.deepEqual(errorsOf(cursorTicket({ reviewer_model: 'b' }), other), [], 'another builder\'s ticket');
});

test('0330 AC2: speck set ready and saving in the Settings view accept it', () => {
  const r = cursorRepo({}, { reviewer_model: 'b' });
  const out = r.run('set', '1', 'status', 'ready');
  assert.equal(out.status, 0, out.stderr + out.stdout);
  const s = cursorRepo({ reviewer_model: 'c' });
  const save = panelSaveSettings(s.dir, [{ key: 'reviewer_model', value: 'b' }]);
  assert.equal(save.status, 200, JSON.stringify(save.body));
});

test('0330 AC3: the same model, a blank or auto reviewer_model, or a set build_command is refused unless allow_same_model_review is true', () => {
  const cases = [
    [cursorTicket({ reviewer_model: 'a' }), cursorCfg({ builder_model: 'a' })],
    [cursorTicket({ reviewer_model: 'A' }), cursorCfg({ builder_model: 'a' })],
    [cursorTicket(), cursorCfg({ builder_model: 'a' })],
    [cursorTicket(), cursorCfg()],
    [cursorTicket({ reviewer_model: 'auto' }), cursorCfg({ builder_model: 'a' })],
    [cursorTicket({ reviewer_model: 'Auto' }), cursorCfg()],
    [cursorTicket({ reviewer_model: 'b' }), cursorCfg({ builder_model: 'a', build_command: 'agent -p "/speck-build {id}"' })],
    [cursorTicket({ reviewer_model: 'b' }), cursorCfg({ build_command: 'agent -p "/speck-build {id}"' })],
    [cursorTicket({ reviewer_model: 'b' }), { ...cursorCfg({ builder_model: 'a' }), build_command: undefined }],
    [cursorTicket({ reviewer_model: 'b' }), { ...cfg, builder: 'claude', builder_model: 'opus', build_command: 'my-wrapper {id}' }],
  ];
  for (const [t, c] of cases) {
    const errors = errorsOf(t, c);
    assert.equal(errors.length, 1, JSON.stringify(c));
    assert.match(errors[0], /allow_same_model_review: true/);
    assert.deepEqual(errorsOf(t, { ...c, allow_same_model_review: true }), [], JSON.stringify(c));
  }
  assert.match(errorsOf(cursorTicket({ reviewer_model: 'a' }), cursorCfg({ builder_model: 'a' }))[0], /both would run "a"/);
});

test('0330 AC3: speck set ready and the Settings view refuse the same model and an auto reviewer_model', () => {
  const r = cursorRepo({ builder_model: 'a' }, { reviewer_model: 'a' });
  const out = r.run('set', '1', 'status', 'ready');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr + out.stdout, /allow_same_model_review/);
  for (const value of ['a', 'auto']) {
    const s = cursorRepo({ builder_model: 'a', reviewer_model: 'c' });
    const head = s.g('rev-parse', 'HEAD');
    const save = panelSaveSettings(s.dir, [{ key: 'reviewer_model', value }]);
    assert.equal(save.status, 422, value);
    assert.match(save.body.refused.reviewer_model, /allow_same_model_review/);
    assert.equal(s.g('rev-parse', 'HEAD'), head);
  }
});

test('0330 AC4: the refusal no longer says builder_model is passed only to Claude Code and Codex builds', () => {
  const c = cursorCfg({ builder_model: 'a', build_command: 'agent -p "/speck-build {id}"' });
  const [error] = errorsOf(cursorTicket({ reviewer_model: 'b' }), c);
  assert.doesNotMatch(error, /only passed to Claude Code builds, and to Codex builds/);
  assert.match(error, /Cursor/);
  const codex = { ...cfg, builder: 'codex', builder_model: 'a', build_command: 'codex exec "/speck-build {id}"' };
  const [codexError] = errorsOf(ticket(fm({ builder: 'codex', reviewer: 'codex', reviewer_model: 'b' }), good), codex);
  assert.doesNotMatch(codexError, /only passed to Claude Code builds, and to Codex builds/);
});

test('0330 AC2 self-check: the brief says a Cursor build left without builder_model runs on auto, and when that counts', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const line = brief.split('\n').find(l => l.startsWith('Config rejects a `builder` and `reviewer` from the same family'));
  assert.ok(line, 'the same-family sentence');
  assert.match(line, /Cursor's `auto`/);
  assert.match(line, /`build_command` is blank/);
});

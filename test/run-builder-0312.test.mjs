import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runRepo, startRun, until, stopRun, killAll } from './support/run.mjs';
import { buildPlan, ignoredBuildersNote, ticketBuilder, claudeStartWords } from '../scripts/ticket-builder.mjs';
import { DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';
import { resumeFor } from '../scripts/hand-back.mjs';
import { resumeCommandOf, DEFAULT_RESUME_COMMAND } from '../scripts/build-records.mjs';
import { readForeman, foremanView, foremanLines } from '../scripts/foreman.mjs';
import { splitCommand } from '../scripts/speck.mjs';

// ---------- 0312: build each ticket with the builder it was made with ----------

const CLAUDE = splitCommand(DEFAULT_BUILD_COMMAND);
const BYPASS = ['--json', '--dangerously-bypass-approvals-and-sandbox'];
const HEADLESS = ['-p', '--force', '--trust', '--output-format', 'stream-json'];
const yes = () => true;
const runsOf = dir => path.join(dir, 'speck', '.cache', 'runs');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// Fake builders named `names` on a PATH of their own, with only the system's folders after them, so no real Claude
// Code, Codex or Cursor installed for the user is ever found. Each call records its name, arguments and pid.
const FAKE = `
const fs = require('fs'), path = require('path');
const out = process.env.FAKE_OUT, args = process.argv.slice(3);
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
fs.writeFileSync(path.join(out, n + '.json'), JSON.stringify({ n, name: process.argv[2], args, pid: process.pid }));
if (process.argv[2] === 'codex') console.log(JSON.stringify({ type: 'thread.started', thread_id: 'thread-' + n }));
setTimeout(() => process.exit(0), 3000);
`;
function fakeBuilders(names) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'builders-bin-')), out = fs.mkdtempSync(path.join(os.tmpdir(), 'builders-out-'));
  fs.writeFileSync(path.join(bin, 'fake.cjs'), FAKE);
  for (const name of names) fs.writeFileSync(path.join(bin, name), `#!/bin/sh\nexec "${process.execPath}" "${path.join(bin, 'fake.cjs')}" ${name} "$@"\n`, { mode: 0o755 });
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => read(path.join(out, f))).sort((a, b) => a.n - b.n);
  return { env: { PATH: [bin, '/usr/local/bin', '/usr/bin', '/bin'].join(path.delimiter), FAKE_OUT: out }, calls };
}

// A speck run repo with `builder` in speck/config.yml, build_command blank (or the fake builder's, with `fake`) and
// builder_model as given.
function builderRepo(tickets, { builder = 'codex', model = '', fake = false } = {}) {
  const r = runRepo({ tickets, max: 4, command: fake ? undefined : null });
  let text = fs.readFileSync(r.cfgFile, 'utf8').replace(/^builder:.*$/m, `builder: ${builder}`).replace(/^builder_model:.*$/m, '');
  if (!fake) text += 'build_command: ""\n';
  text += `builder_model: "${model}"\n`;
  fs.writeFileSync(r.cfgFile, text);
  r.g('commit', '-qam', 'builder');
  return r;
}

test('0312 AC1: with build_command blank, each ticket gets its own builder\'s command, with builder_model only for the configured builder', () => {
  const cfg = { builder: 'codex', build_command: '', builder_model: 'gpt-6.1-sol' };
  assert.deepEqual(buildPlan(cfg, { id: '0001', builder: 'claude' }, yes), { agent: 'claude', words: CLAUDE }, 'Claude Code\'s command, without the Codex model');
  assert.deepEqual(buildPlan(cfg, { id: '0002', builder: 'codex' }, yes), { agent: 'codex', words: ['codex', 'exec', ...BYPASS, '-m', 'gpt-6.1-sol', '$speck-build {id}'] });
  const cursor = buildPlan(cfg, { id: '0003', builder: 'cursor' }, yes);
  assert.equal(cursor.agent, 'cursor');
  assert.deepEqual(cursor.words.slice(1), [...HEADLESS, '--model', 'auto', '--resume', '{session}', '/speck-build {id}'], 'a blank model is auto, not the Codex one');
  const claudeCfg = { builder: 'claude', build_command: '', builder_model: 'opus' };
  assert.deepEqual(buildPlan(claudeCfg, { builder: 'claude' }, yes).words, [...CLAUDE, '--model', 'opus']);
  assert.deepEqual(buildPlan(claudeCfg, { builder: 'codex' }, yes).words, ['codex', 'exec', ...BYPASS, '$speck-build {id}'], 'no -m opus for Codex');
  assert.match(buildPlan(cfg, { builder: 'gemini' }, yes).why, /no command of its own.*build_command/);
  assert.match(buildPlan(cfg, { builder: 'constructor' }, yes).why, /builder is constructor/, 'a built-in name is an unknown builder');
});

test('0312 AC2: a ticket with no builder field is built with the builder in speck/config.yml', () => {
  for (const builder of [undefined, '', '  ', null]) {
    assert.equal(ticketBuilder({ builder }, { builder: 'codex' }), 'codex');
    assert.equal(buildPlan({ builder: 'codex', build_command: '' }, { id: '0001', builder }, yes).agent, 'codex');
  }
  assert.equal(ticketBuilder({}, {}), 'claude', 'no builder anywhere: claude, as speck has it by default');
});

test('0312 AC3: with build_command set, speck run says once as it starts that tickets\' own builders are ignored', async () => {
  const cfg = { builder: 'claude', build_command: 'claude -p x' };
  const board = [{ id: '0001', builder: 'claude', status: 'ready' }, { id: '0002', builder: 'codex', status: 'ready' }, { id: '0003', builder: 'cursor', status: 'done' }];
  assert.match(ignoredBuildersNote(cfg, board), /build_command is set.*ignored: 0002 records a builder other than claude/);
  assert.equal(ignoredBuildersNote(cfg, board.slice(0, 1)), null, 'nothing to say when every ticket records the configured builder');
  assert.equal(ignoredBuildersNote({ ...cfg, build_command: ' ' }, board), null, 'blank: each ticket gets its own builder');
  assert.equal(ignoredBuildersNote(cfg, null), null);

  const r = builderRepo([['0001', { builder: 'codex' }]], { builder: 'claude', fake: true });
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => r.calls().length >= 1, 10000), run.out());
    assert.match(r.calls()[0].args[0], /^0001$/, 'built with build_command, as today');
    await until(() => false, 300);
    assert.equal(run.out().split('the builder each ticket records is ignored').length - 1, 1, run.out());
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0312 AC1, AC4: speck run starts each ticket with its own builder, and leaves one that isn\'t installed ready, saying why', async () => {
  const r = builderRepo([['0001', { builder: 'claude' }], ['0002', { builder: 'codex' }], ['0003', { builder: 'cursor' }]], { model: 'gpt-6.1-sol' });
  const fake = fakeBuilders(['claude', 'codex']);
  const run = startRun(r.dir, fake.env);
  try {
    const ready = () => readForeman(runsOf(r.dir))?.ready?.find(x => x.id === '0003');
    assert.ok(await until(() => fake.calls().length >= 2 && ready(), 10000), run.out());
    const [claude] = fake.calls().filter(c => c.name === 'claude'), [codex] = fake.calls().filter(c => c.name === 'codex');
    assert.deepEqual(claude.args.slice(0, 2), ['-p', '/speck-build 0001']);
    assert.ok(!claude.args.includes('--model'), 'the Codex builder_model isn\'t given to Claude Code');
    assert.equal(read(path.join(runsOf(r.dir), '0001.json')).agent, 'claude');
    assert.deepEqual(codex.args, ['exec', ...BYPASS, '-m', 'gpt-6.1-sol', '$speck-build 0002']);
    assert.equal(ready().kind, 'builder');
    assert.match(ready().why, /Cursor, isn't installed/);
    assert.ok(!fs.existsSync(path.join(runsOf(r.dir), '0003.json')), 'not started');
    assert.match(run.out(), /0003 wasn't started, and stays ready: its builder, Cursor, isn't installed/);
    const view = foremanView({ run: { on: true, pid: run.child.pid }, record: readForeman(runsOf(r.dir)), tickets: [{ id: '0003', status: 'ready' }] });
    assert.match(foremanLines(view).join('\n'), /Cursor, isn't installed/, 'the Foreman\'s detail says why');
  } finally { await stopRun(run); killAll(fake.calls().map(c => c.pid)); }
});

test('0312 AC5: resumed and handed-back builds carry on with the builder the build started with', () => {
  const codexCfg = { builder: 'codex', build_command: '', builder_model: 'gpt-6.1-sol' };
  const rec = { id: '0001', agent: 'claude', session: 'sess-1' };
  const { argv } = resumeFor(['codex', 'exec', '$speck-build {id}'], codexCfg, '0001', rec, 'carry on');
  assert.deepEqual(argv, CLAUDE.map(w => (w === '--session-id' ? '--resume' : w === '{session}' ? 'sess-1' : w.includes('{id}') ? 'carry on' : w)), 'Claude Code\'s own session, whatever the config builds with now');
  const claudeCfg = { builder: 'claude', build_command: 'claude -p x', builder_model: 'opus' };
  assert.deepEqual(resumeFor([], claudeCfg, '0001', rec, 'm').argv.slice(-2), ['--model', 'opus']);
  assert.deepEqual(claudeStartWords(codexCfg), CLAUDE);
  const codexRec = { id: '0002', agent: 'codex', session: 'thread-2' };
  assert.deepEqual(resumeFor([], claudeCfg, '0002', codexRec, 'm').argv, ['codex', 'exec', 'resume', 'thread-2', ...BYPASS, 'm'], 'no Claude Code model given to Codex');
  assert.deepEqual(resumeFor([], codexCfg, '0002', codexRec, 'm').argv, ['codex', 'exec', 'resume', 'thread-2', ...BYPASS, '-m', 'gpt-6.1-sol', 'm']);
  assert.equal(resumeCommandOf({ resume_command: 'codex resume {session}' }, 'claude'), DEFAULT_RESUME_COMMAND, 'resumed by hand with Claude Code too');
  assert.equal(resumeCommandOf({ resume_command: 'claude --resume {session} --verbose' }, 'claude'), 'claude --resume {session} --verbose');
});

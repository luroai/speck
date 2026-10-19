import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { runRepo, CLI, env } from './support/run.mjs';
import { panelRepo } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, changeTo } from './support/settings.mjs';
import { launchPlan, ignoredBuildersNote } from '../scripts/ticket-builder.mjs';
import { DEFAULT_BUILD_COMMAND, buildsEachTicket } from '../scripts/build-model.mjs';
import { panelSettings } from '../scripts/settings.mjs';
import { splitCommand } from '../scripts/speck.mjs';

// ---------- 0324: build each ticket with its own builder after switching to Claude Code ----------

const yes = () => true;
const BYPASS = ['--json', '--dangerously-bypass-approvals-and-sandbox'];
const plan = (cfg, t) => {
  const command = typeof cfg.build_command === 'string' ? cfg.build_command.trim() : '';
  const words = command ? splitCommand(command) : null;
  return launchPlan(cfg, { id: '0001', status: 'ready', ...t }, { command, words, repo: '/nowhere', failed: new Map(),
    chat: () => ({ session: 'chat-1' }), installed: yes });
};

test('0324 AC1: with Claude Code\'s own build_command, a Codex or Cursor ticket is built with its own builder\'s command', () => {
  const cfg = { builder: 'claude', build_command: DEFAULT_BUILD_COMMAND };
  assert.equal(buildsEachTicket(DEFAULT_BUILD_COMMAND), true);
  assert.equal(buildsEachTicket(''), true);
  const codex = plan(cfg, { builder: 'codex' });
  assert.equal(codex.agent, 'codex');
  assert.deepEqual(codex.words, ['codex', 'exec', ...BYPASS, '$speck-build {id}']);
  const cursor = plan(cfg, { builder: 'cursor' });
  assert.equal(cursor.agent, 'cursor');
  assert.equal(cursor.tag, 'chat-1');
  const claude = plan({ ...cfg, builder_model: 'opus' }, { builder: 'claude' });
  assert.equal(claude.agent, 'claude');
  assert.deepEqual(claude.words, [...splitCommand(DEFAULT_BUILD_COMMAND), '--model', 'opus']);
  assert.equal(plan(cfg, {}).agent, 'claude', 'no builder field: the one in speck/config.yml');
  const blank = plan({ builder: 'claude', build_command: '' }, { builder: 'codex' });
  assert.deepEqual(blank.words, codex.words, 'as with a blank build_command');
  const board = [{ id: '0002', builder: 'codex', status: 'ready' }];
  assert.equal(ignoredBuildersNote(cfg, board), null, 'nothing is ignored, so speck run says nothing');
  assert.equal(ignoredBuildersNote({ ...cfg, build_command: `  ${DEFAULT_BUILD_COMMAND} ` }, board), null);
});

test('0324 AC2: a build_command you\'ve written yourself is used for every ticket', () => {
  const near = `${DEFAULT_BUILD_COMMAND} --model opus`;
  for (const build_command of ['my-build {id} {session}', near, DEFAULT_BUILD_COMMAND.replace('claude -p', 'claude  -p')]) {
    assert.equal(buildsEachTicket(build_command), false, build_command);
    const cfg = { builder: 'claude', build_command };
    for (const builder of ['codex', 'cursor', 'claude']) {
      const p = plan(cfg, { builder });
      assert.equal(p.agent, null, `${build_command}: ${builder}`);
      assert.deepEqual(p.words, splitCommand(build_command));
    }
    assert.match(ignoredBuildersNote(cfg, [{ id: '0002', builder: 'codex', status: 'ready' }]), /every build starts with it.*ignored: 0002/);
  }
});

test('0324 AC3: a blank build_command with builder claude still starts no builds', () => {
  const r = runRepo({ tickets: [], command: null });
  fs.writeFileSync(r.cfgFile, `${fs.readFileSync(r.cfgFile, 'utf8').replace(/^builder:.*$/m, 'builder: claude')}build_command: ""\n`);
  r.g('commit', '-qam', 'blank');
  const out = spawnSync(process.execPath, [CLI, 'run'], { cwd: r.dir, env, encoding: 'utf8', timeout: 20000 });
  assert.notEqual(out.status, 0);
  assert.match(out.stderr + out.stdout, /No build_command is set in speck\/config\.yml, so speck run has nothing to start builds with/);
});

const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
const OWN = { claude: DEFAULT_BUILD_COMMAND, codex: '', cursor: '' };
const viewWith = (builder, value, each_ticket, hand_set) => ({ groups: [{ title: 'Building and reviewing', settings: [
  S('builder', builder, { choices: ['claude', 'codex', 'cursor'], build_command: { value, hand_set, each_ticket, own: OWN } })] }] });
const builderRow = s => s.groups.flatMap(g => g.settings).find(x => x.key === 'builder');

test('0324 AC4: the settings say whether build_command builds each ticket with its own builder', () => {
  const r = panelRepo();
  const set = line => {
    const file = `${r.dir}/speck/config.yml`;
    fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').replace(/^build_command:.*$/m, '')}${line}\n`);
    return builderRow(panelSettings(r.dir)).build_command.each_ticket;
  };
  assert.equal(set(`build_command: '${DEFAULT_BUILD_COMMAND}'`), true);
  assert.equal(set('build_command: ""'), true);
  assert.equal(set('build_command: "my-build {id}"'), false);
});

test('0324 AC4: the view says when a build_command you\'ve written yourself builds every ticket', async () => {
  const words = async view => {
    const p = settingsPage([view], []);
    await p.settle();
    await openSettings(p);
    return p;
  };
  const line = p => p.all(rowOf(p, 'builder')).find(n => n.tagName === 'p' && /written yourself/.test(n.textContent));
  const hand = await words(viewWith('claude', 'my-build {id}', false, true));
  assert.match(line(hand).textContent, /every ticket/);
  assert.match(line(hand).textContent, /my-build \{id\}/);
  for (const [builder, value] of [['claude', DEFAULT_BUILD_COMMAND], ['codex', '']]) {
    const p = await words(viewWith(builder, value, true, false));
    assert.equal(line(p), undefined, `${builder}'s own: each ticket keeps its builder`);
    changeTo(p, 'builder', builder === 'claude' ? 'codex' : 'claude');
    assert.ok(p.all(rowOf(p, 'builder')).some(n => n.tagName === 'p' && /keep the builder they were made with/.test(n.textContent)));
  }
});

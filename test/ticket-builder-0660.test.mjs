// 0660: build levels in speck/config.yml, each giving a builder, model and effort, for the tickets that name them.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { parseTicket, loadConfig } from '../scripts/speck.mjs';
import { parseConfig, ticketAgents } from '../scripts/core.mjs';
import { levelsOf, levelNames, DEFAULT_LEVELS } from '../scripts/levels.mjs';
import { buildPlan, launchPlan, launchTicket, standInTicket } from '../scripts/ticket-builder.mjs';
import { resumeFor } from '../scripts/hand-back.mjs';
import { ticketBuilderModel } from '../scripts/build-model.mjs';
import { ticketSameModelProblem } from '../scripts/same-model.mjs';
import { lintTicket } from '../scripts/lint.mjs';
import { standInFor, recordBuilder } from '../scripts/builder-stand-in.mjs';
import { buildTakeOver, recordTakeOver } from '../scripts/build-take-over.mjs';
import { PROVIDERS } from '../scripts/providers.mjs';

Object.assign(process.env, gitEnv);

const yes = () => true;
const CFG = { builder: 'claude', builder_model: 'opus', builder_effort: 'high', build_command: '', reviewer: 'codex' };
const GRAPHICS = { ...CFG, levels: { quick: { builder_effort: 'low' }, graphics: { builder: 'codex', builder_model: 'gpt-x', builder_effort: 'xhigh' } } };
const after = (words, flag) => words[words.lastIndexOf(flag) + 1];
const effortOf = words => words.find(w => /^model_reasoning_effort=/.test(w)) ?? (words.includes('--effort') ? after(words, '--effort') : null);
// Ticket frontmatter `fm` as speck run launches it: its builder as the board gives it, then its own and its level's values.
const launched = (fm, cfg = CFG) => launchTicket({ id: '0001', builder: ticketAgents(fm, cfg).builder }, false, () => fm, cfg);
const words = (fm, cfg = CFG) => buildPlan(cfg, launched(fm, cfg), yes, { providers: PROVIDERS }).words;
const record = (fm, cfg = CFG) => launchPlan(cfg, launched(fm, cfg), { command: '', words: [], repo: null, failed: new Map(), installed: yes }).record;
const resume = (rec, cfg = CFG) => resumeFor([], cfg, '0001', { session: 'abc', ...rec }, 'carry on', PROVIDERS).argv;

// ---------- AC1 ----------

test('0660 AC1: a project without levels: gets quick, balanced and deep', () => {
  assert.deepEqual(levelsOf({}), { quick: { builder_effort: 'low' }, balanced: {}, deep: { builder_effort: 'max' } });
  assert.deepEqual(levelsOf(parseConfig('builder: claude\n')), DEFAULT_LEVELS);
});

test('0660 AC1: a config with levels: gets exactly the levels it lists, each giving any of builder, builder_model and builder_effort', () => {
  const cfg = parseConfig('builder: claude\nlevels:\n  quick:\n    builder_effort: low\n  graphics:\n    builder: claude\n    builder_model: opus\n');
  assert.deepEqual(levelNames(cfg), ['quick', 'graphics']);
  assert.deepEqual(levelsOf(cfg).graphics, { builder: 'claude', builder_model: 'opus' });
  assert.deepEqual(levelNames(parseConfig('levels: {}\n')), [], 'an empty levels: has none');
});

// ---------- AC2 ----------

test('0660 AC2: a ticket\'s level gives its builder, model and effort to its build, its resume and its hand-back', () => {
  assert.equal(after(words({ level: 'deep' }), '--effort'), 'max');
  assert.equal(after(words({ level: 'deep' }), '--model'), 'opus', 'the model the level leaves out is the settings\'');
  assert.equal(ticketAgents({ level: 'graphics' }, GRAPHICS).builder, 'codex');
  const g = words({ level: 'graphics' }, GRAPHICS);
  assert.equal(g[0], 'codex');
  assert.equal(after(g, '-m'), 'gpt-x');
  assert.equal(effortOf(g), 'model_reasoning_effort="xhigh"');
  const rec = record({ level: 'graphics' }, GRAPHICS);
  assert.deepEqual(rec, { ticket_builder_model: 'gpt-x', ticket_builder_effort: 'xhigh' });
  const back = resume({ agent: 'codex', ...rec }, GRAPHICS);
  assert.equal(after(back, '-m'), 'gpt-x');
  assert.equal(effortOf(back), 'model_reasoning_effort="xhigh"');
  assert.equal(after(resume({ agent: 'claude', ...record({ level: 'quick' }) }), '--effort'), 'low');
});

test('0660 AC2: a value on the ticket wins over its level\'s, each of the three on its own', () => {
  assert.equal(after(words({ level: 'deep', builder_effort: 'low' }), '--effort'), 'low');
  const g = words({ level: 'graphics', builder: 'claude', builder_model: 'sonnet' }, GRAPHICS);
  assert.equal(g[0], 'claude');
  assert.equal(after(g, '--model'), 'sonnet');
  assert.equal(after(g, '--effort'), 'xhigh', 'the effort the ticket leaves blank is still the level\'s');
  assert.equal(ticketBuilderModel({ level: 'graphics' }, GRAPHICS, PROVIDERS), 'gpt-x', 'the board gives the level\'s model');
});

test('0660 AC2: a ticket with level balanced or a blank level builds exactly as one without', () => {
  const none = words({});
  for (const level of ['balanced', '', '  ']) {
    assert.deepEqual(words({ level }), none, JSON.stringify(level));
    assert.deepEqual(record({ level }), {}, JSON.stringify(level));
  }
  assert.deepEqual(words({ level: 'deep' }, { ...CFG, levels: {} }), none, 'a level the project doesn\'t have gives nothing');
});

// ---------- AC3 ----------

function lintWith(cfgExtra = {}) {
  const r = panelRepo();
  const cfg = { ...loadConfig(r.dir), ...cfgExtra }, t = parseTicket(fs.readFileSync(r.file, 'utf8'));
  return fm => lintTicket({ ...t, fm: { ...t.fm, ...fm } }, cfg).errors.join('\n');
}

test('0660 AC3: speck check refuses a level the project doesn\'t have, naming the levels there are', () => {
  const lint = lintWith();
  const e = lint({ level: 'graphics' });
  assert.match(e, /level "graphics"/);
  for (const name of ['quick', 'balanced', 'deep']) assert.ok(e.includes(name), name);
  for (const level of ['deep', 'balanced', '']) assert.doesNotMatch(lint({ level }), /level/, level);
  assert.match(lint({ level: 'constructor' }), /level "constructor"/, 'a built-in name isn\'t a level');
  assert.match(lintWith({ levels: { graphics: {} } })({ level: 'deep' }), /level "deep".*graphics/, 'only the levels the config lists');
});

test('0660 AC3: speck check refuses a level whose builder_effort the settings would refuse', () => {
  const lint = lintWith({ levels: { odd: { builder_effort: 'turbo' }, fine: { builder_effort: 'ultra' } } });
  assert.match(lint({ level: 'odd' }), /builder_effort "turbo" in level "odd"/);
  assert.doesNotMatch(lint({ level: 'fine' }), /builder_effort/);
});

test('0660 AC3: the same-family ready check uses the builder and model the level gives the ticket', () => {
  const cfg = { builder: 'claude', reviewer: 'claude-subagent', reviewer_model: 'opus', build_command: '', levels: { same: { builder_model: 'opus' }, other: { builder_model: 'sonnet' }, cx: { builder: 'codex' } } };
  assert.match(ticketSameModelProblem({ level: 'same' }, cfg) ?? '', /"opus"/);
  assert.equal(ticketSameModelProblem({ level: 'other' }, cfg), null);
  assert.equal(ticketSameModelProblem({ level: 'cx' }, cfg), null, 'Codex beside a Claude reviewer');
  assert.match(ticketSameModelProblem({ level: 'cx' }, { ...cfg, reviewer: 'codex', reviewer_model: '' }) ?? '', /codex/);
  const lint = lintWith(cfg);
  assert.match(lint({ level: 'same' }), /same model family/);
  assert.doesNotMatch(lint({ level: 'other' }), /same model family/);
});

// ---------- AC4 ----------

test('0660 AC4: a stand-in on builder_bench gets neither the level\'s model nor its effort', () => {
  const t = launched({ level: 'graphics' }, GRAPHICS);
  for (const agent of ['claude', 'cursor', 'deepseek']) {
    const w = buildPlan(GRAPHICS, standInTicket({ ...t, level: 'graphics' }, agent), yes, { providers: PROVIDERS }).words;
    assert.ok(!w.includes('gpt-x') && !w.includes('xhigh') && !w.some(x => x.includes('xhigh')), `${agent}: ${w.join(' ')}`);
  }
  assert.deepEqual(launchTicket({ id: '0001', builder: 'claude' }, true, () => ({ level: 'deep' }), CFG).builder_effort, '');
  // The stand-in is checked on its own model, not the level's: gpt-y would pass beside a Codex reviewer on gpt-x.
  const cfg = { ...CFG, builder_model: '', reviewer: 'codex', reviewer_model: 'gpt-x', levels: { y: { builder_model: 'gpt-y' } } };
  assert.deepEqual(standInFor(cfg, { level: 'y' }, { own: 'claude', ready: ['claude', 'codex', 'cursor'], held: a => a === 'claude', plan: () => ({}) }), { agent: 'cursor' });
});

// A repo whose ticket 0001 is at level deep, committed.
function deepRepo() {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^level: ""/m, 'level: "deep"'));
  r.g('commit', '-qam', 'level deep');
  return r;
}
const fmOf = r => parseTicket(fs.readFileSync(r.file, 'utf8')).fm;

test('0660 AC4: a build moved to builder_bench on a usage limit starts without the level\'s effort', () => {
  const r = deepRepo();
  assert.equal(fmOf(r).level, 'deep');
  const starts = [];
  const takeOver = buildTakeOver({ repo: r.dir, runs: () => r.dir, startBuild: (id, argv, cwd, s, f, rec) => starts.push({ argv, rec: JSON.parse(rec(1)) }),
    heldAgent: a => a === 'claude', readyAgents: () => ['claude', 'codex'], speak: () => {}, providers: () => [], installed: yes, record: () => ({ at: r.dir, branch: 'main' }) });
  const cfg = { ...loadConfig(r.dir), builder: 'claude', builder_effort: '', reviewer: 'claude-subagent', build_command: '' };
  const go = takeOver('claude', '0001', {}, { cfg }, { resets: null });
  assert.equal(typeof go, 'function');
  go();
  assert.equal(starts[0].argv[0], 'codex');
  assert.equal(effortOf(starts[0].argv), null, starts[0].argv.join(' '));
  assert.equal(starts[0].rec.ticket_builder_effort, undefined);
});

test('0660 AC4: recording a stand-in or a take-over as the ticket\'s builder clears its level, so no later build gives the level\'s values', () => {
  const r = deepRepo();
  const cfg = { ...loadConfig(r.dir), builder: 'claude', builder_effort: '', build_command: '' };
  assert.equal(recordBuilder(r.dir, cfg, '0001', 'codex'), null);
  const fm = fmOf(r);
  assert.deepEqual([fm.builder, fm.level], ['codex', '']);
  assert.match(fs.readFileSync(r.file, 'utf8'), /^level: ""\s+# blank:/m, 'its comment kept');
  assert.equal(effortOf(words(fm, cfg)), null, 'a later fresh build');
  const r2 = deepRepo();
  fs.appendFileSync(r2.file, '\n## Notes\n- Shaped by hand.\n');
  r2.g('commit', '-qam', 'notes');
  const done = recordTakeOver(r2.dir, cfg, '0001', 'codex', '- Builder: Codex took over.');
  assert.equal(done.why, undefined, done.why);
  assert.equal(fmOf(r2).level, '');
});

// ---------- AC5 ----------

test('0660 AC5: a new ticket has a blank level line saying what blank means, and speck init\'s config lists the three levels', () => {
  const r = panelRepo();
  const raw = fs.readFileSync(r.file, 'utf8');
  assert.equal(parseTicket(raw).fm.level, '');
  assert.match(raw, /^level: ""\s+# blank: \S/m);
  assert.deepEqual(parseConfig(fs.readFileSync(`${r.dir}/speck/config.yml`, 'utf8')).levels, DEFAULT_LEVELS);
});

test('0660 AC5: the brief has a Build levels paragraph naming levels: and the command that sets a ticket\'s level', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const para = brief.split('\n').find(l => l.includes('**Build levels.**')) ?? '';
  for (const fact of ['`levels:`', '`speck set <id> level <name>`', '`quick`', '`balanced`', '`deep`']) assert.ok(para.includes(fact), fact);
});

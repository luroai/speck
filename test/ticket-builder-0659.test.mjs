// 0659: a ticket's own builder_model and builder_effort, in place of the settings', for each build of it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { parseTicket, loadConfig } from '../scripts/speck.mjs';
import { buildPlan, launchPlan, standInTicket, launchTicket } from '../scripts/ticket-builder.mjs';
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
const after = (words, flag) => words[words.lastIndexOf(flag) + 1];
const flags = (words, flag) => words.filter(w => w === flag).length;
const plan = (t, cfg = CFG) => buildPlan(cfg, { id: '0001', ...t }, yes, { providers: PROVIDERS });
const resume = (rec, cfg = CFG, words = []) => resumeFor(words, cfg, '0001', { session: 'abc', ...rec }, 'carry on', PROVIDERS).argv;
const effortOf = words => words.find(w => /^model_reasoning_effort=/.test(w)) ?? (words.includes('--effort') ? after(words, '--effort') : null);

// ---------- AC1 ----------

test('0659 AC1: a ticket\'s builder_model is passed to each builder in that builder\'s own way, in place of the settings\'', () => {
  const claude = plan({ builder_model: 'sonnet' }).words;
  assert.equal(after(claude, '--model'), 'sonnet');
  assert.equal(flags(claude, '--model'), 1, 'in place of the settings\' opus');
  assert.equal(after(plan({ builder: 'codex', builder_model: 'gpt-x' }).words, '-m'), 'gpt-x', 'Codex, though the settings name Claude Code');
  assert.equal(after(plan({ builder: 'cursor', builder_model: 'cur-1' }).words, '--model'), 'cur-1');
  assert.equal(after(plan({ builder: 'deepseek', builder_model: 'deepseek-v4-flash' }).words, '--model'), 'deepseek-v4-flash');
  assert.equal(after(plan({ builder: 'codex', builder_model: 5 }).words, '-m'), '5', 'a number read as YAML gives it');
});

test('0659 AC1: a blank or missing ticket value gives the command speck gives today', () => {
  for (const builder of ['claude', 'codex', 'cursor', 'deepseek']) {
    const today = plan({ builder }).words;
    assert.deepEqual(plan({ builder, builder_model: '', builder_effort: '' }).words, today, builder);
    assert.deepEqual(plan({ builder, builder_model: '  ', builder_effort: null }).words, today, builder);
  }
  assert.equal(after(plan({}).words, '--model'), 'opus', 'the settings\' value for their own builder');
  assert.ok(!plan({ builder: 'codex' }).words.includes('-m'), 'and none for another builder, as today');
});

test('0659 AC1: speck run keeps the ticket\'s values in its run record, and resumes and hands back on them', () => {
  const p = launchPlan(CFG, { id: '0001', builder: 'codex', builder_model: 'gpt-x', builder_effort: 'low' }, { command: '', words: [], repo: null, failed: new Map(), installed: yes });
  assert.deepEqual(p.record, { ticket_builder_model: 'gpt-x', ticket_builder_effort: 'low' });
  assert.deepEqual(launchPlan(CFG, { id: '0001' }, { command: '', words: [], repo: null, failed: new Map(), installed: yes }).record, {}, 'nothing kept for a blank ticket');
  const rec = { ticket_builder_model: 'sonnet' };
  assert.equal(after(resume({ ...rec, agent: 'claude' }), '--model'), 'sonnet');
  assert.equal(flags(resume({ ...rec, agent: 'claude' }), '--model'), 1);
  assert.equal(after(resume({ ticket_builder_model: 'gpt-x', agent: 'codex' }), '-m'), 'gpt-x', 'Codex, though the settings name Claude Code');
  assert.equal(after(resume({ ticket_builder_model: 'deepseek-v4-flash', agent: 'deepseek' }), '--model'), 'deepseek-v4-flash');
  assert.equal(after(resume({ agent: 'claude' }), '--model'), 'opus', 'a record without one resumes as today');
  assert.ok(!resume({ agent: 'codex' }).includes('-m'));
});

test('0659 AC1: speck run launches a ticket on the values its own frontmatter gives, not the board\'s builder_model', () => {
  const board = { id: '0001', builder: 'claude', builder_model: 'opus', builder_effort: '' }; // the board gives the model its builds run on
  assert.deepEqual(launchTicket(board, false, () => ({ builder_model: 'sonnet', builder_effort: 'max' })), { ...board, builder_model: 'sonnet', builder_effort: 'max' });
  assert.deepEqual(launchTicket(board, false, () => ({})), { ...board, builder_model: '', builder_effort: '' }, 'blank: the settings\' at build time');
  assert.deepEqual(launchTicket(board, false, () => { throw new Error('gone'); }), { ...board, builder_model: '', builder_effort: '' });
  assert.deepEqual(launchTicket({ ...board, builder: 'codex' }, true, () => ({ builder_model: 'sonnet' })), { ...board, builder: 'codex', builder_model: '', builder_effort: '' }, 'a stand-in: none');
});

test('0659 AC1: with a build_command written by hand, a Claude Code ticket\'s model replaces the settings\' --model', () => {
  const cfg = { ...CFG, build_command: 'claude -p "/speck-build {id}" --session-id {session} --model opus' };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}', '--model', 'opus'];
  const p = launchPlan(cfg, { id: '0001', builder_model: 'sonnet' }, { command: cfg.build_command, words, repo: null, failed: new Map(), installed: yes });
  assert.equal(after(p.words, '--model'), 'sonnet');
  assert.equal(flags(p.words, '--model'), 1);
  assert.deepEqual(launchPlan(cfg, { id: '0001' }, { command: cfg.build_command, words, repo: null, failed: new Map(), installed: yes }).words, words, 'blank: as today');
  assert.equal(after(resume({ ticket_builder_model: 'sonnet' }, cfg, words), '--model'), 'sonnet');
});

// ---------- AC2 ----------

test('0659 AC2: a ticket\'s builder_effort goes to Claude Code and Codex in place of the settings\', and not to Cursor or a provider', () => {
  const claude = plan({ builder_effort: 'max' }).words;
  assert.equal(after(claude, '--effort'), 'max');
  assert.equal(flags(claude, '--effort'), 1);
  assert.equal(effortOf(plan({ builder: 'codex', builder_effort: 'ultra' }).words), 'model_reasoning_effort="ultra"');
  assert.equal(effortOf(plan({ builder: 'cursor', builder_effort: 'max' }).words), null);
  assert.equal(effortOf(plan({ builder: 'deepseek', builder_effort: 'max' }).words), null);
  assert.equal(after(resume({ agent: 'claude', ticket_builder_effort: 'low' }), '--effort'), 'low');
  assert.equal(effortOf(resume({ agent: 'codex', ticket_builder_effort: 'low' })), 'model_reasoning_effort="low"');
  assert.equal(effortOf(resume({ agent: 'deepseek', ticket_builder_effort: 'low' })), null);
});

test('0659 AC2: speck check refuses a ticket builder_effort the settings would refuse, naming it', () => {
  const r = panelRepo();
  const cfg = loadConfig(r.dir), t = parseTicket(fs.readFileSync(r.file, 'utf8'));
  const lint = fm => lintTicket({ ...t, fm: { ...t.fm, ...fm } }, cfg).errors.join('\n');
  assert.match(lint({ builder_effort: 'turbo' }), /builder_effort "turbo" in ticket/);
  assert.doesNotMatch(lint({ builder_effort: 'max' }), /builder_effort/);
  assert.doesNotMatch(lint({ builder_effort: '' }), /builder_effort/);
});

// ---------- AC3 ----------

test('0659 AC3: the same-model check and the board use the ticket\'s builder_model', () => {
  const cfg = { builder: 'claude', reviewer: 'claude-subagent', allow_same_model_review: false, reviewer_model: 'opus', build_command: '' };
  assert.match(ticketSameModelProblem({ builder_model: 'opus' }, cfg) ?? '', /"opus"/);
  assert.equal(ticketSameModelProblem({ builder_model: 'sonnet' }, cfg), null);
  assert.equal(ticketSameModelProblem({ builder_model: 'sonnet' }, { ...cfg, builder_model: 'opus' }), null, 'the ticket\'s, not the settings\'');
  const r = panelRepo();
  const t = parseTicket(fs.readFileSync(r.file, 'utf8')), lcfg = { ...loadConfig(r.dir), ...cfg };
  const lint = fm => lintTicket({ ...t, fm: { ...t.fm, ...fm } }, lcfg).errors.join('\n');
  assert.match(lint({ builder_model: 'opus' }), /same model family/);
  assert.doesNotMatch(lint({ builder_model: 'sonnet' }), /same model family/);
  assert.equal(ticketBuilderModel({ builder_model: 'sonnet' }, CFG, PROVIDERS), 'sonnet');
  assert.equal(ticketBuilderModel({ builder: 'codex', builder_model: 'gpt-x' }, CFG, PROVIDERS), 'gpt-x');
  assert.equal(ticketBuilderModel({}, CFG, PROVIDERS), 'opus');
  assert.equal(ticketBuilderModel({ builder: 'codex' }, CFG, PROVIDERS), null);
});

// ---------- AC4 ----------

test('0659 AC4: a stand-in on builder_bench gets neither the ticket\'s builder_model nor its builder_effort', () => {
  const t = { id: '0001', builder: 'claude', builder_model: 'opus', builder_effort: 'max' };
  for (const agent of ['codex', 'cursor', 'deepseek']) {
    const words = buildPlan(CFG, standInTicket(t, agent), yes, { providers: PROVIDERS }).words;
    assert.ok(!words.includes('opus') && !words.includes('max') && effortOf(words) === null, `${agent}: ${words.join(' ')}`);
  }
  const p = launchPlan(CFG, standInTicket(t, 'codex'), { command: '', words: [], repo: null, failed: new Map(), installed: yes });
  assert.deepEqual(p.record, {});
  // The same-model check for the stand-in isn't judged on the model meant for the ticket's own builder.
  // With the ticket's gpt-y, a Codex stand-in would pass beside a Codex reviewer on gpt-x, but it runs Codex's default.
  const cfg = { ...CFG, builder_model: '', reviewer: 'codex', reviewer_model: 'gpt-x' };
  assert.deepEqual(standInFor(cfg, { builder_model: 'gpt-y' }, { own: 'claude', ready: ['claude', 'codex', 'cursor'], held: a => a === 'claude', plan: () => ({}) }), { agent: 'cursor' });
});

test('0659 AC4: a build moved to builder_bench on a usage limit starts without the ticket\'s builder_model or builder_effort', () => {
  const r = ownRepo();
  assert.equal(fmOf(r).builder_model, 'opus');
  const starts = [];
  const takeOver = buildTakeOver({ repo: r.dir, runs: () => r.dir, startBuild: (id, argv, cwd, s, f, rec) => starts.push({ argv, rec: JSON.parse(rec(1)) }),
    heldAgent: a => a === 'claude', readyAgents: () => ['claude', 'codex'], speak: () => {}, providers: () => [], installed: yes, record: () => ({ at: r.dir, branch: 'main' }) });
  const cfg = { ...loadConfig(r.dir), builder: 'claude', reviewer: 'claude-subagent', build_command: '' };
  const go = takeOver('claude', '0001', {}, { cfg }, { resets: null });
  assert.equal(typeof go, 'function');
  go();
  const argv = starts[0].argv;
  assert.equal(argv[0], 'codex');
  assert.ok(!argv.includes('-m') && effortOf(argv) === null, argv.join(' '));
  assert.equal(starts[0].rec.ticket_builder_model, undefined);
});

// A repo whose ticket 0001 names its own builder_model and builder_effort, committed.
function ownRepo(o = {}) {
  const r = panelRepo(o);
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^builder_model: ""/m, 'builder_model: "opus"').replace(/^builder_effort: ""/m, 'builder_effort: "max"'));
  r.g('commit', '-qam', 'ticket model');
  return r;
}
const fmOf = r => parseTicket(fs.readFileSync(r.file, 'utf8')).fm;

test('0659 AC4: recording a stand-in as the ticket\'s builder clears its own model and effort, so no later build, resume or board gives them', () => {
  const r = ownRepo();
  const cfg = { ...loadConfig(r.dir), builder: 'claude', build_command: '' };
  assert.equal(recordBuilder(r.dir, cfg, '0001', 'codex'), null);
  const fm = fmOf(r);
  assert.equal(fm.builder, 'codex');
  assert.equal(fm.builder_model, '');
  assert.equal(fm.builder_effort, '');
  assert.equal(r.g('status', '--porcelain'), '', 'committed');
  assert.equal(ticketBuilderModel(fm, cfg, PROVIDERS), null, 'the board gives Codex its own default');
  const later = buildPlan(cfg, launchTicket({ id: '0001', builder: 'codex' }, false, () => fm), yes, { providers: PROVIDERS }).words;
  assert.ok(!later.includes('-m') && effortOf(later) === null, `a later fresh build: ${later.join(' ')}`);
});

test('0659 AC4: recording a take-over clears the ticket\'s own model and effort too', () => {
  const r = ownRepo();
  fs.appendFileSync(r.file, '\n## Notes\n- Shaped by hand.\n');
  r.g('commit', '-qam', 'notes');
  const cfg = { ...loadConfig(r.dir), builder: 'claude' };
  const done = recordTakeOver(r.dir, cfg, '0001', 'codex', '- Builder: Codex took over.');
  assert.equal(done.why, undefined, done.why);
  const fm = fmOf(r);
  assert.deepEqual([fm.builder, fm.builder_model, fm.builder_effort], ['codex', '', '']);
  assert.match(fs.readFileSync(r.file, 'utf8'), /^builder_model: ""\s+# blank:/m, 'its comment kept');
});

test('0659 AC4: a ticket without its own values is recorded as before, with no lines added', () => {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^builder_(model|effort): .*\n/gm, ''));
  r.g('commit', '-qam', 'old ticket');
  assert.equal(recordBuilder(r.dir, loadConfig(r.dir), '0001', 'codex'), null);
  assert.doesNotMatch(fs.readFileSync(r.file, 'utf8'), /^builder_(model|effort):/m);
});

// ---------- AC5 ----------

test('0659 AC5: a new ticket has blank builder_model and builder_effort lines, each saying what blank means', () => {
  const r = panelRepo();
  const raw = fs.readFileSync(r.file, 'utf8'), fm = parseTicket(raw).fm;
  assert.equal(fm.builder_model, '');
  assert.equal(fm.builder_effort, '');
  assert.match(raw, /^builder_model: ""\s+# blank: \S/m);
  assert.match(raw, /^builder_effort: ""\s+# blank: \S/m);
});

test('0659 AC5: the brief\'s Builder model and Builder effort paragraphs say a ticket\'s own value overrides the settings\'', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  for (const [name, key] of [['Builder model', 'builder_model'], ['Builder effort', 'builder_effort']]) {
    const para = brief.split('\n').find(l => l.startsWith(`**${name}.**`)) ?? '';
    assert.ok(para.includes(`ticket's own \`${key}\``), `${name}: names the ticket's own ${key}`);
    assert.match(para, /overrides the settings'/, name);
  }
});

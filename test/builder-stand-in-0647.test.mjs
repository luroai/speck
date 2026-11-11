// 0647: while the builder's agent is held by a usage limit, speck run starts each new build on the first agent on
// builder_bench that's ready and not limited.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { parseTicket, loadConfig } from '../scripts/speck.mjs';
import { standInFor, recordBuilder, builderStandIn } from '../scripts/builder-stand-in.mjs';
import { buildPlan, launchPlan } from '../scripts/ticket-builder.mjs';

Object.assign(process.env, gitEnv); // recordBuilder commits in this process

const CFG = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude', reviewer: 'claude-subagent', build_command: '', builder_model: 'opus', builder_effort: 'high' };
const everyone = () => true;
const plan = cfg => a => buildPlan(cfg, { id: '0001', builder: a }, everyone);
const pickOn = (cfg, { ready = ['claude', 'codex', 'cursor'], held = a => a === 'claude', fm = {} } = {}) =>
  standInFor(cfg, fm, { own: 'claude', ready, held, plan: plan(cfg) });

// speck run's side over a stand-in record and a clock of which agents are held.
function running({ cfg = CFG, ready = ['claude', 'codex', 'cursor'], recordWhy = null } = {}) {
  const s = { held: new Set(['claude']), said: [], recorded: [] };
  s.q = builderStandIn({ repo: '/nowhere', heldAgent: a => s.held.has(a), readyAgents: () => ready, speak: t => s.said.push(t), fmOf: () => ({}),
    providers: () => [], installed: everyone, record: (repo, c, id, agent) => { s.recorded.push([id, agent]); return recordWhy; } });
  s.pick = id => s.q.pick(cfg, cfg.build_command, { id, builder: 'claude' });
  return s;
}

// ---------- AC1 ----------

test('0647 AC1: the first agent on builder_bench that is ready and not held takes the build', () => {
  assert.deepEqual(pickOn(CFG), { agent: 'codex' }); // blank bench: your agents in order, without the builder's own
  assert.deepEqual(pickOn({ ...CFG, builder_bench: 'cursor, codex' }), { agent: 'cursor' });
  assert.deepEqual(pickOn(CFG, { ready: ['claude', 'cursor'] }), { agent: 'cursor' }); // codex isn't installed and signed in
  assert.deepEqual(pickOn(CFG, { held: a => a === 'claude' || a === 'codex' }), { agent: 'cursor' }); // codex is limited too
  assert.deepEqual(pickOn({ ...CFG, builder_bench: 'cursor' }, { ready: ['claude', 'codex'] }).agent, undefined);
});

test('0647 AC1: speck run records the stand-in on the ticket and starts it with that agent\'s own command', () => {
  const s = running();
  assert.equal(s.pick('0001'), 'codex');
  assert.deepEqual(s.recorded, [['0001', 'codex']]);
  const p = launchPlan(CFG, { id: '0001', builder: 'codex' }, { command: '', words: ['claude', '-p', '/speck-build {id}'], repo: null, failed: new Map(), installed: everyone });
  assert.equal(p.agent, 'codex');
  assert.equal(p.words[0], 'codex');
  assert.ok(p.words.includes('$speck-build {id}'));
  s.held.clear();
  assert.equal(s.pick('0002'), null); // not held: it starts on the builder as usual
});

test('0647 AC1: recordBuilder commits the ticket\'s builder on the base branch', () => {
  const r = panelRepo();
  const cfg = loadConfig(r.dir), before = r.g('rev-parse', 'HEAD');
  assert.equal(recordBuilder(r.dir, cfg, '0001', 'codex'), null);
  assert.equal(parseTicket(fs.readFileSync(r.file, 'utf8')).fm.builder, 'codex');
  assert.notEqual(r.g('rev-parse', 'HEAD'), before);
  assert.match(r.g('log', '-1', '--format=%s'), /^speck\(0001\): builder codex while the builder is limited$/);
  assert.equal(r.g('status', '--porcelain'), '');
  const head = r.g('rev-parse', 'HEAD');
  assert.equal(recordBuilder(r.dir, cfg, '0001', 'codex'), null); // already recorded: nothing to commit
  assert.equal(r.g('rev-parse', 'HEAD'), head);
});

test('0647 AC1: off the base branch, recordBuilder changes nothing and says why', () => {
  const r = panelRepo();
  r.g('checkout', '-q', '-b', 'elsewhere');
  const text = fs.readFileSync(r.file, 'utf8');
  assert.match(recordBuilder(r.dir, loadConfig(r.dir), '0001', 'codex'), /is on elsewhere, not main/);
  assert.equal(fs.readFileSync(r.file, 'utf8'), text);
});

test('0647 AC1: a ticket whose builder can\'t be recorded waits, said once', () => {
  const s = running({ recordWhy: 'its ticket couldn\'t be committed (locked)' });
  assert.equal(s.pick('0001'), false);
  assert.equal(s.pick('0001'), false);
  assert.equal(s.said.length, 1);
  assert.match(s.said[0], /0001 can't start on Codex: its ticket couldn't be committed \(locked\)\. It waits for the limit to reset\./);
});

// ---------- AC2 ----------

test('0647 AC2: builder_model and builder_effort aren\'t passed to a bench agent', () => {
  for (const agent of ['codex', 'cursor']) {
    const { words } = buildPlan(CFG, { id: '0001', builder: agent }, everyone);
    assert.ok(!words.includes('opus') && !words.some(w => /high/.test(w)), `${agent}: ${words.join(' ')}`);
  }
});

test('0647 AC2: an agent of the reviewer\'s family is skipped, as the review would refuse it', () => {
  const codexReviews = { ...CFG, reviewer: 'codex' };
  assert.deepEqual(pickOn(codexReviews), { agent: 'cursor' });
  assert.deepEqual(pickOn(codexReviews, { fm: { reviewer: 'claude-subagent' } }), { agent: 'codex' }); // the ticket's own reviewer
  assert.deepEqual(pickOn({ ...codexReviews, allow_same_model_review: true }), { agent: 'codex' });
  assert.equal(pickOn({ ...codexReviews, builder_bench: 'codex' }).agent, undefined);
});

// ---------- AC3 ----------

test('0647 AC3: the move is said once per limit, and the move back once when it resets', () => {
  const s = running();
  s.pick('0001'); s.pick('0002'); s.q.check();
  assert.equal(s.said.length, 1);
  assert.match(s.said[0], /^Claude's usage limit is reached, so new builds start on Codex, the first agent on builder_bench that's ready and free, until it resets\.$/);
  s.held.clear();
  s.q.check(); s.q.check();
  assert.deepEqual(s.said.slice(1), ['Claude\'s usage limit has reset, so new builds start on Claude again.']);
  s.held.add('claude'); // the next limit is said again
  s.pick('0003');
  assert.equal(s.said.length, 3);
});

// ---------- AC4 ----------

test('0647 AC4: with no agent on the bench ready and free, builds wait for the reset', () => {
  const s = running({ ready: ['claude'] });
  assert.equal(s.pick('0001'), false);
  assert.deepEqual(s.recorded, []);
  s.held = new Set(['claude', 'codex', 'cursor']);
  const all = running();
  all.held = s.held;
  assert.equal(all.pick('0001'), false);
  assert.deepEqual(all.said, []);
});

test('0647 AC4: a ticket built by another agent that is held waits for that agent', () => {
  const s = running();
  s.held = new Set(['codex']);
  assert.equal(s.q.pick(CFG, '', { id: '0001', builder: 'codex' }), false);
  assert.deepEqual(s.recorded, []);
});

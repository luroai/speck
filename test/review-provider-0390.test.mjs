import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { providerRepo, KEY } from './support/provider-reviewer.mjs';
import { after } from './support/claude-reviewer.mjs';
import { PROVIDERS, findProvider } from '../scripts/providers.mjs';
import { reviewerOptions } from '../scripts/reviewers.mjs';
import { providerEnv, providerReady } from '../scripts/provider-review.mjs';
import { saveProviderKey } from '../scripts/keys.mjs';
import { sameModelProblem } from '../scripts/same-model.mjs';
import { modelFamily } from '../scripts/core.mjs';
import { doctorChecks } from '../scripts/install.mjs';

// ---------- 0390: review with DeepSeek ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEEPSEEK = findProvider('deepseek');

test('0390 AC1: reviewer deepseek runs Claude Code read-only on DeepSeek\'s default model, without reviewer_effort, and records the round as deepseek', () => {
  const r = providerRepo({ ticketFields: 'reviewer_effort: high' });
  const res = r.review();
  assert.equal(res.status, 10, res.stderr);
  const [call] = r.calls();
  assert.ok(call.args.includes('--bare'));
  assert.ok(call.args.includes('-p'));
  assert.equal(after(call.args, '--permission-mode'), 'dontAsk');
  assert.ok(call.args.includes('--setting-sources='));
  assert.deepEqual(after(call.args, '--disallowedTools').split(/[\s,]+/).sort(), ['Edit', 'NotebookEdit', 'Write']);
  assert.equal(after(call.args, '--model'), 'deepseek-v4-pro');
  assert.ok(!call.args.includes('--effort'), 'reviewer_effort isn\'t passed');
  assert.ok(!call.args.some(a => /bypass|dangerously/i.test(a)));
  assert.equal(call.stdin.trimEnd(), r.run('prompt', '1').stdout.trimEnd());
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'deepseek');
  assert.equal(r1.meta.thread_id, 'DS1');
  assert.equal(r1.verdict.findings[0].id, 'F1');
});

test('0390 AC1: reviewer_model picks DeepSeek\'s model, and later rounds continue the same session', () => {
  const r = providerRepo({ ticketFields: 'reviewer_model: deepseek-v4-flash' });
  assert.equal(r.review().status, 10);
  const res = r.secondRound();
  assert.equal(res.status, 10, res.stderr);
  const [first, second] = r.calls();
  assert.equal(after(first.args, '--model'), 'deepseek-v4-flash');
  assert.equal(after(second.args, '--model'), 'deepseek-v4-flash');
  assert.equal(after(second.args, '--resume'), 'DS1');
  assert.ok(second.args.includes('--bare') && second.args.includes('--setting-sources='), 'still read-only when resumed');
  assert.equal(second.env.CLAUDE_CONFIG_DIR, first.env.CLAUDE_CONFIG_DIR, 'the session is kept where the resumed run looks');
  assert.doesNotMatch(second.stdin, /# Earlier review rounds/);
  assert.equal(r.roundFile(2).meta.session, 'continued');
  assert.equal(r.roundFile(2).meta.reviewer_model, 'deepseek-v4-flash');
});

test('0390 AC2: the reviewer gets DeepSeek\'s address and key, and none of speck\'s own sign-ins, settings or connectors', () => {
  const r = providerRepo();
  const mine = { ANTHROPIC_AUTH_TOKEN: 'mine-1', ANTHROPIC_BASE_URL: 'https://example.invalid', CLAUDE_CODE_OAUTH_TOKEN: 'mine-2',
    CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_USE_VERTEX: '1', AWS_ACCESS_KEY_ID: 'mine-3', GOOGLE_APPLICATION_CREDENTIALS: '/mine',
    CLAUDE_CONFIG_DIR: path.join(os.homedir(), '.claude'), OPENAI_API_KEY: 'mine-4', GH_TOKEN: 'mine-5' };
  assert.equal(r.review(mine).status, 10);
  const { env, args } = r.calls()[0];
  assert.equal(env.ANTHROPIC_BASE_URL, 'https://api.deepseek.com/anthropic');
  assert.equal(env.ANTHROPIC_API_KEY, KEY);
  for (const k of ['ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'AWS_ACCESS_KEY_ID', 'GOOGLE_APPLICATION_CREDENTIALS', 'OPENAI_API_KEY', 'GH_TOKEN'])
    assert.equal(env[k], undefined, k);
  assert.ok(!Object.values(env).some(v => /^mine-/.test(v)), 'nothing of speck\'s own sign-ins');
  // Every model it could ask for is DeepSeek's, so nothing goes to a model only Anthropic serves.
  for (const k of ['ANTHROPIC_MODEL', 'ANTHROPIC_SMALL_FAST_MODEL', 'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL', 'ANTHROPIC_DEFAULT_HAIKU_MODEL'])
    assert.equal(env[k], 'deepseek-v4-pro', k);
  assert.equal(env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1', 'no telemetry or other requests to Anthropic');
  // Its own home and Claude Code folder, inside the repo's ignored cache, never the user's.
  const own = path.join(r.dir, 'speck', '.cache', 'provider-deepseek');
  assert.equal(env.HOME, own);
  assert.ok(env.CLAUDE_CONFIG_DIR.startsWith(own + path.sep));
  assert.equal(fs.statSync(own).mode & 0o077, 0, 'only its owner can read it');
  assert.ok(args.includes('--strict-mcp-config'), 'no MCP servers or connectors');
  assert.ok(!args.some(a => a.includes(KEY)), 'the key is never on the command line');
});

test('0390 AC3: with no DeepSeek key, the round fails before it starts, saying how to set one, and records nothing', () => {
  const r = providerRepo({ key: '' });
  const before = fs.readFileSync(r.ticketFile, 'utf8');
  const res = r.review();
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stderr, /no DeepSeek API key/);
  assert.match(res.stderr, /speck keys set deepseek/);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.deepEqual(r.calls(), [], 'the reviewer never ran');
  assert.equal(fs.readFileSync(r.ticketFile, 'utf8'), before, 'nothing recorded');
});

test('0390 AC3: without Claude Code installed, the round fails saying DeepSeek reviews need it, and records nothing', () => {
  const r = providerRepo();
  fs.rmSync(path.join(r.bin, 'claude'));
  fs.symlinkSync(spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim(), path.join(r.bin, 'git'));
  const before = fs.readFileSync(r.ticketFile, 'utf8');
  const res = r.review({ PATH: r.bin });
  assert.equal(res.status, 1, res.stdout);
  assert.match(res.stderr, /DeepSeek reviews need Claude Code installed/);
  assert.doesNotMatch(res.stderr, /\n\s+at /);
  assert.equal(fs.readFileSync(r.ticketFile, 'utf8'), before);
});

test('0390 AC3: speck doctor checks Claude Code and the DeepSeek key when DeepSeek reviews', () => {
  const r = providerRepo({ key: '' });
  const saved = process.env.PATH;
  const rows = () => doctorChecks(r.dir, { builder: 'claude', reviewer: 'deepseek' });
  const claude = () => rows().find(c => /DeepSeek reviews need it installed/.test(c.name));
  const key = () => rows().find(c => /DeepSeek API key/.test(c.name));
  try {
    process.env.PATH = r.bin;
    assert.equal(claude().ok, true);
    assert.equal(key().ok, false);
    assert.match(key().fix, /speck keys set deepseek/);
    saveProviderKey(r.dir, 'deepseek', KEY);
    assert.equal(key().ok, true);
    process.env.PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-'));
    assert.equal(claude().ok, false);
    assert.match(claude().fix, /Claude Code/);
  } finally { process.env.PATH = saved; }
  assert.equal(doctorChecks(r.dir, { builder: 'claude', reviewer: 'codex' }).some(c => /DeepSeek/.test(c.name)), false, 'only when DeepSeek reviews');
});

test('0390 AC4: DeepSeek is a family of its own, so any builder may be reviewed by it', () => {
  assert.notEqual(modelFamily('deepseek'), modelFamily('claude'));
  for (const builder of ['claude', 'codex', 'cursor', 'gemini'])
    for (const model of ['', 'deepseek-v4-pro']) assert.equal(sameModelProblem(builder, 'deepseek', { builder_model: '' }, model), null, `${builder} ${model}`);
  const r = providerRepo({ ticketFields: 'reviewer: deepseek' });
  assert.equal(r.review().status, 10, 'a claude builder\'s ticket is reviewed without allow_same_model_review');
});

test('0390 AC4: any provider in speck\'s list reviews the same way, checked with a provider of its own', () => {
  const acme = Object.freeze({ name: 'acme', label: 'Acme', address: 'https://acme.example/anthropic', models: ['acme-1'], defaultModel: 'acme-1' });
  const providers = [...PROVIDERS, acme];
  const ours = reviewerOptions({}, 'acme', providers), theirs = reviewerOptions({}, 'deepseek', providers);
  assert.equal(ours.provider, acme);
  for (const k of ['command', 'resume_command', 'session_id_path']) assert.equal(ours[k], theirs[k], k);
  assert.equal(reviewerOptions({}, 'acme').provider, undefined, 'only providers in the list');
  assert.equal(sameModelProblem('claude', 'acme', {}, ''), null);

  const r = providerRepo();
  assert.throws(() => providerReady(r.dir, acme, providers), /no Acme API key.*speck keys set acme/s);
  saveProviderKey(r.dir, 'acme', 'sk-acme', { providers });
  const saved = process.env.PATH;
  try { process.env.PATH = r.bin; assert.equal(providerReady(r.dir, acme, providers), 'sk-acme'); } finally { process.env.PATH = saved; }
  const env = providerEnv(r.dir, acme, 'sk-acme', 'acme-1', { PATH: '/bin', ANTHROPIC_AUTH_TOKEN: 'x' });
  assert.equal(env.ANTHROPIC_BASE_URL, acme.address);
  assert.equal(env.ANTHROPIC_API_KEY, 'sk-acme');
  assert.equal(env.ANTHROPIC_MODEL, 'acme-1');
  assert.equal(env.ANTHROPIC_AUTH_TOKEN, undefined);
  assert.equal(env.HOME, path.join(r.dir, 'speck', '.cache', 'provider-acme'));
});

// 0491: the README's names are checked in the brief instead (docs-0491).
test('0390 AC5: the brief\'s table of reviewers has a provider row', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `deepseek`'));
  assert.ok(row, 'a row for provider reviewers');
  assert.match(row, /--bare/);
  assert.match(row, /speck keys set deepseek/);
});

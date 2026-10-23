import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { runRepo, startRun, until, stopRun, killAll, record, ROOT } from './support/run.mjs';
import { fakeClaude, after } from './support/provider-builder.mjs';
import { T, fakePage, queueRows, round } from './support/panel.mjs';
import { findProvider } from '../scripts/providers.mjs';
import { saveProviderKey, removeProviderKey } from '../scripts/keys.mjs';
import { buildPlan, launchPlan } from '../scripts/ticket-builder.mjs';
import { resumeFor } from '../scripts/hand-back.mjs';
import { resumeCommandOf, resumeHint } from '../scripts/build-records.mjs';
import { providerStartWords, PROVIDER_SCRIPT, PROVIDER_BUILD, withoutProviderBuild } from '../scripts/provider-build.mjs';
import { runLimited } from '../scripts/reviewers.mjs';
import { doctorChecks } from '../scripts/install.mjs';
import { statusData } from '../scripts/speck.mjs';
import { DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';
import { splitCommand } from '../scripts/reviewers.mjs';

// ---------- 0391: build with DeepSeek ----------

const DEEPSEEK = findProvider('deepseek');
const KEY = 'sk-0391-secret-Qp27x';
const ACME = Object.freeze({ name: 'acme', label: 'Acme', address: 'http://127.0.0.1:9/acme', models: ['acme-1', 'acme-2'], defaultModel: 'acme-1' });
const ACME_KEY = 'sk-acme-0391-Zz9';
const yes = () => true;
// What the user's own environment might hold that would sign Claude Code in elsewhere, or point it at another folder.
const MINE = { ANTHROPIC_AUTH_TOKEN: 'mine-1', ANTHROPIC_API_KEY: 'mine-2', ANTHROPIC_BASE_URL: 'https://example.invalid', CLAUDE_CODE_OAUTH_TOKEN: 'mine-3',
  CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_USE_VERTEX: '1', AWS_BEARER_TOKEN_BEDROCK: 'mine-4', CLAUDE_CONFIG_DIR: '/home/someone/.claude', ANTHROPIC_MODEL: 'opus' };

// A speck repo whose builder is `builder`, with build_command blank, builder_model `model` and this machine's DeepSeek
// key saved, unless `key` is false.
function providerRepo({ builder = 'deepseek', model = '', key = true, tickets = [['0001', { builder: 'deepseek' }]] } = {}) {
  const r = runRepo({ tickets, command: null });
  const text = fs.readFileSync(r.cfgFile, 'utf8').replace(/^builder:.*$/m, `builder: ${builder}`).replace(/^builder_model:.*$/m, '');
  fs.writeFileSync(r.cfgFile, `${text}build_command: ""\nbuilder_model: "${model}"\n`);
  r.g('commit', '-qam', 'builder');
  if (key) saveProviderKey(r.dir, 'deepseek', KEY);
  return r;
}
// Runs a provider build's words as speck run would, {id} and {session} filled in, in `cwd`, with `env` over the test's own.
const fill = (words, id, session) => words.map(w => w.replace(/\{id\}/g, id).replace(/\{session\}/g, session));
const wrap = (words, cwd, env = {}) => spawnSync(words[0], words.slice(1), { cwd, encoding: 'utf8', env: { ...process.env, ...env } });

test('0391 AC1: a deepseek ticket is built through Claude Code on DeepSeek\'s default model, or builder_model, as /speck-build', () => {
  const cfg = { builder: 'deepseek', build_command: '', builder_model: '' };
  const plan = buildPlan(cfg, { id: '0001', builder: 'deepseek' }, yes);
  assert.equal(plan.agent, 'deepseek');
  assert.deepEqual(plan.words.slice(0, 4), [process.execPath, PROVIDER_SCRIPT, 'deepseek', 'https://api.deepseek.com/anthropic']);
  const claude = plan.words.slice(4);
  assert.equal(claude[0], 'claude');
  for (const w of ['--setting-sources=project', '--strict-mcp-config', '--dangerously-skip-permissions']) assert.ok(claude.includes(w), w);
  // Not --bare: in -p mode it doesn't expand /speck-build, reads no CLAUDE.md and offers only Bash, Edit and Read.
  assert.ok(!claude.includes('--bare'));
  assert.equal(after(claude, '-p'), '/speck-build {id}');
  assert.equal(after(claude, '--session-id'), '{session}');
  assert.equal(after(claude, '--output-format'), 'stream-json');
  assert.equal(after(claude, '--model'), 'deepseek-v4-pro');
  assert.equal(after(buildPlan({ ...cfg, builder_model: 'deepseek-v4-flash' }, { builder: 'deepseek' }, yes).words, '--model'), 'deepseek-v4-flash');
  // builder_model is another builder's when the configured builder isn't DeepSeek, so DeepSeek's default is used.
  assert.equal(after(buildPlan({ builder: 'claude', build_command: DEFAULT_BUILD_COMMAND, builder_model: 'opus' }, { builder: 'deepseek' }, yes).words, '--model'), 'deepseek-v4-pro');
});

test('0391 AC1: a stopped or handed-back DeepSeek build resumes its own session through DeepSeek, and by hand the same way', () => {
  const cfg = { builder: 'claude', build_command: DEFAULT_BUILD_COMMAND, builder_model: 'opus' };
  const rec = { id: '0001', agent: 'deepseek', session: 'sess-1', cwd: '/r' };
  const { argv } = resumeFor(splitCommand(DEFAULT_BUILD_COMMAND), cfg, '0001', rec, 'carry on');
  const start = providerStartWords({ builder: 'deepseek', builder_model: '' }, DEEPSEEK);
  assert.deepEqual(argv, start.map(w => (w === '--session-id' ? '--resume' : w === '{session}' ? 'sess-1' : w.includes('{id}') ? 'carry on' : w)));
  assert.equal(after(argv, '--model'), 'deepseek-v4-pro', 'not the Claude Code builder_model');
  const own = resumeFor([], { builder: 'deepseek', build_command: '', builder_model: 'deepseek-v4-flash' }, '0001', rec, 'm').argv;
  assert.equal(after(own, '--model'), 'deepseek-v4-flash');
  // By hand: resume_command resumes Claude Code builds, so a DeepSeek build gets its own command, through DeepSeek.
  const byHand = resumeCommandOf({ resume_command: 'claude --resume {session}' }, 'deepseek');
  assert.ok(byHand.includes(PROVIDER_SCRIPT) && byHand.includes('--resume {session}') && byHand.includes('--strict-mcp-config'), byHand);
  assert.match(resumeHint({ resume_command: 'claude --resume {session}' }, rec), /provider-build\.mjs deepseek .*--resume sess-1/);
});

test('0391 AC1, AC2: speck run starts a deepseek ticket\'s build, records it as DeepSeek\'s, and Claude Code gets only DeepSeek\'s address and key', async () => {
  const r = providerRepo();
  const fake = fakeClaude();
  const run = startRun(r.dir, { PATH: fake.PATH, FAKE_MS: '3000', ...MINE });
  try {
    assert.ok(await until(() => fake.calls().length >= 1, 10000), run.out());
    const rec = record(r.dir, '0001'), [call] = fake.calls();
    assert.equal(rec.agent, 'deepseek', 'its run record names DeepSeek as the builder');
    assert.equal(rec.command[1], PROVIDER_SCRIPT);
    assert.equal(after(call.args, '-p'), '/speck-build 0001');
    assert.equal(after(call.args, '--session-id'), rec.session);
    assert.equal(after(call.args, '--model'), 'deepseek-v4-pro');
    assert.equal(call.cwd, r.dir, 'it starts in the repo, where Claude Code finds its CLAUDE.md, which imports AGENTS.md, and its skills');
    assert.ok(call.args.includes('--setting-sources=project') && !call.args.includes('--bare'));
    assert.match(fs.readFileSync(path.join(r.dir, 'CLAUDE.md'), 'utf8'), /@AGENTS\.md/);
    assert.equal(call.env.ANTHROPIC_BASE_URL, 'https://api.deepseek.com/anthropic');
    assert.equal(call.env.ANTHROPIC_API_KEY, KEY);
    assert.equal(call.env.SPECK_BUILD_SESSION, rec.session, 'its processes are found by its session, as any build\'s');
    assert.equal(call.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS, '1');
    assert.ok(!rec.command.some(w => w.includes(KEY)), 'the key is never on a command line');
    assert.ok(!fs.readFileSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.log'), 'utf8').includes(KEY));
    assert.ok(!Object.values(call.env).some(v => /^mine-/.test(v)), 'none of speck\'s own sign-ins');
  } finally { await stopRun(run); killAll(fake.calls().map(c => c.pid)); }
});

test('0391 AC2: the build\'s Claude Code gets DeepSeek\'s address and key, every model DeepSeek\'s, and a Claude Code folder of its own', () => {
  const r = providerRepo();
  const fake = fakeClaude();
  const words = fill(buildPlan({ builder: 'deepseek', build_command: '' }, { builder: 'deepseek' }, yes).words, '0001', 'sess-a');
  const res = wrap(words, r.dir, { PATH: fake.PATH, ...MINE, OPENAI_API_KEY: 'theirs', SPECK_BUILD_SESSION: 'sess-a' });
  assert.equal(res.status, 0, res.stderr);
  const { env, args } = fake.calls()[0];
  assert.equal(env.ANTHROPIC_BASE_URL, 'https://api.deepseek.com/anthropic');
  assert.equal(env.ANTHROPIC_API_KEY, KEY);
  for (const k of ['ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'AWS_BEARER_TOKEN_BEDROCK']) assert.equal(env[k], undefined, k);
  for (const k of ['ANTHROPIC_MODEL', 'ANTHROPIC_SMALL_FAST_MODEL', 'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL', 'ANTHROPIC_DEFAULT_HAIKU_MODEL'])
    assert.equal(env[k], 'deepseek-v4-pro', k);
  assert.equal(env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1', 'no telemetry or other requests to Anthropic');
  const own = path.join(r.dir, 'speck', '.cache', 'provider-deepseek');
  assert.ok(env.CLAUDE_CONFIG_DIR.startsWith(own + path.sep), 'never the user\'s Claude Code folder, with its sign-in, settings and connectors');
  assert.equal(fs.statSync(own).mode & 0o077, 0);
  assert.ok(args.includes('--strict-mcp-config') && args.includes('--setting-sources=project'), 'no user settings, MCP servers or connectors');
  assert.equal(env.OPENAI_API_KEY, 'theirs', 'what the build\'s own work needs, such as the reviewer\'s sign-in, is kept');
  assert.equal(env.SPECK_BUILD_SESSION, 'sess-a');
});

test('0391 AC1: a resumed build keeps its Claude Code folder, so its session is found', () => {
  const r = providerRepo();
  const fake = fakeClaude();
  const cfg = { builder: 'deepseek', build_command: '' };
  assert.equal(wrap(fill(buildPlan(cfg, { builder: 'deepseek' }, yes).words, '0001', 's1'), r.dir, { PATH: fake.PATH }).status, 0);
  const { argv } = resumeFor([], cfg, '0001', { agent: 'deepseek', session: 's1' }, 'go on');
  assert.equal(wrap(argv, r.dir, { PATH: fake.PATH }).status, 0);
  const [first, second] = fake.calls();
  assert.equal(after(second.args, '--resume'), 's1');
  assert.equal(after(second.args, '-p'), 'go on');
  assert.equal(second.env.CLAUDE_CONFIG_DIR, first.env.CLAUDE_CONFIG_DIR, 'the session is where the resumed build looks');
  assert.equal(second.env.ANTHROPIC_BASE_URL, 'https://api.deepseek.com/anthropic');
});

test('0391 AC1: the build ends as Claude Code does, with its exit code, and a stop ends Claude Code too', async () => {
  const r = providerRepo();
  const fake = fakeClaude();
  const words = fill(buildPlan({ builder: 'deepseek', build_command: '' }, { builder: 'deepseek' }, yes).words, '0001', 's2');
  assert.equal(wrap(words, r.dir, { PATH: fake.PATH, FAKE_EXIT: '3' }).status, 3);
  const child = spawn(words[0], words.slice(1), { cwd: r.dir, env: { ...process.env, PATH: fake.PATH, FAKE_MS: '20000' }, stdio: 'ignore' });
  const ended = new Promise(res => child.on('exit', (code, signal) => res({ code, signal })));
  try {
    assert.ok(await until(() => fake.calls().length >= 2, 8000));
    child.kill('SIGTERM');
    assert.equal((await ended).signal, 'SIGTERM');
    const pid = fake.calls()[1].pid;
    assert.ok(await until(() => { try { process.kill(pid, 0); return false; } catch { return true; } }, 5000), 'Claude Code ended with it');
  } finally { killAll([child.pid, ...fake.calls().map(c => c.pid)]); }
});

test('0391 AC2: a reviewer a DeepSeek build starts gets none of DeepSeek\'s address, key or Claude Code folder', () => {
  const build = { PATH: process.env.PATH, HOME: '/home/me', [PROVIDER_BUILD]: 'deepseek', ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic', ANTHROPIC_API_KEY: KEY,
    ANTHROPIC_MODEL: 'deepseek-v4-pro', CLAUDE_CONFIG_DIR: '/x/.claude', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' };
  const env = withoutProviderBuild(build);
  for (const k of [PROVIDER_BUILD, 'ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'CLAUDE_CONFIG_DIR', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC']) assert.equal(env[k], undefined, k);
  assert.equal(env.HOME, '/home/me');
  const plain = { PATH: '/bin', ANTHROPIC_API_KEY: 'mine' };
  assert.equal(withoutProviderBuild(plain), plain, 'outside a provider build, nothing changes');
  // runLimited, which starts every reviewer speck runs, uses it.
  const saved = { ...process.env };
  try {
    Object.assign(process.env, { [PROVIDER_BUILD]: 'deepseek', ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic', ANTHROPIC_API_KEY: KEY });
    const res = runLimited(process.execPath, ['-e', 'process.stdout.write(JSON.stringify(process.env))'], { cwd: ROOT, input: '', ms: 10000 });
    const seen = JSON.parse(res.stdout);
    assert.equal(seen.ANTHROPIC_API_KEY, undefined);
    assert.equal(seen.ANTHROPIC_BASE_URL, undefined);
  } finally {
    for (const k of Object.keys(process.env)) if (!Object.hasOwn(saved, k)) delete process.env[k];
    Object.assign(process.env, saved);
  }
});

test('0391 AC3: with no DeepSeek key, or no Claude Code, the ticket isn\'t started, saying why and how to fix it', () => {
  const r = providerRepo({ key: false });
  const cfg = { builder: 'deepseek', build_command: '' };
  const none = buildPlan(cfg, { builder: 'deepseek' }, yes, { repo: r.dir });
  assert.equal(none.words, undefined);
  assert.match(none.why, /no DeepSeek API key.*`speck keys set deepseek`/);
  const noClaude = buildPlan(cfg, { builder: 'deepseek' }, w => w !== 'claude', { repo: r.dir });
  assert.match(noClaude.why, /DeepSeek.*needs Claude Code installed.*claude isn't on the PATH/);
  const failed = new Map(), said = [], log = console.log;
  console.log = m => said.push(m);
  try { assert.equal(launchPlan(cfg, { id: '0001', builder: 'deepseek' }, { command: '', words: [], repo: r.dir, failed, installed: yes }), null); } finally { console.log = log; }
  assert.equal(failed.get('0001').kind, 'builder', 'the panel\'s Foreman detail shows it, as for a builder that isn\'t installed');
  assert.match(said.join('\n'), /0001 wasn't started, and stays ready: .*speck keys set deepseek/);
  saveProviderKey(r.dir, 'deepseek', KEY);
  assert.equal(buildPlan(cfg, { builder: 'deepseek' }, yes, { repo: r.dir }).agent, 'deepseek');
});

test('0391 AC3: a build resumed after the key was removed stops before Claude Code starts, saying how to set one', () => {
  const r = providerRepo();
  removeProviderKey(r.dir, 'deepseek');
  const fake = fakeClaude();
  const res = wrap(fill(buildPlan({ builder: 'deepseek', build_command: '' }, { builder: 'deepseek' }, yes).words, '0001', 's3'), r.dir, { PATH: fake.PATH });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /no DeepSeek API key.*speck keys set deepseek/);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.equal(fake.calls().length, 0);
});

test('0391 AC3: speck doctor checks Claude Code and the DeepSeek key when DeepSeek builds', () => {
  const r = providerRepo({ key: false });
  const checks = cfg => doctorChecks(r.dir, cfg);
  const named = (list, re) => list.filter(c => re.test(c.name));
  const before = checks({ builder: 'deepseek', reviewer: 'codex' });
  assert.equal(named(before, /Claude Code \(DeepSeek builds need it installed\)/).length, 1);
  const [key] = named(before, /DeepSeek API key.*builds tickets/);
  assert.equal(key.ok, false);
  assert.match(key.fix, /speck keys set deepseek/);
  saveProviderKey(r.dir, 'deepseek', KEY);
  assert.equal(named(checks({ builder: 'deepseek', reviewer: 'codex' }), /DeepSeek API key.*builds tickets/)[0].ok, true);
  assert.equal(named(checks({ builder: 'claude', reviewer: 'codex' }), /DeepSeek/).length, 0, 'not checked when DeepSeek doesn\'t build');
});

test('0391 AC1: the board and the panel name the builder as DeepSeek', async () => {
  const r = providerRepo();
  assert.equal(statusData(r.dir).tickets.find(t => t.id === '0001').builder_label, 'DeepSeek');
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false }
    : { tickets: [T('0801', 'reviewing', { started: new Date().toISOString(), build_running: true, self_check: 'no changes', builder: 'deepseek', builder_label: 'DeepSeek', reviewer: 'codex', review_running: null, rounds: [{ ...round(1, 10), verdict: 'changes_requested' }] })], ideas: [] }) }) });
  await p.settle();
  const row = queueRows(p).find(x => p.all(x).some(n => n.className === 'id' && n._text === '0801'));
  assert.equal(p.all(row).filter(n => /\bsay\b/.test(n.className || ''))[0].textContent, 'DeepSeek is fixing round 1\'s findings');
});

test('0391 AC4: any provider in speck\'s list builds the same way', () => {
  const r = providerRepo({ key: false });
  saveProviderKey(r.dir, 'acme', ACME_KEY, { providers: [ACME] });
  const cfg = { builder: 'acme', build_command: '', builder_model: 'acme-2' };
  const plan = buildPlan(cfg, { builder: 'acme' }, yes, { repo: r.dir, providers: [ACME] });
  assert.equal(plan.agent, 'acme');
  assert.match(buildPlan(cfg, { builder: 'acme' }, yes).why, /no command of its own/, 'not one speck knows by default');
  assert.match(buildPlan(cfg, { builder: 'acme' }, yes, { repo: r.dir, providers: [{ ...ACME, name: 'other' }, ACME] }).agent, /^acme$/);
  const fake = fakeClaude();
  assert.equal(wrap(fill(plan.words, '0001', 'sa'), r.dir, { PATH: fake.PATH }).status, 0);
  const { env, args } = fake.calls()[0];
  assert.equal(env.ANTHROPIC_BASE_URL, ACME.address);
  assert.equal(env.ANTHROPIC_API_KEY, ACME_KEY);
  assert.equal(env.ANTHROPIC_MODEL, 'acme-2');
  assert.equal(after(args, '--model'), 'acme-2');
  assert.ok(env.CLAUDE_CONFIG_DIR.includes(`${path.sep}provider-acme${path.sep}`));
  const { argv } = resumeFor([], cfg, '0001', { agent: 'acme', session: 'sa' }, 'm', [ACME]);
  assert.equal(after(argv, '--resume'), 'sa');
  assert.equal(argv[2], 'acme');
});

test('0391 AC2: without --model the build runs on the provider\'s default model, and without a provider it stops saying how to start it', () => {
  const r = providerRepo();
  const fake = fakeClaude();
  const res = wrap([process.execPath, PROVIDER_SCRIPT, 'deepseek', DEEPSEEK.address, 'claude', '-p', 'x'], r.dir, { PATH: fake.PATH });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fake.calls()[0].env.ANTHROPIC_MODEL, 'deepseek-v4-pro');
  const bad = wrap([process.execPath, PROVIDER_SCRIPT], r.dir, { PATH: fake.PATH });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /speck run starts this with a model provider's name/);
  assert.equal(fake.calls().length, 1);
});

test('0391 AC5: the README names DeepSeek as a tested builder', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.ok(readme.includes('`builder: deepseek`'));
});

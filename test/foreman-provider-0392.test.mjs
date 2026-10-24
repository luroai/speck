import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gitEnv, panelRepo } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { fakeClaude, after } from './support/provider-builder.mjs';
import { loadConfig } from '../scripts/speck.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { saveProviderKey } from '../scripts/keys.mjs';
import { PROVIDER_SCRIPT, FOREMAN_MODE } from '../scripts/provider-build.mjs';
import { foremanAgentQueue, foremanArgv, foremanAgentOf, foremanCantStart } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv);
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// ---------- 0392: run the Foreman on DeepSeek ----------

const KEY = 'sk-0392-secret-Vt83k';
const ACME = Object.freeze({ name: 'acme', label: 'Acme', address: 'http://127.0.0.1:9/acme', models: ['acme-1', 'acme-2'], defaultModel: 'acme-1' });
const ACME_KEY = 'sk-acme-0392-Lm4';
const yes = () => true;
// What the user's own environment might hold that would sign Claude Code in elsewhere, or point it at another folder.
const MINE = { ANTHROPIC_AUTH_TOKEN: 'mine-1', ANTHROPIC_API_KEY: 'mine-2', ANTHROPIC_BASE_URL: 'https://example.invalid', CLAUDE_CODE_OAUTH_TOKEN: 'mine-3',
  CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_USE_VERTEX: '1', AWS_BEARER_TOKEN_BEDROCK: 'mine-4', CLAUDE_CONFIG_DIR: '/home/someone/.claude', ANTHROPIC_MODEL: 'opus' };

// speck run's Foreman queue for a stuck ticket 0001, on `extra` settings, starting nothing for real: { starts, said }.
function queueFor(extra, opts = {}) {
  const r = blockedRepo({ status: 'building' }), starts = [], said = [];
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'fix', ...extra }),
    words: [], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again: () => {} }, say: m => said.push(m),
    startBuild: () => {}, start: (argv, cwd, log, env) => { starts.push({ argv, cwd, env }); return { pid: 92000, exited: () => false }; }, alive: () => true, withToken: () => [],
    ...(typeof opts === 'function' ? opts(r) : opts) });
  q.stuck({ id: '0001', what: 'its build ended with the ticket still building', log: '' });
  q.check([{ id: '0001', status: 'building' }]);
  return { r, starts, said };
}
// The Foreman's words with the provider's launcher taken off the front: Claude Code's own.
const claudeOf = argv => argv.slice(5);

test('0392 AC1: with foreman deepseek, the Foreman runs Claude Code through DeepSeek on watch_model or DeepSeek\'s default, without watch_effort', () => {
  assert.equal(foremanAgentOf({ foreman: 'deepseek' }), 'deepseek');
  const argv = foremanArgv({ foreman: 'deepseek' }, 'B');
  assert.deepEqual(argv.slice(0, 5), [process.execPath, PROVIDER_SCRIPT, FOREMAN_MODE, 'deepseek', 'https://api.deepseek.com/anthropic']);
  const claude = claudeOf(argv);
  assert.equal(claude[0], 'claude');
  assert.ok(claude.includes('--bare'), 'Anthropic sign-in only from the key it is given');
  assert.equal(after(claude, '-p'), 'B', 'the brief is the prompt');
  assert.equal(after(claude, '--model'), 'deepseek-v4-pro');
  assert.equal(after(claudeOf(foremanArgv({ foreman: 'deepseek', watch_model: 'deepseek-v4-flash' }, 'B')), '--model'), 'deepseek-v4-flash');
  const effort = foremanArgv({ foreman: 'deepseek', watch_effort: 'high' }, 'B');
  // 0402: the effort flags, not any word with "effort" in it, such as a worktree's folder in the script's path.
  assert.ok(!effort.some(w => w === '--effort' || w.startsWith('--effort=') || /model_reasoning_effort/.test(w)), 'watch_effort isn\'t passed');
  assert.ok(!effort.includes('high'));
});

test('0392 AC1: speck run\'s Foreman queue starts a DeepSeek Foreman with its brief and names DeepSeek', () => {
  const { r, starts, said } = queueFor({ watch_agent: 'deepseek' }, { cantStart: () => '' });
  assert.equal(starts.length, 1, said.join('\n'));
  const { argv, cwd, env } = starts[0];
  assert.equal(argv[1], PROVIDER_SCRIPT);
  assert.equal(cwd, r.dir);
  assert.ok(env.SPECK_FOREMAN_RUN, 'it gets its run\'s token, so its one action is taken');
  assert.match(after(argv, '-p'), /You are speck, watching the pipeline\. Work on ticket 0001/);
  assert.match(after(argv, '-p'), /\.claude\/skills\/speck-watch\/SKILL\.md/);
  assert.ok(said.some(m => /speck \(DeepSeek\) is looking into it/.test(m)), said.join('\n'));
  assert.ok(!said.some(m => /Claude Code/.test(m)), said.join('\n'));
});

test('0392 AC2: a DeepSeek Foreman may do only what the Claude Code Foreman may', () => {
  const mine = foremanArgv({ foreman: 'claude' }, 'B');
  const theirs = claudeOf(foremanArgv({ foreman: 'deepseek' }, 'B'));
  const tail = words => words.slice(words.indexOf('--permission-mode'));
  assert.deepEqual(tail(theirs).filter(w => w !== '--model' && !w.startsWith('deepseek-')), tail(mine));
  assert.equal(after(theirs, '--permission-mode'), 'dontAsk');
  assert.ok(!theirs.some(w => /dangerously|bypass/.test(w)));
  for (const w of ['--setting-sources=project', '--strict-mcp-config']) assert.ok(theirs.includes(w), w);
});

// Other sign-ins, tokens and keys speck's own environment might hold.
const OTHERS = { AWS_ACCESS_KEY_ID: 'other-1', AWS_SECRET_ACCESS_KEY: 'other-2', GOOGLE_APPLICATION_CREDENTIALS: '/other-3.json', GH_TOKEN: 'other-4',
  GITHUB_TOKEN: 'other-5', OPENAI_API_KEY: 'other-6', CURSOR_API_KEY: 'other-7', SPECK_PANEL_TOKEN: 'other-8', NPM_TOKEN: 'other-9', GIT_ASKPASS: '/other-10' };

test('0392 AC2: the DeepSeek Foreman\'s Claude Code gets DeepSeek\'s address and this machine\'s key, and none of speck\'s own sign-ins', () => {
  const r = panelRepo();
  saveProviderKey(r.dir, 'deepseek', KEY);
  const fake = fakeClaude();
  const argv = foremanArgv({ foreman: 'deepseek' }, 'B');
  assert.ok(!argv.some(w => w.includes(KEY)), 'the key is never on a command line');
  const res = spawnSync(argv[0], argv.slice(1), { cwd: r.dir, encoding: 'utf8', env: { ...process.env, PATH: fake.PATH, ...MINE, ...OTHERS, SPECK_FOREMAN_RUN: 'tok-1', HOME: '/home/me' } });
  assert.equal(res.status, 0, res.stderr);
  const [{ env, args }] = fake.calls();
  assert.ok(args.includes('--bare'));
  assert.equal(env.ANTHROPIC_BASE_URL, 'https://api.deepseek.com/anthropic');
  assert.equal(env.ANTHROPIC_API_KEY, KEY);
  assert.equal(env.ANTHROPIC_MODEL, 'deepseek-v4-pro');
  assert.equal(env.SPECK_FOREMAN_RUN, 'tok-1');
  assert.notEqual(env.CLAUDE_CONFIG_DIR, MINE.CLAUDE_CONFIG_DIR, 'a Claude Code folder of its own');
  assert.ok(!Object.values(env).some(v => /^mine-/.test(v)), 'none of speck\'s own sign-ins');
  for (const k of ['ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'AWS_BEARER_TOKEN_BEDROCK']) assert.equal(env[k], undefined, k);
  for (const k of Object.keys(OTHERS)) assert.equal(env[k], undefined, `${k}: no other sign-in, token or key`);
  // What it needs to run, and for `speck foreman` to commit its note as you.
  assert.equal(env.PATH, fake.PATH);
  assert.equal(env.HOME, '/home/me');
  assert.equal(env.GIT_AUTHOR_NAME, gitEnv.GIT_AUTHOR_NAME);
  assert.equal(env.GIT_COMMITTER_EMAIL, gitEnv.GIT_COMMITTER_EMAIL);
});

test('0392 AC3: with no DeepSeek key, or no Claude Code, the Foreman isn\'t started and speck run says why', () => {
  const r = panelRepo();
  assert.match(foremanCantStart(r.dir, { foreman: 'deepseek' }, { installed: yes }), /no DeepSeek API key.*speck keys set deepseek/);
  assert.match(foremanCantStart(r.dir, { foreman: 'deepseek' }, { installed: () => false }), /needs Claude Code installed/);
  saveProviderKey(r.dir, 'deepseek', KEY);
  assert.equal(foremanCantStart(r.dir, { foreman: 'deepseek' }, { installed: yes }), '');
  assert.equal(foremanCantStart(r.dir, { foreman: 'claude' }, { installed: () => false }), '', 'only a provider\'s is checked here');

  const noKey = queueFor({ watch_agent: 'deepseek' }, r2 => ({ cantStart: c => foremanCantStart(r2.dir, c, { installed: yes }) }));
  assert.equal(noKey.starts.length, 0);
  assert.ok(noKey.said.some(m => /^0001: speck couldn't start looking into it on DeepSeek: this machine has no DeepSeek API key/.test(m)), noKey.said.join('\n'));
  const noClaude = queueFor({ watch_agent: 'deepseek' }, r2 => (saveProviderKey(r2.dir, 'deepseek', KEY), { cantStart: c => foremanCantStart(r2.dir, c, { installed: () => false }) }));
  assert.equal(noClaude.starts.length, 0);
  assert.ok(noClaude.said.some(m => /couldn't start looking into it on DeepSeek: .*needs Claude Code installed/.test(m)), noClaude.said.join('\n'));
});

test('0392 AC3: a blank foreman with a DeepSeek builder runs on DeepSeek, and foreman deepseek can be set', () => {
  assert.equal(foremanAgentOf({ builder: 'deepseek' }), 'deepseek');
  assert.equal(foremanAgentOf({ builder: 'deepseek', foreman: '' }), 'deepseek');
  assert.equal(foremanArgv({ builder: 'deepseek' }, 'B')[3], 'deepseek');
  assert.equal(foremanAgentOf({ builder: 'deepseek', foreman: 'codex' }), 'codex', 'a foreman that is set wins');
  assert.equal(foremanAgentOf({ builder: 'DeepSeek' }), 'claude', 'named exactly, as a builder is');
  assert.equal(foremanAgentOf({ foreman: '__proto__' }), 'claude');
  assert.equal(checkConfigValue('watch_agent', 'deepseek'), 'deepseek');
  assert.throws(() => checkConfigValue('watch_agent', 'DeepSeek'), /watch_agent must be blank or one of claude, codex, cursor, deepseek/);
});

test('0392 AC4: any provider in speck\'s list runs the Foreman the same way', () => {
  const providers = [ACME];
  assert.equal(foremanAgentOf({ foreman: 'acme' }, providers), 'acme');
  assert.equal(foremanAgentOf({ builder: 'acme' }, providers), 'acme');
  assert.equal(foremanAgentOf({ foreman: 'acme' }), 'claude', 'not a provider speck knows');
  const argv = foremanArgv({ foreman: 'acme' }, 'B', undefined, providers);
  assert.deepEqual(argv.slice(0, 5), [process.execPath, PROVIDER_SCRIPT, FOREMAN_MODE, 'acme', ACME.address]);
  assert.equal(after(argv, '--model'), 'acme-1');
  const r = panelRepo();
  assert.match(foremanCantStart(r.dir, { foreman: 'acme' }, { providers, installed: yes }), /no Acme API key.*speck keys set acme/);
  saveProviderKey(r.dir, 'acme', ACME_KEY, { providers });
  assert.equal(foremanCantStart(r.dir, { foreman: 'acme' }, { providers, installed: yes }), '');
  const fake = fakeClaude();
  const res = spawnSync(argv[0], argv.slice(1), { cwd: r.dir, encoding: 'utf8', env: { ...process.env, PATH: fake.PATH, ...MINE } });
  assert.equal(res.status, 0, res.stderr);
  const [{ env }] = fake.calls();
  assert.equal(env.ANTHROPIC_BASE_URL, ACME.address);
  assert.equal(env.ANTHROPIC_API_KEY, ACME_KEY);
  const q = queueFor({ watch_agent: 'acme' }, { providers, cantStart: () => '' });
  assert.equal(q.starts[0]?.argv[3], 'acme', q.said.join('\n'));
  assert.ok(q.said.some(m => /speck \(Acme\) is looking into it/.test(m)), q.said.join('\n'));
});

test('0392 AC3: the README, the brief and the config template name deepseek as a Foreman agent', () => {
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const mentions = (text, setting) => text.split(/\n\s*\n|\n\|/).filter(part => part.includes(setting)).some(part => /\bdeepseek\b/.test(part));
  assert.ok(mentions(read('README.md'), '`foreman_model`'), 'README');
  assert.ok(mentions(read('docs/brief.md'), '`foreman_model`'), 'brief');
  assert.match(read('templates/config.yml'), /^watch_agent: .*\bdeepseek\b/m);
});

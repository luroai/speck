// 0391: building with a model provider's models, such as DeepSeek's. speck runs them through Claude Code, as it does a
// provider's reviewer (provider-review.mjs), pointed at the provider's Anthropic-compatible address with this machine's
// key for it. speck run starts and resumes the build through this script, run as node <this file> <provider> <address>
// <Claude Code's words>, so the key is read here and is never on a command line or in a log. Claude Code gets the
// provider's address and key, none of speck's own Anthropic or cloud sign-in variables, a Claude Code folder of its
// own, so it can't reach the user's Claude sign-in, user settings or connectors, and no MCP servers. It loads the
// project's settings, CLAUDE.md and skills as a Claude Code build does: not --bare, as the reviewer is, since in -p
// mode --bare doesn't expand /speck-build and offers only the Bash, Edit and Read tools (Claude Code 2.1.301). Its
// sessions are kept in its folder, so a stopped or handed-back build resumes them. Everything else in speck's
// environment is kept: the build's own work, such as git and the reviewer it starts, needs it.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findRepoRoot } from './core.mjs';
import { providerKey } from './keys.mjs';
import { findProvider } from './providers.mjs';
import { providerVars, providerDir } from './provider-review.mjs';
import { DEFAULT_BUILD_COMMAND, modelOf } from './build-model.mjs';
import { splitCommand } from './reviewers.mjs';

export const PROVIDER_SCRIPT = fileURLToPath(import.meta.url);
// Set in a provider build's environment, naming the provider, so a reviewer it starts can be given back its own.
export const PROVIDER_BUILD = 'SPECK_PROVIDER_BUILD';
// The project's settings only, not the user's or local ones, and no MCP servers or claude.ai connectors.
const CLAUDE_FLAGS = ['--setting-sources=project', '--strict-mcp-config'];
// speck's own variables that would sign Claude Code in to Anthropic or a cloud that serves Claude, or point it at another
// address or Claude Code folder.
const SIGN_IN = /^(ANTHROPIC_|CLAUDE_CODE_(?!DISABLE_BACKGROUND_TASKS$)|CLAUDE_CONFIG_DIR$|AWS_BEARER_TOKEN_BEDROCK$|CLOUD_ML_REGION$|VERTEX_REGION_)/;
const NO_BACKGROUND = 'CLAUDE_CODE_DISABLE_BACKGROUND_TASKS'; // 0245, as buildEnv sets it for a Claude Code build

// The words that start provider `p`'s build: Claude Code's own build command through this script, on builder_model or
// else the provider's default model. `cfg` is speck/config.yml as the build reads it (configFor in ticket-builder.mjs).
export function providerStartWords(cfg, p) {
  const [claude, ...rest] = splitCommand(DEFAULT_BUILD_COMMAND);
  return [process.execPath, PROVIDER_SCRIPT, p.name, p.address, claude, ...CLAUDE_FLAGS, ...rest, '--model', modelOf(cfg) || p.defaultModel];
}

// The command that resumes provider `p`'s build by hand, {session} standing for its session.
export const providerResumeCommand = (cfg, p) =>
  ['node', PROVIDER_SCRIPT, p.name, p.address, 'claude', ...CLAUDE_FLAGS, '--resume', '{session}', '--model', modelOf(cfg) || p.defaultModel].join(' ');

// The environment provider `p`'s build runs Claude Code with, on `model`, from speck's own `from`.
export function providerBuildEnv(repo, p, key, model, from = process.env) {
  const env = Object.fromEntries(Object.entries(from).filter(([k]) => !SIGN_IN.test(k)));
  return { ...env, [NO_BACKGROUND]: env[NO_BACKGROUND] ?? '1', CLAUDE_CONFIG_DIR: path.join(providerDir(repo, p), '.claude'), ...providerVars(p, key, model), [PROVIDER_BUILD]: p.name };
}

// `env` without what a provider build sets for its own Claude Code, for a reviewer it starts: unchanged outside one.
export function withoutProviderBuild(env = process.env) {
  if (!env[PROVIDER_BUILD]) return env;
  const out = { ...env };
  for (const k of Object.keys(out)) if (/^ANTHROPIC_/.test(k)) delete out[k];
  for (const k of [PROVIDER_BUILD, 'CLAUDE_CONFIG_DIR', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', 'DISABLE_TELEMETRY', 'DISABLE_ERROR_REPORTING', 'DISABLE_AUTOUPDATER']) delete out[k];
  return out;
}

// Runs the build: reads the key, then Claude Code with the build's environment, ending as it ends. A stop sent to this
// process alone is passed on to Claude Code.
function main([name, address, ...words]) {
  const stop = message => { process.stderr.write(`${message}\n`); process.exit(2); };
  if (!name || !/^https?:\/\//.test(address ?? '') || !words.length) stop('speck run starts this with a model provider\'s name, its address and the command that runs Claude Code. Build the ticket with speck run, or resume it with the command speck run gives.');
  const known = findProvider(name);
  const p = { ...known, name, address, label: known?.label ?? name };
  let repo, key = '';
  try {
    repo = findRepoRoot();
    key = providerKey(repo, name, { providers: [p] });
  } catch (e) { stop(e.message); }
  if (!key) stop(`This machine has no ${p.label} API key, so the ${p.label} build can't run. Set one with \`speck keys set ${name}\`, then build the ticket again.`);
  const at = words.indexOf('--model');
  const model = (at >= 0 && words[at + 1]) || p.defaultModel || '';
  const child = spawn(words[0], words.slice(1), { stdio: 'inherit', env: providerBuildEnv(repo, p, key, model) });
  const pass = signal => () => { try { child.kill(signal); } catch { /* already gone */ } };
  for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(signal, pass(signal));
  child.on('error', e => stop(e.code === 'ENOENT' ? `${p.label} builds need Claude Code installed, as speck runs ${p.label}'s models through it. Install Claude Code so \`claude\` is on your PATH (https://claude.com/claude-code).` : `Claude Code couldn't start (${e.message}).`));
  child.on('exit', (code, signal) => {
    if (!signal) process.exit(code ?? 1);
    for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.removeAllListeners(s);
    process.kill(process.pid, signal);
  });
}

const ran = () => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } };
if (process.argv[1] && ran() === fs.realpathSync(PROVIDER_SCRIPT)) main(process.argv.slice(2));

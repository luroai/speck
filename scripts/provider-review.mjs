// 0390: reviewing with a model provider's models, such as DeepSeek's. speck runs them through Claude Code, pointed at
// the provider's Anthropic-compatible address with this machine's key for it (keys.mjs). The reviewer gets that address
// and key and nothing else that would let it sign in: an environment of its own, without the user's Anthropic, cloud or
// Claude Code variables, and a home and Claude Code folder of its own, so it can't reach the user's Claude sign-in,
// Claude Code settings or connectors. Its sessions are kept in that folder, so later rounds can resume them.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError } from './core.mjs';
import { onPath } from './install.mjs';
import { providerKey } from './keys.mjs';
import { sharedCacheDir } from './turns.mjs';
import { PROVIDERS, findProvider } from './providers.mjs';

// The only variables passed on from speck's own environment: what a program needs to run, and a proxy to reach the
// provider through. Nothing that signs in to Anthropic, a cloud or Claude Code.
const KEEP = ['PATH', 'LANG', 'LANGUAGE', 'TERM', 'TZ', 'TMPDIR', 'SHELL', 'USER', 'LOGNAME',
  'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy', 'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'SSL_CERT_DIR'];

// The provider called `name`, when it is one: matched exactly, as a reviewer name is.
export function providerNamed(name, providers = PROVIDERS) {
  const p = findProvider(name, providers);
  return p && p.name === name ? p : null;
}

// The key for provider `p`, after checking Claude Code is installed and the key is set: a plain error saying what to
// do otherwise, before anything runs.
export function providerReady(repo, p, providers = PROVIDERS) {
  if (!onPath('claude')) throw new SpeckError(`${p.label} reviews need Claude Code installed, as speck runs ${p.label}'s models through it. Install Claude Code so \`claude\` is on your PATH (https://claude.com/claude-code), then run this again. No round was recorded.`);
  const key = providerKey(repo, p.name, { providers });
  if (!key) throw new SpeckError(`This machine has no ${p.label} API key, so the ${p.label} reviewer can't run. Set one with \`speck keys set ${p.name}\`, then run this again. No round was recorded.`);
  return key;
}

// The environment provider `p`'s reviewer runs with, on `model`, from speck's own `from`.
export function providerEnv(repo, p, key, model, from = process.env) {
  const home = sharedCacheDir(repo, `provider-${p.name}`);
  fs.chmodSync(home, 0o700);
  const env = {};
  for (const k of KEEP) if (typeof from[k] === 'string') env[k] = from[k];
  for (const k of Object.keys(from)) if (/^LC_/.test(k)) env[k] = from[k];
  return {
    ...env,
    HOME: home, XDG_CONFIG_HOME: path.join(home, '.config'), CLAUDE_CONFIG_DIR: path.join(home, '.claude'),
    ANTHROPIC_BASE_URL: p.address, ANTHROPIC_API_KEY: key,
    // Every model Claude Code would pick by itself is the provider's, so no request names one only Anthropic has.
    ANTHROPIC_MODEL: model, ANTHROPIC_SMALL_FAST_MODEL: model,
    ANTHROPIC_DEFAULT_OPUS_MODEL: model, ANTHROPIC_DEFAULT_SONNET_MODEL: model, ANTHROPIC_DEFAULT_HAIKU_MODEL: model,
    // No telemetry, error reports, update checks or other requests to Anthropic.
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', DISABLE_AUTOUPDATER: '1',
  };
}

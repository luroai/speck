// 0401: the API providers you add yourself in Settings, by name, base URL, API type and models, kept for this machine
// beside its own settings, in the main checkout's speck/.cache/machine/providers.json, which git ignores, so adding one
// commits nothing. Each one's key is kept with the others' (keys.mjs). knownProviders gives speck's own providers, such
// as DeepSeek, then yours, so each one is built with, reviewed with and listed as speck's own are.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, findRepoRoot } from './core.mjs';
import { machineConfigFile } from './machine.mjs';
import { sharedCacheDir } from './turns.mjs';
import { PROVIDERS } from './providers.mjs';

export const API_TYPES = Object.freeze(['anthropic', 'openai']);
const TYPE_NAMES = { anthropic: 'Anthropic', openai: 'OpenAI' };
// Names a provider can't take: speck's own agents and reviewers.
const TAKEN = ['claude', 'codex', 'cursor', 'claude-subagent'];
const MAX_MODELS = 20;

export const customProvidersFile = repo => path.join(path.dirname(machineConfigFile(repo)), 'providers.json');

// The repo speck is run in, or null outside one.
const here = () => { try { return findRepoRoot(); } catch { return null; } };

const frozen = p => Object.freeze({ ...p, models: Object.freeze([...p.models]) });

// One saved provider as speck uses it, or null when it isn't one: a file changed by hand is read only as far as it's sound.
function readOne(x) {
  if (!x || typeof x !== 'object') return null;
  try {
    const p = checkedProvider({ label: x.label, address: x.address, type: x.type, models: x.models });
    return p.name === x.name ? p : null;
  } catch { return null; }
}

// The providers you've added on this machine, [] when there's no file or it can't be read.
export function customProviders(repo) {
  if (repo === null || repo === undefined) return [];
  let read;
  try { read = JSON.parse(fs.readFileSync(customProvidersFile(repo), 'utf8')); } catch { return []; }
  const list = read && Array.isArray(read.providers) ? read.providers : [];
  const out = [];
  for (const p of list.map(readOne)) if (p && !out.some(o => o.name === p.name) && !PROVIDERS.some(o => o.name === p.name)) out.push(p);
  return out;
}

// speck's own providers, then those you've added on this machine. `repo` is the one speck is run in when it isn't given.
export function knownProviders(repo = here()) {
  return [...PROVIDERS, ...customProviders(repo)];
}

// The name speck knows a provider by, from the name you gave it: "Moonshot AI" is moonshot-ai.
export const providerId = label => String(label ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// A provider as given in the form, checked: { name, label, address, type, models, defaultModel }, or a SpeckError
// saying what to change, without the key. `models` is a list, or text with the names separated by commas or spaces.
export function checkedProvider({ label, address, type, models } = {}) {
  const shown = String(label ?? '').trim();
  if (!shown) throw new SpeckError('Give the provider a name, such as the company that runs the API. Nothing was saved.');
  if (shown.length > 40 || /[\x00-\x1f\x7f]/.test(shown)) throw new SpeckError('The provider\'s name must be one line of 40 characters or fewer. Nothing was saved.');
  const name = providerId(shown);
  if (!/^[a-z]/.test(name)) throw new SpeckError(`The provider's name must start with a letter, so speck can name it in your settings (got ${JSON.stringify(shown)}). Nothing was saved.`);
  if (TAKEN.includes(name) || PROVIDERS.some(p => p.name === name))
    throw new SpeckError(`speck already has an agent called ${name}, so give this provider another name. Nothing was saved.`);
  let url;
  try { url = new URL(String(address ?? '').trim()); } catch { url = null; }
  if (!url || !['https:', 'http:'].includes(url.protocol))
    throw new SpeckError('The base URL must be the API\'s address, starting with https:// (for example https://api.example.com/anthropic). Nothing was saved.');
  // The key goes to this address, so only over https, unless it's on this machine, such as a proxy of your own.
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new SpeckError('The base URL must start with https://, so the key is never sent where others could read it. Only an address on this machine (localhost) may use http://. Nothing was saved.');
  // Nothing in the address that could carry a key: speck puts it on the command line that starts a build.
  if (url.username || url.password || url.search || url.hash)
    throw new SpeckError('The base URL must have no user name, password, ? or # in it: put the key in the API key field. Nothing was saved.');
  const t = String(type ?? '').trim().toLowerCase();
  if (!API_TYPES.includes(t)) throw new SpeckError('The API type must be OpenAI or Anthropic. Nothing was saved.');
  const list = Array.isArray(models) ? models.map(m => String(m ?? '').trim()) : String(models ?? '').split(/[\s,]+/);
  const names = [...new Set(list.filter(Boolean))];
  if (!names.length) throw new SpeckError('Give at least one model name, as the provider names it. The first is the one speck uses unless you pick another. Nothing was saved.');
  if (names.length > MAX_MODELS) throw new SpeckError(`Give ${MAX_MODELS} model names or fewer. Nothing was saved.`);
  const bad = names.find(m => !/^[A-Za-z0-9][A-Za-z0-9._:\/@+-]{0,99}$/.test(m));
  if (bad !== undefined) throw new SpeckError(`${JSON.stringify(bad.slice(0, 60))} doesn't look like a model name: use the name as the provider writes it, without spaces. Nothing was saved.`);
  return frozen({ name, label: shown, address: url.href.replace(/\/+$/, ''), type: t, models: names, defaultModel: names[0] });
}

// Saves provider `p` (checkedProvider's) for this machine, replacing one you added before with the same name.
export function saveCustomProvider(repo, p) {
  const file = customProvidersFile(repo);
  if (fs.existsSync(file) && customProviders(repo).length === 0) {
    let read = null;
    try { read = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* checked below */ }
    if (!read || !Array.isArray(read.providers))
      throw new SpeckError(`This machine's list of the providers you've added, ${file}, can't be read. Delete it, then add each provider again. Nothing was saved.`);
  }
  const kept = customProviders(repo).filter(o => o.name !== p.name);
  const list = [...kept, p].map(o => ({ name: o.name, label: o.label, address: o.address, type: o.type, models: [...o.models] }));
  sharedCacheDir(repo, 'machine');
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ providers: list }, null, 2)}\n`);
  fs.renameSync(tmp, file);
  return p;
}

// Why provider `p` can't do `work` (build, review or the Foreman) yet, in a sentence, or '' when it can.
export function cantRun(p, work) {
  if (!p || (p.type ?? 'anthropic') === 'anthropic') return '';
  return `${p.label} is an ${TYPE_NAMES[p.type] ?? p.type}-type provider, and speck only runs Anthropic-type providers so far, so it can't ${work}. Pick another agent for it in Settings.`;
}

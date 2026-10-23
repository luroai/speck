// 0389: each model provider's API key, kept for this machine beside its own settings, in the main checkout's
// speck/.cache/machine/keys.json, which git ignores and only its owner can read or write. Every worktree reads the same
// file. A key is never printed, logged or put on a command line: `speck keys set` reads it from its input.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isatty } from 'node:tty';
import { SpeckError, findRepoRoot } from './core.mjs';
import { machineConfigFile } from './machine.mjs';
import { sharedCacheDir } from './turns.mjs';
import { PROVIDERS, findProvider } from './providers.mjs';

export const keysFile = repo => path.join(path.dirname(machineConfigFile(repo)), 'keys.json');

const known = providers => providers.map(p => p.name).join(', ');
function providerOf(name, providers) {
  const p = findProvider(name, providers);
  if (!p) throw new SpeckError(`speck doesn't know a model provider called "${name}". It knows: ${known(providers)}.`);
  return p;
}

// The keys in this machine's file, for the providers in `providers` only: {} when there's no file.
function readKeys(repo, providers) {
  const file = keysFile(repo);
  let text;
  try {
    // A file someone else could read is made the owner's only again before it's read.
    if ((fs.statSync(file).mode & 0o077) !== 0) fs.chmodSync(file, 0o600);
    text = fs.readFileSync(file, 'utf8');
  } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
  let read;
  try { read = JSON.parse(text); } catch { read = null; }
  if (!read || typeof read !== 'object' || Array.isArray(read))
    throw new SpeckError(`This machine's API keys file, ${file}, can't be read. Delete it, then set each key again with \`speck keys set <provider>\`.`);
  const out = {};
  for (const p of providers) if (Object.hasOwn(read, p.name) && typeof read[p.name] === 'string' && read[p.name]) out[p.name] = read[p.name];
  return out;
}

// Writes `keys`, or removes the file when there are none, so only its owner can read or write it at any moment.
function writeKeys(repo, keys) {
  const file = keysFile(repo);
  if (!Object.keys(keys).length) { fs.rmSync(file, { force: true }); return; }
  sharedCacheDir(repo, 'machine');
  const tmp = `${file}.${process.pid}.tmp`;
  fs.rmSync(tmp, { force: true });
  try {
    const fd = fs.openSync(tmp, 'wx', 0o600);
    try { fs.fchmodSync(fd, 0o600); fs.writeSync(fd, `${JSON.stringify(keys, null, 2)}\n`); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, file);
  } catch (e) { fs.rmSync(tmp, { force: true }); throw e; } // never leaves a copy of a key behind
}

// The key for provider `name` on this machine, or null when it has none.
export function providerKey(repo, name, { providers = PROVIDERS } = {}) {
  return readKeys(repo, providers)[providerOf(name, providers).name] ?? null;
}

// Each provider with whether this machine has its key, and nothing more.
export function keysStatus(repo, { providers = PROVIDERS } = {}) {
  const keys = readKeys(repo, providers);
  return providers.map(p => ({ name: p.name, label: p.label, set: Object.hasOwn(keys, p.name) }));
}

// A key as given, without the line ending or spaces around it: refused, without showing it, when it's blank or has
// anything an API key doesn't, such as a space or a control character.
export function checkedKey(text) {
  const key = String(text ?? '').trim();
  if (!key) throw new SpeckError('No key was given, so nothing was saved. Paste the key when asked, or pipe it in: speck keys set <provider> < <file>.');
  if (!/^[\x21-\x7e]+$/.test(key)) throw new SpeckError("That doesn't look like an API key: it has spaces or characters a key doesn't have. Nothing was saved.");
  return key;
}

export function saveProviderKey(repo, name, key, { providers = PROVIDERS } = {}) {
  const p = providerOf(name, providers), keys = readKeys(repo, providers);
  keys[p.name] = checkedKey(key);
  writeKeys(repo, keys);
  return p;
}

// Removes provider `name`'s key: true if there was one.
export function removeProviderKey(repo, name, { providers = PROVIDERS } = {}) {
  const p = providerOf(name, providers), keys = readKeys(repo, providers);
  if (!Object.hasOwn(keys, p.name)) return false;
  delete keys[p.name];
  writeKeys(repo, keys);
  return true;
}

// In a terminal, a shell turns echo off, only then shows the prompt ($1), reads the line, and turns echo back on however
// it ends, even on Ctrl-C. The key comes back on its output, never on a command line: printf and read are the shell's own.
export const READ_SILENTLY = 'trap \'stty echo 2>/dev/null\' EXIT INT TERM HUP; stty -echo || exit 3; printf %s "$1" >&2; IFS= read -r k; printf \'\\n\' >&2; printf %s "$k"';

// The key from this process's input: typed or pasted in a terminal without being shown, or piped in.
export function readKeyInput(label) {
  if (!isatty(0)) {
    try { return fs.readFileSync(0, 'utf8'); } catch { return ''; } // no input to read, such as a closed one: no key
  }
  const r = spawnSync('sh', ['-c', READ_SILENTLY, 'sh', `${label} API key (it isn't shown as you type): `], { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
  if (r.status !== 0) throw new SpeckError(`Couldn't read the key without showing it, so nothing was saved. Pipe it in instead: speck keys set <provider> < <file>.`);
  return r.stdout;
}

const USAGE = 'Usage: speck keys, to see which providers have a key on this machine, speck keys set <provider>, which reads the key from its input, or speck keys remove <provider>.';

export function cmdKeys(args, { providers = PROVIDERS, readKey = readKeyInput } = {}) {
  const repo = findRepoRoot(), [sub, name, ...rest] = args;
  if (!sub) {
    for (const s of keysStatus(repo, { providers })) console.log(`${s.label} (${s.name}): ${s.set ? 'key set' : 'no key'}`);
    return;
  }
  if (sub === 'set') {
    if (!name) throw new SpeckError(USAGE);
    // Never echoes what was given: it may be the key itself.
    if (rest.length) throw new SpeckError(`speck keys set takes the key from its input, never the command line, so nothing was saved. Run \`speck keys set <provider>\` and paste it when asked. If you typed a key on that command line, it may be in your shell's history: change it with the provider.`);
    const p = providerOf(name, providers);
    saveProviderKey(repo, p.name, readKey(p.label), { providers });
    console.log(`Saved the ${p.label} API key for this machine only, where git ignores it. Remove it with \`speck keys remove ${p.name}\`.`);
    return;
  }
  if (sub === 'remove') {
    if (!name || rest.length) throw new SpeckError(USAGE);
    const p = providerOf(name, providers);
    console.log(removeProviderKey(repo, p.name, { providers }) ? `Removed the ${p.label} API key from this machine.` : `This machine has no ${p.label} API key, so there was nothing to remove.`);
    return;
  }
  throw new SpeckError(USAGE);
}

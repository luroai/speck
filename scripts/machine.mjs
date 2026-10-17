// 0260: settings that can be set for this machine only. Their values are kept in the main checkout's speck/.cache/,
// which git ignores, so every worktree of the repo reads the same ones, and loadConfig uses them over speck/config.yml's.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, parseYaml, worktreeList } from './core.mjs';
import { sharedCacheDir } from './turns.mjs';

export const MACHINE_SETTINGS = Object.freeze(['max_parallel_builds', 'max_parallel_tests']);

const mainCheckouts = new Map();
export function machineConfigFile(repo) {
  if (!mainCheckouts.has(repo)) {
    let main = repo;
    try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
    mainCheckouts.set(repo, main);
  }
  return path.join(mainCheckouts.get(repo), 'speck', '.cache', 'machine', 'config.yml');
}

// This machine's values, as written in its file: only the settings it can hold, and {} when there's no file.
export function machineConfig(repo) {
  let text;
  try { text = fs.readFileSync(machineConfigFile(repo), 'utf8'); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; }
  const read = parseYaml(text), out = {};
  for (const key of MACHINE_SETTINGS) if (Object.hasOwn(read, key)) out[key] = read[key];
  return out;
}

// Sets this machine's `key` to the checked `value`, or removes it when `value` is undefined, rewriting its file (0261:
// shared by `speck config set --machine` and the panel). Returns the value it had, or undefined.
export function saveMachineValue(repo, key, value) {
  const file = machineConfigFile(repo), values = machineConfig(repo), was = values[key];
  if (value === undefined) delete values[key]; else values[key] = value;
  const keys = MACHINE_SETTINGS.filter(k => Object.hasOwn(values, k));
  if (keys.length) {
    sharedCacheDir(repo, 'machine');
    fs.writeFileSync(file, `# This machine's own values, used over speck/config.yml's. Change them with speck config set --machine.\n${keys.map(k => `${k}: ${values[k]}`).join('\n')}\n`);
  } else fs.rmSync(file, { force: true });
  return was;
}

// Puts this machine's values in `cfg`, read from speck/config.yml, refusing one that isn't a whole number of 1 or more.
export function applyMachineConfig(repo, cfg) {
  for (const [key, v] of Object.entries(machineConfig(repo))) {
    if (!Number.isSafeInteger(v) || v < 1)
      throw new SpeckError(`${key} set for this machine in ${machineConfigFile(repo)} must be a whole number of 1 or more (got ${JSON.stringify(v)}). Fix it with \`speck config set --machine ${key} <number>\`, or remove it with \`speck config set --machine ${key} ""\`, then run this again.`);
    cfg[key] = v;
  }
  return cfg;
}

// How many builds speck run keeps going at once: this machine's value or speck/config.yml's, as loadConfig read it.
export function maxParallelBuilds(cfg) {
  const max = cfg.max_parallel_builds ?? 1;
  if (!Number.isInteger(max) || max < 1) throw new SpeckError(`max_parallel_builds in speck/config.yml must be a whole number of at least 1 (got "${max}").`);
  return max;
}

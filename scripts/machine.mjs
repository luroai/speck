// 0260: settings that can be set for this machine only. Their values are kept in the main checkout's speck/.cache/,
// which git ignores, so every worktree of the repo reads the same ones, and loadConfig uses them over speck/config.yml's.
// 0386: these are your own settings, which `speck config set` saves for this machine unless given --repo.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, parseYaml, worktreeList, yamlValue } from './core.mjs';
import { sharedCacheDir } from './turns.mjs';

export const MACHINE_SETTINGS = Object.freeze(['builder', 'builder_model', 'builder_effort', 'build_command', 'resume_command', 'reviewer', 'reviewer_model',
  'reviewer_effort', 'allow_same_model_review', 'auto_ship', 'auto_ship_risk', 'foreman', 'foreman_model', 'foreman_effort', 'foreman_fixing',
  'max_parallel_builds', 'max_parallel_tests']);

// What each holds as speck reads it, for checking this machine's file: a whole number, true or false, a list of
// risks, or text. `speck config set` checks each value fully before saving it.
const COUNTS = ['max_parallel_builds', 'max_parallel_tests'], FLAGS = ['allow_same_model_review', 'auto_ship'];
function machineProblem(key, v) {
  if (COUNTS.includes(key)) return Number.isSafeInteger(v) && v >= 1 ? null : ['a whole number of 1 or more', '<number>'];
  if (FLAGS.includes(key)) return typeof v === 'boolean' ? null : ['true or false', 'true|false'];
  if (key === 'auto_ship_risk') return Array.isArray(v) && v.length && v.every(r => r === 'low' || r === 'high') ? null : ['low, high or both', 'low,high'];
  return typeof v === 'string' ? null : ['text', '<value>'];
}

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
  return saveMachineValues(repo, [[key, value]])[0];
}

// 0386: the same for several settings at once, [key, value] each, so all are saved or none. Each value is written as
// speck/config.yml's are, so text, true/false and lists read back exactly, and nothing is written when one wouldn't.
export function saveMachineValues(repo, changes) {
  const file = machineConfigFile(repo), values = machineConfig(repo), was = changes.map(([key]) => values[key]);
  for (const [key, value] of changes) if (value === undefined) delete values[key]; else values[key] = value;
  const keys = MACHINE_SETTINGS.filter(k => Object.hasOwn(values, k));
  if (keys.length) {
    const text = `# This machine's own values, used over speck/config.yml's. Change them with speck config set.\n${keys.map(k => `${k}: ${yamlValue(values[k])}`).join('\n')}\n`;
    const read = parseYaml(text);
    for (const [key, value] of changes) if (value !== undefined && JSON.stringify(read[key]) !== JSON.stringify(value))
      throw new SpeckError(`Couldn't save ${key} for this machine so that speck reads it back as given. Set it in speck/config.yml with \`speck config set --repo ${key} <value>\` instead.`);
    sharedCacheDir(repo, 'machine');
    fs.writeFileSync(file, text);
  } else fs.rmSync(file, { force: true });
  return was;
}

// Puts this machine's values in `cfg`, read from speck/config.yml, refusing one speck can't read as that setting.
export function applyMachineConfig(repo, cfg) {
  for (const [key, v] of Object.entries(machineConfig(repo))) {
    const problem = machineProblem(key, v);
    if (problem)
      throw new SpeckError(`${key} set for this machine in ${machineConfigFile(repo)} must be ${problem[0]} (got ${JSON.stringify(v)}). Fix it with \`speck config set --machine ${key} ${problem[1]}\`, or remove it with \`speck config set --machine ${key} ""\`, then run this again.`);
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

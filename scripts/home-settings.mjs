// 0678: your own settings for every project on this machine, kept in your home folder's ~/.config/speck/config.yml and
// never in a repo. machine_parallel_tests is the only one: how many test runs speck starts go at once across all your
// projects, the turns for which are kept beside it, in ~/.config/speck/test-turns.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SpeckError, parseConfig, yamlValue } from './core.mjs';

export const HOME_SETTINGS = Object.freeze(['machine_parallel_tests']);

// The folder: ~/.config/speck, or SPECK_HOME_SETTINGS_DIR, which is for the tests, so they never read or write yours.
// '' when there's no home folder.
export function homeSettingsDir(env = process.env) {
  if (env.SPECK_HOME_SETTINGS_DIR) return env.SPECK_HOME_SETTINGS_DIR;
  try { return path.join(os.homedir(), '.config', 'speck'); } catch { return ''; }
}

const fileIn = dir => (dir ? path.join(dir, 'config.yml') : '');
// The file as messages name it, ~/.config/speck/config.yml unless the tests moved it.
export const homeSettingsShown = (env = process.env) => (env.SPECK_HOME_SETTINGS_DIR ? fileIn(env.SPECK_HOME_SETTINGS_DIR) : '~/.config/speck/config.yml');

// The values in the file, only the settings it can hold: {} when there's no file or no home folder.
export function homeSettings(env = process.env) {
  const file = fileIn(homeSettingsDir(env));
  if (!file) return {};
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw new SpeckError(`Can't read ${homeSettingsShown(env)} (${e.message}). Make it a readable file, or remove it, then run this again.`);
  }
  const read = parseConfig(text), out = {};
  for (const key of HOME_SETTINGS) if (Object.hasOwn(read, key)) out[key] = read[key];
  return out;
}

// machine_parallel_tests as speck uses it: a whole number of 1 or more, or null when it isn't set.
export function machineParallelTests(env = process.env) {
  const v = homeSettings(env).machine_parallel_tests;
  if (v === undefined || v === null || v === '') return null;
  if (!Number.isSafeInteger(v) || v < 1)
    throw new SpeckError(`machine_parallel_tests in ${homeSettingsShown(env)} must be a whole number of 1 or more (got ${JSON.stringify(v)}). Fix it with \`speck config set machine_parallel_tests 2\`, or remove it with \`speck config set machine_parallel_tests ""\`, then run this again.`);
  return v;
}

// `speck config set machine_parallel_tests <n>`, run in any project: saves it in the home folder's file, or removes
// it when `raw` is blank. Changes nothing in the repo.
export function setHomeSetting(key, raw, flagged) {
  const shown = homeSettingsShown();
  if (flagged) throw new SpeckError(`${key} is saved in ${shown} for every project of yours on this machine, so it takes no --repo or --machine. Run \`speck config set ${key} <number>\`, or \`speck config set ${key} ""\` to remove it.`);
  const text = String(raw).trim();
  const value = text === '' ? undefined : /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) && Number(text) >= 1 ? Number(text) : null;
  if (value === null) throw new SpeckError(`${key} must be a whole number of 1 or more, or "" to remove it (got ${JSON.stringify(raw)}). Nothing was changed.`);
  const dir = homeSettingsDir();
  if (!dir) throw new SpeckError(`There's no home folder to save ${key} in, so nothing was changed.`);
  const values = homeSettings();
  const before = values[key];
  if (value === undefined && before === undefined) { console.log(`${key} isn't set, so test runs have no limit across your projects on this machine.`); return; }
  if (value === undefined) delete values[key]; else values[key] = value;
  const keys = HOME_SETTINGS.filter(k => Object.hasOwn(values, k)), file = fileIn(dir);
  try {
    if (keys.length) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, `# Your own speck settings for every project on this machine. Change them with speck config set.\n${keys.map(k => `${k}: ${yamlValue(values[k])}`).join('\n')}\n`);
    } else fs.rmSync(file, { force: true });
  } catch (e) { throw new SpeckError(`Couldn't save ${key} in ${shown} (${e.message}), so nothing was changed. Make its folder writable, then run this again.`); }
  const show = v => (v === undefined ? 'not set' : JSON.stringify(v));
  console.log(`${key} (every project on this machine, in ${shown}): ${show(before)} → ${show(value)}`);
}

// Adds `speck config show`'s row for machine_parallel_tests to `groups`, after max_parallel_tests.
export function addHomeSettingRow(groups) {
  const building = groups.find(g => g.title === 'Building and reviewing')?.settings;
  if (!building) return;
  const across = machineParallelTests(), at = building.findIndex(s => s.key === 'max_parallel_tests');
  building.splice(at < 0 ? building.length : at + 1, 0, { key: 'machine_parallel_tests', value: across ?? '', is_default: across === null, speck_default: '', every_project: true,
    explain: `How many test runs speck starts go at once across every project of yours on this machine, the full suite's included, while the rest wait their turn. Blank leaves it to each project's max_parallel_tests. It's saved in ${homeSettingsShown()} for every project, with \`speck config set machine_parallel_tests <n>\`, and \`speck config set machine_parallel_tests ""\` removes it.` });
}

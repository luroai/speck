// 0678 / 0726: your own settings for every project on this machine, kept in your home folder's
// ~/.config/speck/config.yml and never in a repo. machine_parallel_tests caps test runs across all your projects
// (turns in ~/.config/speck/test-turns); machine_parallel_builds caps builds (turns in ~/.config/speck/build-turns).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SpeckError, parseConfig, yamlValue } from './core.mjs';

export const HOME_SETTINGS = Object.freeze(['machine_parallel_builds', 'machine_parallel_tests']);

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

// A whole-number home setting of 1 or more, or null when it isn't set.
function machineCount(key, env = process.env) {
  const v = homeSettings(env)[key];
  if (v === undefined || v === null || v === '') return null;
  if (!Number.isSafeInteger(v) || v < 1)
    throw new SpeckError(`${key} in ${homeSettingsShown(env)} must be a whole number of 1 or more (got ${JSON.stringify(v)}). Fix it with \`speck config set ${key} 2\`, or remove it with \`speck config set ${key} ""\`, then run this again.`);
  return v;
}

// machine_parallel_tests as speck uses it: a whole number of 1 or more, or null when it isn't set.
export function machineParallelTests(env = process.env) { return machineCount('machine_parallel_tests', env); }

// 0726: machine_parallel_builds as speck run uses it: a whole number of 1 or more, or null when it isn't set.
export function machineParallelBuilds(env = process.env) { return machineCount('machine_parallel_builds', env); }

const unsetMeans = {
  machine_parallel_tests: 'test runs have no limit across your projects on this machine',
  machine_parallel_builds: 'builds have no limit across your projects on this machine',
};

// The value `raw` saves for `key`: a whole number of 1 or more, or undefined for blank, which removes it. Refused as
// `speck config set` refuses it, with a SpeckError. 0707: the panel's Settings view checks it the same way.
export function homeSettingValue(key, raw) {
  const text = String(raw).trim();
  const value = text === '' ? undefined : /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) && Number(text) >= 1 ? Number(text) : null;
  if (value === null) throw new SpeckError(`${key} must be a whole number of 1 or more, or "" to remove it (got ${JSON.stringify(raw)}). Nothing was changed.`);
  return value;
}

// Saves `value` (from homeSettingValue) as `key` in the home folder's file, or removes it when undefined, printing
// nothing. Returns { before, value, changed }. Refused with a SpeckError, changing nothing. 0707: shared with the panel.
export function saveHomeSetting(key, value) {
  const shown = homeSettingsShown();
  const dir = homeSettingsDir();
  if (!dir) throw new SpeckError(`There's no home folder to save ${key} in, so nothing was changed.`);
  const values = homeSettings();
  const before = values[key];
  if (value === before || (value === undefined && !Object.hasOwn(values, key))) return { before, value, changed: false };
  if (value === undefined) delete values[key]; else values[key] = value;
  const keys = HOME_SETTINGS.filter(k => Object.hasOwn(values, k)), file = fileIn(dir);
  try {
    if (keys.length) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, `# Your own speck settings for every project on this machine. Change them with speck config set.\n${keys.map(k => `${k}: ${yamlValue(values[k])}`).join('\n')}\n`);
    } else fs.rmSync(file, { force: true });
  } catch (e) { throw new SpeckError(`Couldn't save ${key} in ${shown} (${e.message}), so nothing was changed. Make its folder writable, then run this again.`); }
  return { before, value, changed: true };
}

// `speck config set machine_parallel_tests|machine_parallel_builds <n>`, run in any project: saves it in the home
// folder's file, or removes it when `raw` is blank. Changes nothing in the repo.
export function setHomeSetting(key, raw, flagged) {
  const shown = homeSettingsShown();
  if (flagged) throw new SpeckError(`${key} is saved in ${shown} for every project of yours on this machine, so it takes no --repo or --machine. Run \`speck config set ${key} <number>\`, or \`speck config set ${key} ""\` to remove it.`);
  const value = homeSettingValue(key, raw);
  if (!homeSettingsDir()) throw new SpeckError(`There's no home folder to save ${key} in, so nothing was changed.`);
  if (value === undefined && homeSettings()[key] === undefined) { console.log(`${key} isn't set, so ${unsetMeans[key] || 'nothing changes'}.`); return; }
  const { before } = saveHomeSetting(key, value);
  const show = v => (v === undefined ? 'not set' : JSON.stringify(v));
  console.log(`${key} (every project on this machine, in ${shown}): ${show(before)} → ${show(value)}`);
}

// Adds `speck config show`'s rows for the home-folder limits: machine_parallel_builds after max_parallel_builds,
// machine_parallel_tests after max_parallel_tests.
export function addHomeSettingRow(groups) {
  const building = groups.find(g => g.title === 'Building and reviewing')?.settings;
  if (!building) return;
  const shown = homeSettingsShown();
  const builds = machineParallelBuilds(), atBuilds = building.findIndex(s => s.key === 'max_parallel_builds');
  building.splice(atBuilds < 0 ? building.length : atBuilds + 1, 0, { key: 'machine_parallel_builds', value: builds ?? '', is_default: builds === null, speck_default: '', every_project: true,
    explain: `How many builds speck run starts go at once across every project of yours on this machine, while ready tickets wait. Blank leaves it to each project's max_parallel_builds. It's saved in ${shown} for every project, with \`speck config set machine_parallel_builds <n>\`, and \`speck config set machine_parallel_builds ""\` removes it.` });
  const across = machineParallelTests(), at = building.findIndex(s => s.key === 'max_parallel_tests');
  building.splice(at < 0 ? building.length : at + 1, 0, { key: 'machine_parallel_tests', value: across ?? '', is_default: across === null, speck_default: '', every_project: true,
    explain: `How many test runs speck starts go at once across every project of yours on this machine, the full suite's included, while the rest wait their turn. Blank leaves it to each project's max_parallel_tests. It's saved in ${shown} for every project, with \`speck config set machine_parallel_tests <n>\`, and \`speck config set machine_parallel_tests ""\` removes it.` });
}

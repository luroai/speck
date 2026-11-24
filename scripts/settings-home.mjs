// 0707: the Settings view's home-folder settings, your own for every project on this machine (0678): their rows,
// and their save, which saves them in the home folder's file as `speck config set` does, without
// a commit, all or none with the project's settings.

import { SpeckError } from './core.mjs';
import { homeSettings, homeSettingsShown, homeSettingValue, saveHomeSetting } from './home-settings.mjs';
import { saveRepoSettings } from './settings.mjs';

// 0746: and machine_parallel_builds', the limit on builds.
const HOME_ROWS = Object.freeze({
  machine_parallel_builds: { label: 'Builds at once on this machine', summary: 'Builds at once across every project on this machine, not only this one.',
    explain: 'How many builds speck run starts go at once across every project of yours on this machine, not only this one, while ready tickets wait. Blank leaves it to each project\'s own Builds at once.' },
  machine_parallel_tests: { label: 'Test runs at once on this machine', summary: 'Test runs at once in every project on this machine, not only this one.',
    explain: 'How many test runs speck starts go at once across every project of yours on this machine, not only this one, the full suite\'s included, while the rest wait their turn. Blank leaves it to each project\'s own Test runs at once.' },
});
export const PANEL_HOME_SETTINGS = Object.freeze(Object.keys(HOME_ROWS));

// A home setting's row, with its value from the home folder's file, blank when it isn't set. A file that can't be read
// leaves it blank, saying why in its explanation.
export function homeRow(key) {
  let value = '', why = '';
  try { const v = homeSettings()[key]; value = v === undefined || v === null ? '' : v; }
  catch (e) { if (!(e instanceof SpeckError)) throw e; why = ` ${e.message}`; }
  const { label, summary, explain } = HOME_ROWS[key];
  return { key, label, summary, value, default: value === '', every_project: true, editable: true,
    explain: `${explain}${why} A change here is saved in ${homeSettingsShown()} for every project on this machine, without a commit.` };
}

const refusal = (status, refused) => ({ status, body: { error: [...new Set(Object.values(refused))].join('\n'), refused } });

// 0274: the panel's save of the settings changed in the Settings view, one at a time since 0731 (see saveRepoSettings). 0707: a change to
// one of PANEL_HOME_SETTINGS is checked as `speck config set` checks it, with the same reason when it's refused, and
// saved in the home folder's file, or removed from it when blank. Any change refused, here or by saveRepoSettings,
// and none is saved: the home folder's values are put back as they were.
export function panelSaveSettings(repo, changes, opts = {}) {
  const twice = changes.find((c, i) => changes.findIndex(d => d.key === c.key) !== i);
  if (twice) return { status: 400, body: { error: `${twice.key} is given more than once. Reload the panel, then try again.` } };
  const home = changes.filter(c => PANEL_HOME_SETTINGS.includes(c.key)), rest = changes.filter(c => !PANEL_HOME_SETTINGS.includes(c.key));
  if (!home.length) return saveRepoSettings(repo, rest, opts);
  const wanted = [], bad = {};
  for (const c of home) {
    try { wanted.push([c.key, homeSettingValue(c.key, c.value)]); } catch (e) { if (!(e instanceof SpeckError)) throw e; bad[c.key] = e.message; }
  }
  if (Object.keys(bad).length) return refusal(422, bad);
  let was;
  try { was = homeSettings(); } catch (e) { if (!(e instanceof SpeckError)) throw e; return refusal(422, Object.fromEntries(home.map(c => [c.key, e.message]))); }
  const saved = [];
  const undo = () => { for (const key of [...saved].reverse()) try { saveHomeSetting(key, was[key] ?? undefined); } catch { /* put back all it can */ } };
  try {
    for (const [key, value] of wanted) if (saveHomeSetting(key, value).changed) saved.push(key);
  } catch (e) {
    undo();
    if (!(e instanceof SpeckError)) throw e;
    return { status: 500, body: { error: e.message } };
  }
  let out;
  try { out = rest.length ? saveRepoSettings(repo, rest, opts) : { status: 200, body: { ok: true, changed: [] } }; }
  catch (e) { undo(); throw e; }
  if (out.status !== 200) { undo(); return out; }
  return { status: 200, body: { ...out.body, changed: [...out.body.changed, ...saved] } };
}

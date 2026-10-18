// The settings people tune, grouped as the panel's Settings view shows them, each with speck's default and a plain
// explanation of what it does (0257). One place for them, so the views that change settings can reuse them.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, loadConfig, parseYaml, findRepoRoot, EFFORTS } from './core.mjs';
import { sameModelProblem } from './same-model.mjs';
import { checkConfigValue, setConfigText, yamlValue } from './config.mjs';
import { commitTicketOnly } from './close.mjs';
import { MACHINE_SETTINGS, machineConfig, saveMachineValue } from './machine.mjs';
import { codexModelsAsync } from './codex-models.mjs';

export const SETTING_GROUPS = [
  { title: 'Shipping', settings: [
    { key: 'auto_ship', default: false,
      explain: 'When true, speck run ships each approved ticket whose risk auto_ship_risk lists: it is merged and pushed to the base branch without waiting for you. When false, every approved ticket waits for you to ship it.' },
    { key: 'auto_ship_risk', default: ['low'],
      explain: 'Which ticket risks auto_ship covers: low, high or both. While auto_ship is on, a ticket it covers is merged and pushed to the base branch without waiting for you, so adding high lets risky changes ship unseen too.' },
  ] },
  { title: 'Building and reviewing', settings: [
    { key: 'builder', default: 'claude',
      explain: 'The agent that builds each ticket, writing its tests and code. New tickets take it from here, so changing it changes who builds tickets made from now on.' },
    { key: 'builder_model', default: '',
      explain: 'The model every build speck run starts runs on, picked from the builder\'s models or written as the builder names it, and given to Claude Code builds, and to Codex builds when build_command is blank. Blank leaves it to the builder\'s own default.' },
    { key: 'reviewer', default: 'codex',
      explain: 'The agent that reviews each build and decides whether it is approved: codex, claude-subagent or a command you have set up. New tickets take it from here, so changing it changes who reviews tickets made from now on.' },
    { key: 'reviewer_model', default: '',
      explain: 'The model the reviewer runs on, written as the reviewer names it, or picked from the models Codex offers or Claude\'s model names. Blank leaves it to the reviewer\'s own default, and a ticket\'s own value overrides this one.' },
    { key: 'reviewer_effort', default: '',
      explain: 'How hard the reviewer thinks: low, medium, high, xhigh or max, any other effort Codex offers for its model, or blank for the reviewer\'s own default. More effort takes longer and costs more, but can catch more.' },
    { key: 'allow_same_model_review', default: false,
      explain: 'Whether the builder and reviewer may be the same model, needed only when they are in the same family (such as a Claude builder and a claude-subagent reviewer) and would run the same model, or when either model is left at its default. Leave it false so a different model checks the work: true lets a model review work like its own, which tends to catch less.' },
  ] },
  { title: 'How much runs at once', settings: [
    { key: 'max_parallel_builds', default: 1,
      explain: 'How many tickets speck run builds at once. More finish sooner, but use more of your computer and agent usage, and builds that change the same files are more likely to clash.' },
    { key: 'max_parallel_tests', default: 1,
      explain: 'How many test runs go at once in this project, from any build, while the rest wait their turn. Raising it shortens the wait, but can slow the computer down or make tests that share something fail.' },
  ] },
  { title: 'Ticket size limits', settings: [
    { key: 'limits.max_acceptance_criteria', default: 5,
      explain: 'The most acceptance criteria a ticket can have before speck refuses to set it ready and asks you to split it. Raising it allows bigger tickets, which are harder to review well.' },
    { key: 'limits.max_changed_lines', default: 300,
      explain: 'How many lines a build can change, not counting tests and lockfiles, before it stops and proposes a split. Raising it lets bigger changes through in one review.' },
    { key: 'limits.max_review_rounds', default: 3,
      explain: 'How many review rounds a build gets before it stops and asks you. More rounds let the builder fix more on its own, and fewer bring problems to you sooner.' },
  ] },
];

const own = (o, k) => o !== null && typeof o === 'object' && !Array.isArray(o) && Object.hasOwn(o, k);
// A setting's place in an object read from speck/config.yml, or undefined when it isn't there.
const lookup = (o, key) => key.split('.').reduce((at, k) => own(at, k) ? at[k] : undefined, o);

// 0258: the settings the panel can change, and 0259's auto_ship and auto_ship_risk, which it changes only once you've
// confirmed a change that lets more tickets ship by themselves. The rest stay read-only there: builder needs a matching
// build_command and allow_same_model_review weakens the independent review. 0279: and builder_model.
export const EDITABLE = Object.freeze(['builder_model', 'reviewer', 'reviewer_model', 'reviewer_effort', 'max_parallel_builds', 'max_parallel_tests',
  'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds', 'auto_ship', 'auto_ship_risk']);
const RISKS = ['low', 'high'];

// The only values a picker setting offers: a reviewer speck knows how to run, or blank and the effort levels.
function choicesOf(key, file) {
  if (key === 'reviewer') {
    const options = file.reviewer_options !== null && typeof file.reviewer_options === 'object' ? Object.keys(file.reviewer_options) : [];
    return [...new Set(['codex', 'claude-subagent', ...options])];
  }
  if (key === 'reviewer_effort') return ['', ...EFFORTS];
  if (key === 'auto_ship') return [true, false];
  if (key === 'auto_ship_risk') return RISKS; // any of them, ticked
  return undefined;
}

// A setting's value as speck reads it from the file's text: the file's own, or speck's default when it's missing.
function valueIn(text, repo, key) {
  const inFile = lookup(parseYaml(text), key) !== undefined, read = lookup(loadConfig(repo, { machine: false }), key);
  return { value: inFile && read !== undefined ? read : SETTING_GROUPS.flatMap(g => g.settings).find(s => s.key === key).default, inFile };
}

// Each group's settings, with the value speck reads from `repo`'s speck/config.yml now, and `default: true` for one
// missing from the file, which has speck's default. One the panel can change is `editable`, with its `choices` when
// it's picked from a list. 0261: one this machine can hold is `for_machine`, with the value speck uses, `from` 'machine'
// when that's this machine's own or 'repo' when it's speck/config.yml's, and speck/config.yml's in `repo_value`.
// 0276: `models`, from reviewerModels, is given back as `reviewer_models`, for the view to offer the reviewer's models.
// 0278: and Claude's model names as `claude_models`, for when claude-subagent is picked in the view.
// 0279: `builderModels`, from builderModels, is given back as `builder_models`, for the view to offer the builder's.
export function panelSettings(repo, { models, builderModels } = {}) {
  const text = fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'), file = parseYaml(text), mine = machineConfig(repo);
  return { groups: SETTING_GROUPS.map(g => ({ title: g.title, settings: g.settings.map(s => {
    const { value, inFile } = valueIn(text, repo, s.key), choices = choicesOf(s.key, file);
    const machine = !MACHINE_SETTINGS.includes(s.key) ? {}
      : Object.hasOwn(mine, s.key) ? { for_machine: true, from: 'machine', repo_value: value } : { for_machine: true, from: 'repo', repo_value: value };
    return { key: s.key, value: machine.from === 'machine' ? mine[s.key] : value, default: !inFile, explain: s.explain,
      editable: EDITABLE.includes(s.key), ...(choices ? { choices } : {}), ...machine };
  }) })), ...(models ? { reviewer_models: models } : {}), ...(builderModels ? { builder_models: builderModels } : {}), claude_models: CLAUDE_MODELS };
}

// 0278: the model names a claude-subagent reviewer takes, each meaning the newest model of its kind. Claude Code has no
// command that lists them, so they're written here. With no `efforts`, reviewer_effort offers speck's own.
export const CLAUDE_MODELS = Object.freeze(['fable', 'opus', 'sonnet', 'haiku']
  .map(slug => Object.freeze({ slug, about: `the newest ${slug[0].toUpperCase()}${slug.slice(1)}` })));

// 0276: the models the configured reviewer offers, read now, for the Settings view: { reviewer, models: [{ slug,
// efforts }] } when it can list them (Codex, or Claude's names from 0278), or { reviewer, why } in one line when it can't.
export async function reviewerModels(repo, read = codexModelsAsync) {
  const reviewer = String(loadConfig(repo).reviewer ?? '');
  if (reviewer === 'claude-subagent') return { reviewer, models: CLAUDE_MODELS };
  if (reviewer !== 'codex') return { reviewer, why: `${reviewer || 'This reviewer'} can't list its models, so type the model's name as it names it.` };
  return { reviewer, ...await read() };
}

// 0279: the models the configured builder offers, read now, for the Settings view: { builder, models } with Claude's
// model names for claude and the models Codex lists for codex, or { builder, why } in one line when it can't list them.
export async function builderModels(repo, read = codexModelsAsync) {
  const builder = String(loadConfig(repo).builder ?? '');
  if (builder === 'claude') return { builder, models: CLAUDE_MODELS };
  if (builder !== 'codex') return { builder, why: `${builder || 'This builder'} can't list its models, so type the model's name as it names it.` };
  return { builder, ...await read() };
}

const shown = v => Array.isArray(v) ? `[${v.join(', ')}]` : v === '' ? '""' : String(v);

// 0259: auto_ship and auto_ship_risk as speck's ship queue reads them (see autoShipRefusal in ship.mjs).
const shipping = cfg => ({ on: cfg.auto_ship === true, risks: [].concat(cfg.auto_ship_risk ?? []).map(String) });
// Which tickets ship by themselves with auto_ship on and these risks, in words: "approved low-risk tickets".
const covered = risks => `approved ${RISKS.filter(r => risks.includes(r)).map(r => `${r}-risk`).join(' and ')} tickets`;
// Whether going from `was` to `will` lets a ticket ship by itself that wouldn't before: then the risks that would ship,
// as the page names them when it asks ("low,high"), and in words.
export function loosens(was, will) {
  if (!will.on || (was.on && will.risks.every(r => was.risks.includes(r)))) return null;
  return { risks: RISKS.filter(r => will.risks.includes(r)).join(','), words: covered(will.risks) };
}

// `speck config show [--json]` (0269): each setting of the panel's Settings view, by group, with its value now, whether
// that's speck's default and the explanation the panel shows, so setup and the panel say the same thing.
export function cmdConfigShow(args) {
  const json = args.length === 1 && args[0] === '--json';
  if (args.length && !json) throw new SpeckError('Usage: speck config show [--json]');
  const defaults = Object.fromEntries(SETTING_GROUPS.flatMap(g => g.settings).map(s => [s.key, s.default]));
  const groups = panelSettings(findRepoRoot()).groups.map(g => ({ title: g.title, settings: g.settings.map(s => ({
    key: s.key, value: s.repo_value ?? s.value, is_default: JSON.stringify(s.repo_value ?? s.value) === JSON.stringify(defaults[s.key]), speck_default: defaults[s.key], explain: s.explain,
  })) }));
  if (json) { console.log(JSON.stringify({ groups }, null, 2)); return; }
  const show = v => Array.isArray(v) ? `[${v.join(', ')}]` : shown(v);
  console.log(groups.map(g => `${g.title}\n${g.settings.map(s =>
    `  ${s.key}: ${show(s.value)} (${s.is_default ? 'the default' : `speck's default is ${show(s.speck_default)}`})\n    ${s.explain}`).join('\n')}`).join('\n\n'));
}

// One setting's change, checked as `speck config set` does: the value speck would write in `want`, and `same` when the
// setting already has it, or why it's refused, in `status` and `error`. Nothing is written.
// 0261: with `machine`, the change is to this machine's own value, or clears it when `value` is blank.
function checkChange(repo, text, cfg, { key, value, machine }) {
  if (!EDITABLE.includes(key))
    return { status: 403, error: `${key} can't be changed from the panel. The panel changes only ${EDITABLE.join(', ')}: change the rest in speck/config.yml.` };
  if (machine && !MACHINE_SETTINGS.includes(key))
    return { status: 422, error: `Only ${MACHINE_SETTINGS.join(', ')} can be set for this machine, not ${key}. Save it for the repo instead.` };
  let want;
  try { want = machine && value === '' ? undefined : checkConfigValue(key, value); }
  catch (e) { if (e instanceof SpeckError) return { status: 422, error: e.message }; throw e; }
  if (machine) return { want, same: machineConfig(repo)[key] === want };
  if (key === 'reviewer_model' && /[\x00-\x1f\x7f]/.test(value))
    return { status: 422, error: 'reviewer_model must be on one line, with no tabs or other control characters.' };
  // 0276: reviewer_effort is checked as speck config set checks it, which accepts an effort Codex lists, such as ultra.
  const choices = key === 'reviewer_effort' ? undefined : choicesOf(key, parseYaml(text));
  if (choices && ![].concat(want).every(w => choices.includes(w)))
    return { status: 422, error: `${key} must be ${choices.map(shown).join(', ')} (got ${JSON.stringify(value)}).` };
  const same = key === 'auto_ship_risk' ? [...want].sort().join() === [].concat(valueIn(text, repo, key).value).map(String).sort().join()
    : JSON.stringify(valueIn(text, repo, key).value) === JSON.stringify(want);
  return { want, same };
}

// A refusal of the changes in `keys`, each for the same reason, or each for its own in `refused` (key → why).
const refusal = (status, refused, more = {}) => ({ status, body: { error: [...new Set(Object.values(refused))].join('\n'), refused, ...more } });
const each = (changes, why) => Object.fromEntries(changes.map(c => [c.key, why]));

// 0274: the panel's one Save, for every setting changed in the Settings view. `changes`: { key, value, machine } each,
// with `machine` for this machine's own value (0261). Each is checked first, and if any is refused nothing is saved,
// with why in `refused` by setting. Otherwise the repo's changes are written to speck/config.yml, rewriting only their
// lines, and committed in one commit of only that file on the base branch, and this machine's are saved, as
// `speck config set --machine` does. Settings already at the value given are left alone.
// A change that lets more tickets ship by themselves is refused unless `confirmed` names the risks that would then ship,
// as the dialog you confirmed did ("low,high"), so a page that read the settings before they changed can't confirm more (0259).
export function panelSaveSettings(repo, changes, { confirmed = null } = {}) {
  const twice = changes.find((c, i) => changes.findIndex(d => d.key === c.key) !== i);
  if (twice) return { status: 400, body: { error: `${twice.key} is given more than once. Reload the panel, then try again.` } };
  const file = path.join(repo, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8'), cfg = loadConfig(repo);
  const checked = changes.map(c => ({ ...c, ...checkChange(repo, text, cfg, c) }));
  const bad = checked.filter(c => c.error !== undefined);
  if (bad.length) return refusal(bad[0].status, Object.fromEntries(bad.map(c => [c.key, c.error])));
  // 0280: a reviewer of the builder's own family is refused only when the two would run the same model, or might, as
  // the settings would be once saved. So a change to builder_model or reviewer_model can be refused too.
  const models = checked.filter(c => !c.machine && ['reviewer', 'builder_model', 'reviewer_model'].includes(c.key));
  if (models.length && cfg.allow_same_model_review !== true) {
    const will = { ...cfg, ...Object.fromEntries(models.map(c => [c.key, c.want])) };
    const problem = sameModelProblem(String(will.builder ?? ''), String(will.reviewer ?? ''), will, will.reviewer_model);
    if (problem) return refusal(422, each(models, problem));
  }
  const toFile = checked.filter(c => !c.machine && !c.same), toMachine = checked.filter(c => c.machine && !c.same);
  let next = text;
  if (toFile.length) {
    const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
    if (branch !== cfg.base_branch)
      return refusal(409, each(toFile, `This checkout is on "${branch}", not ${cfg.base_branch}, so the setting would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.`));
    const dirty = sh('git', ['status', '--porcelain', '--', 'speck/config.yml'], { cwd: repo });
    if (dirty.status !== 0 || dirty.stdout.trim())
      return refusal(409, each(toFile, 'speck/config.yml has uncommitted changes, so saving would commit them too. Commit or undo them, then try again.'));
    const now = shipping(cfg), will = { ...now };
    for (const c of toFile) if (c.key === 'auto_ship') will.on = c.want === true; else if (c.key === 'auto_ship_risk') will.risks = [].concat(c.want).map(String);
    const ships = toFile.filter(c => c.key === 'auto_ship' || c.key === 'auto_ship_risk'), more = ships.length ? loosens(now, will) : null;
    if (more && confirmed !== more.risks)
      return refusal(409, each(ships, `That would let ${more.words} merge and push to ${cfg.base_branch} without waiting for you, which hasn't been confirmed. Check the settings as they are now, then save again.`), { confirm: true });
    for (const c of toFile) next = setConfigText(next, c.key.split('.'), yamlValue(c.want));
    const read = parseYaml(next), unread = toFile.filter(c => JSON.stringify(lookup(read, c.key)) !== JSON.stringify(c.want));
    if (unread.length)
      return refusal(422, Object.fromEntries(unread.map(c => [c.key, `Couldn't write ${c.key} so that speck reads it back as given. Edit speck/config.yml by hand instead.`])));
  }
  // This machine's first, so that a write or commit that fails can put them back, and speck/config.yml as it was.
  const before = machineConfig(repo), undo = () => {
    for (const c of toMachine) try { saveMachineValue(repo, c.key, before[c.key]); } catch { /* put back all it can */ }
    if (toFile.length) try { if (fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text); } catch { /* as above */ }
  };
  try {
    for (const c of toMachine) saveMachineValue(repo, c.key, c.want);
    if (toFile.length) {
      fs.writeFileSync(file, next);
      const commit = commitTicketOnly(repo, file, text, `speck: config ${toFile.map(c => `${c.key} ${shown(c.want)}`).join('; ')}`);
      if (commit.status !== 0) {
        undo();
        return { status: 500, body: { error: `Couldn't commit speck/config.yml, so nothing was saved:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
      }
    }
  } catch (e) {
    undo();
    return { status: 500, body: { error: `Couldn't save the settings, so nothing was saved: ${e.message}` } };
  }
  return { status: 200, body: { ok: true, changed: [...toFile, ...toMachine].map(c => c.key) } };
}

// One setting's change, saved as panelSaveSettings saves several, with `changed` true when it changed anything.
export function panelSetSetting(repo, key, value, { confirmed = null, machine = false } = {}) {
  const out = panelSaveSettings(repo, [{ key, value, machine }], { confirmed });
  if (out.status !== 200) { delete out.body.refused; return out; }
  return { status: 200, body: { ok: true, changed: out.body.changed.length > 0 } };
}

// The panel's POST /api/settings/<key>/<value>, with both still written as in the address: every failure is an answer.
// `confirmed`: the risks in the address's ?confirm=, sent once you've confirmed a change that lets more tickets ship (0259).
// `scope`: the address's ?scope=, 'machine' for this machine only (0261), or none for the repo.
export function panelSettingRequest(repo, rawKey, rawValue, confirmed = null, scope = null) {
  let key, value;
  try { key = decodeURIComponent(rawKey); value = decodeURIComponent(rawValue); }
  catch { return { status: 400, body: { error: 'That setting or value isn\'t written properly in the address. Reload the panel, then try again.' } }; }
  if (scope !== null && scope !== 'machine')
    return { status: 400, body: { error: `A setting is saved for this machine (scope=machine) or the repo (no scope), not ${JSON.stringify(scope)}. Reload the panel, then try again.` } };
  try { return panelSetSetting(repo, key, value, { confirmed, machine: scope === 'machine' }); }
  catch (e) { return { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }; }
}

// 0274: the panel's POST /api/settings/save, the Settings view's one Save. Its address's query gives each change, as
// repo:<key>=<value> for the repo or machine:<key>=<value> for this machine only, and confirm=<risks> once you've
// confirmed a change that lets more tickets ship by themselves (0259).
export function panelSaveRequest(repo, query) {
  const changes = [];
  let confirmed = null;
  for (const [name, value] of new URLSearchParams(query)) {
    const m = name.match(/^(repo|machine):(.+)$/);
    if (name === 'confirm' && confirmed === null) confirmed = value;
    else if (m) changes.push({ key: m[2], value, machine: m[1] === 'machine' });
    else return { status: 400, body: { error: `The panel doesn't save ${JSON.stringify(name)}. Reload the panel, then try again.` } };
  }
  try { return panelSaveSettings(repo, changes, { confirmed }); }
  catch (e) { return { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }; }
}

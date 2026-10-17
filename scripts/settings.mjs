// The settings people tune, grouped as the panel's Settings view shows them, each with speck's default and a plain
// explanation of what it does (0257). One place for them, so the views that change settings can reuse them.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, loadConfig, parseYaml, modelFamily, findRepoRoot, EFFORTS } from './core.mjs';
import { checkConfigValue, setConfigText, yamlValue } from './config.mjs';
import { commitTicketOnly } from './close.mjs';

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
    { key: 'reviewer', default: 'codex',
      explain: 'The agent that reviews each build and decides whether it is approved: codex, claude-subagent or a command you have set up. New tickets take it from here, so changing it changes who reviews tickets made from now on.' },
    { key: 'reviewer_model', default: '',
      explain: 'The model the reviewer runs on, written as the reviewer names it. Blank leaves it to the reviewer\'s own default, and a ticket\'s own value overrides this one.' },
    { key: 'reviewer_effort', default: '',
      explain: 'How hard the reviewer thinks: low, medium, high, xhigh or max, or blank for the reviewer\'s own default. More effort takes longer and costs more, but can catch more.' },
    { key: 'allow_same_model_review', default: false,
      explain: 'Whether the builder and reviewer may be the same model. Leave it false so a different model checks the work: true lets a model review work like its own, which tends to catch less.' },
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
// build_command and allow_same_model_review weakens the independent review.
export const EDITABLE = Object.freeze(['reviewer', 'reviewer_model', 'reviewer_effort', 'max_parallel_builds', 'max_parallel_tests',
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
// it's picked from a list.
export function panelSettings(repo) {
  const text = fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'), file = parseYaml(text);
  return { groups: SETTING_GROUPS.map(g => ({ title: g.title, settings: g.settings.map(s => {
    const { value, inFile } = valueIn(text, repo, s.key), choices = choicesOf(s.key, file);
    return { key: s.key, value, default: !inFile, explain: s.explain, editable: EDITABLE.includes(s.key), ...(choices ? { choices } : {}) };
  }) })) };
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
    key: s.key, value: s.value, is_default: JSON.stringify(s.value) === JSON.stringify(defaults[s.key]), speck_default: defaults[s.key], explain: s.explain,
  })) }));
  if (json) { console.log(JSON.stringify({ groups }, null, 2)); return; }
  const show = v => Array.isArray(v) ? `[${v.join(', ')}]` : shown(v);
  console.log(groups.map(g => `${g.title}\n${g.settings.map(s =>
    `  ${s.key}: ${show(s.value)} (${s.is_default ? 'the default' : `speck's default is ${show(s.speck_default)}`})\n    ${s.explain}`).join('\n')}`).join('\n\n'));
}

// The panel's Save on a setting: checks the value as `speck config set` does, rewrites only that setting's line in
// speck/config.yml and commits only that file on the base branch. Every refusal comes before the first write.
// A change that lets more tickets ship by themselves is refused unless `confirmed` names the risks that would then ship,
// as the dialog you confirmed did ("low,high"), so a page that read the settings before they changed can't confirm more (0259).
export function panelSetSetting(repo, key, value, { confirmed = null } = {}) {
  if (!EDITABLE.includes(key))
    return { status: 403, body: { error: `${key} can't be changed from the panel. The panel changes only ${EDITABLE.join(', ')}: change the rest in speck/config.yml.` } };
  const file = path.join(repo, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8'), cfg = loadConfig(repo);
  let want;
  try { want = checkConfigValue(key, value); } catch (e) { if (e instanceof SpeckError) return { status: 422, body: { error: e.message } }; throw e; }
  if (key === 'reviewer_model' && /[\x00-\x1f\x7f]/.test(value))
    return { status: 422, body: { error: 'reviewer_model must be on one line, with no tabs or other control characters.' } };
  const choices = choicesOf(key, parseYaml(text));
  if (choices && ![].concat(want).every(w => choices.includes(w)))
    return { status: 422, body: { error: `${key} must be ${choices.map(shown).join(', ')} (got ${JSON.stringify(value)}).` } };
  if (key === 'reviewer' && modelFamily(String(cfg.builder)) === modelFamily(want) && cfg.allow_same_model_review !== true)
    return { status: 422, body: { error: `reviewer "${want}" is the same agent as the builder, "${cfg.builder}", and allow_same_model_review is false. Pick a reviewer other than ${cfg.builder}.` } };
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the setting would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  const dirty = sh('git', ['status', '--porcelain', '--', 'speck/config.yml'], { cwd: repo });
  if (dirty.status !== 0 || dirty.stdout.trim())
    return { status: 409, body: { error: 'speck/config.yml has uncommitted changes, so saving would commit them too. Commit or undo them, then try again.' } };
  const same = key === 'auto_ship_risk' ? [...want].sort().join() === [].concat(valueIn(text, repo, key).value).map(String).sort().join()
    : JSON.stringify(valueIn(text, repo, key).value) === JSON.stringify(want);
  if (same) return { status: 200, body: { ok: true, changed: false } };
  const now = shipping(cfg), more = key === 'auto_ship' || key === 'auto_ship_risk' ? loosens(now, { ...now, [key === 'auto_ship' ? 'on' : 'risks']: want }) : null;
  if (more && confirmed !== more.risks)
    return { status: 409, body: { confirm: true, error: `That would let ${more.words} merge and push to ${cfg.base_branch} without waiting for you, which hasn't been confirmed. Check the settings as they are now, then save again.` } };
  const keys = key.split('.');
  const next = setConfigText(text, keys, yamlValue(want));
  if (JSON.stringify(lookup(parseYaml(next), key)) !== JSON.stringify(want))
    return { status: 422, body: { error: `Couldn't write ${key} so that speck reads it back as given. Edit speck/config.yml by hand instead.` } };
  fs.writeFileSync(file, next);
  const commit = commitTicketOnly(repo, file, text, `speck: config ${key} ${shown(want)}`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit speck/config.yml, so ${key} is unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, changed: true } };
}

// The panel's POST /api/settings/<key>/<value>, with both still written as in the address: every failure is an answer.
// `confirmed`: the risks in the address's ?confirm=, sent once you've confirmed a change that lets more tickets ship (0259).
export function panelSettingRequest(repo, rawKey, rawValue, confirmed = null) {
  let key, value;
  try { key = decodeURIComponent(rawKey); value = decodeURIComponent(rawValue); }
  catch { return { status: 400, body: { error: 'That setting or value isn\'t written properly in the address. Reload the panel, then try again.' } }; }
  try { return panelSetSetting(repo, key, value, { confirmed }); }
  catch (e) { return { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }; }
}

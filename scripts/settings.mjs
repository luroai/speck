// The settings people tune, grouped as the panel's Settings view shows them, each with speck's default and a plain
// explanation of what it does (0257). One place for them, so the views that change settings can reuse them.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, loadConfig, parseConfig, findRepoRoot, EFFORTS } from './core.mjs';
import { sameModelProblem } from './same-model.mjs';
import { checkConfigValue, setConfigText, yamlValue } from './config.mjs';
import { commitTicketOnly } from './close.mjs';
import { FIXING } from './foreman.mjs';
import { FOREMAN_AGENTS, foremanAgentOf } from './foreman-agent.mjs';
import { SHIP_MODES } from './pull-request.mjs';
import { MACHINE_SETTINGS, machineConfig, saveMachineValues } from './machine.mjs';
import { codexModelsAsync } from './codex-models.mjs';
import { agentModelsAsync, offeredModels, offeredModelsAsync, findAgentsAsync } from './agents.mjs';
import { OWN_BUILD_COMMANDS, ownBuildCommand, handSetBuildCommand, otherFamilyReviewer, describeBuildCommand, clearsBuilderModel } from './builder-switch.mjs';
import { buildsEachTicket } from './build-model.mjs';
import { knownProviders } from './custom-providers.mjs';
import { providerNamed } from './provider-review.mjs';
import { keysStatus, saveProviderKey } from './keys.mjs';
import { yourAgentsView, addAgent, removeAgent } from './your-agents.mjs';
export { panelProviderAddRequest } from './provider-form.mjs'; // 0401

export const SETTING_GROUPS = [
  // 0286: the panel shows this group's settings in its own group, under the speck run switch. 0486: Watching, was Foreman.
  { title: 'Watching', settings: [
    { key: 'watch', default: 'tell', // 0487: were foreman_fixing, foreman, foreman_model and foreman_effort
      explain: 'What speck does when a build stops with a question: off leaves it to you, tell also counts it under Needs you, and fix takes the build\'s recommendation when no option changes anything you\'d notice and the recommendation is a clear winner, then starts the build again, once per ticket. With fix, it also starts an agent to look into work that stops for a reason speck has no steps for, which resumes the build, ships it again once, makes a draft fix ticket or asks you.' },
    // 0287: the agent speck looks into stops with
    { key: 'watch_agent', default: '',
      explain: 'The agent speck runs on when it looks into work that stopped for a reason speck has no steps for: claude, codex, cursor or a model provider, such as DeepSeek, with your own API key for it. Blank uses the builder when that\'s codex, cursor or a model provider, and claude otherwise.' },
    { key: 'watch_model', default: '',
      explain: 'The model speck\'s agent runs on, picked from that agent\'s models or written as it names it. Blank leaves it to the agent\'s own default.' },
    { key: 'watch_effort', default: '',
      explain: 'How hard speck\'s agent thinks: low, medium, high, xhigh or max, or blank for the agent\'s own default. Cursor isn\'t given it, as its model names carry the effort.' },
  ] },
  { title: 'Shipping', settings: [
    { key: 'auto_ship', default: false,
      explain: 'When true, speck run ships each approved ticket whose risk auto_ship_risk lists: it is merged and pushed to the base branch without waiting for you. When false, every approved ticket waits for you to ship it.' },
    { key: 'auto_ship_risk', default: ['low'],
      explain: 'Which ticket risks auto_ship covers: low, high or both. While auto_ship is on, a ticket it covers is merged and pushed to the base branch without waiting for you, so adding high lets risky changes ship unseen too.' },
    // 0295
    { key: 'ship_mode', default: 'local',
      explain: 'How an approved ticket ships. local: speck merges it into the base branch on this computer and pushes it. pr: once a ticket is approved, speck pushes its branch and opens a pull request into the base branch on GitHub with gh, with its review pack, and shipping it merges that pull request on GitHub once its checks pass, as speck run does for each ticket auto_ship covers. Needs gh installed and signed in.' },
  ] },
  { title: 'Building and reviewing', settings: [
    { key: 'builder', default: 'claude',
      explain: 'The agent that builds each ticket, writing its tests and code: claude, codex, cursor or a model provider, such as DeepSeek, with your own API key for it, offered when it\'s installed and signed in. A ticket that doesn\'t name its own builder takes it from here when its build starts, so changing it changes who builds those tickets, sets build_command to the new builder\'s own, asking first when that was set by hand, and clears builder_model when the new builder doesn\'t offer it or its models can\'t be read.' },
    { key: 'builder_model', default: '',
      explain: 'The model every build speck run starts runs on, picked from the builder\'s models or written as the builder names it, and given to Claude Code builds, to Codex builds when build_command is blank, and to Cursor builds when it is blank too. Blank leaves it to the builder\'s own default.' },
    // 0402
    { key: 'builder_effort', default: '',
      explain: 'How hard the builder thinks: low, medium, high, xhigh or max, any other effort Codex offers for its model, or blank for the builder\'s own default. It\'s given to Claude Code builds and to Codex builds when build_command is blank, but not to Cursor, whose model names carry the effort, or a model provider.' },
    { key: 'reviewer', default: 'codex',
      explain: 'The agent that reviews each build and decides whether it is approved: codex, claude (Claude Code, run by speck, for any builder), claude-subagent (a Claude Code subagent the builder starts, for Claude Code builders), cursor, a model provider, such as DeepSeek, with your own API key for it, or a command you have set up. A ticket that doesn\'t name its own reviewer takes it from here when each review round starts, so changing it changes who reviews those tickets from their next round.' },
    { key: 'reviewer_model', default: '',
      explain: 'The model the reviewer runs on, written as the reviewer names it, or picked from the models Codex or Cursor offers or Claude\'s model names. Blank leaves it to the reviewer\'s own default, and a ticket\'s own value overrides this one.' },
    { key: 'reviewer_effort', default: '',
      explain: 'How hard the reviewer thinks: low, medium, high, xhigh or max, any other effort Codex offers for its model, or blank for the reviewer\'s own default. More effort takes longer and costs more, but can catch more.' },
    { key: 'allow_same_model_review', default: false,
      explain: 'Whether the builder and reviewer may be the same model, needed only when they are in the same family (such as a Claude builder and a claude-subagent reviewer) and would run the same model, or when either model is left at its default (a Cursor build left at its default runs on auto, which counts as a model of its own when speck starts the build). Leave it false so a different model checks the work: true lets a model review work like its own, which tends to catch less.' },
    // 0406: parallel runs and ticket size limits sit here too, after the builder and reviewer
    { key: 'max_parallel_builds', default: 1,
      explain: 'How many tickets speck run builds at once. More finish sooner, but use more of your computer and agent usage, and builds that change the same files are more likely to clash.' },
    { key: 'max_parallel_tests', default: 1,
      explain: 'How many test runs go at once in this project, from any build, while the rest wait their turn. Raising it shortens the wait, but can slow the computer down or make tests that share something fail.' },
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
// confirmed a change that lets more tickets ship by themselves. The rest stay read-only there: allow_same_model_review
// weakens the independent review. 0279: and builder_model. 0293: and builder, which sets build_command with it.
export const EDITABLE = Object.freeze(['builder', 'builder_model', 'builder_effort', 'reviewer', 'reviewer_model', 'reviewer_effort', 'max_parallel_builds', 'max_parallel_tests',
  'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds', 'auto_ship', 'auto_ship_risk', 'ship_mode', 'watch', 'watch_agent', 'watch_model', 'watch_effort']);
const RISKS = ['low', 'high'];

// The only values a picker setting offers: a reviewer speck knows how to run, or blank and the effort levels.
// 0393: the builder, reviewer and Foreman lists offer each model provider in `providers` too.
function choicesOf(key, file, providers = knownProviders()) {
  const named = providers.map(p => p.name);
  if (key === 'reviewer') {
    const options = file.reviewer_options !== null && typeof file.reviewer_options === 'object' ? Object.keys(file.reviewer_options) : [];
    return [...new Set(['codex', 'claude', 'claude-subagent', 'cursor', ...named, ...options])]; // 0347: and cursor
  }
  if (key === 'builder') return [...new Set([...Object.keys(OWN_BUILD_COMMANDS), ...named])]; // 0293: the builders speck starts by itself
  if (key === 'reviewer_effort' || key === 'builder_effort') return ['', ...EFFORTS]; // 0402: and the builder's
  if (key === 'auto_ship') return [true, false];
  if (key === 'auto_ship_risk') return RISKS; // any of them, ticked
  if (key === 'watch') return [...FIXING]; // 0286
  if (key === 'ship_mode') return [...SHIP_MODES]; // 0295
  if (key === 'watch_agent') return [...new Set(['', ...FOREMAN_AGENTS, ...named])]; // 0287
  if (key === 'watch_effort') return ['', ...EFFORTS];
  return undefined;
}

// A setting's value as speck reads it from the file's text: the file's own, or speck's default when it's missing.
function valueIn(text, repo, key) {
  const inFile = lookup(parseConfig(text), key) !== undefined, read = lookup(loadConfig(repo, { machine: false }), key);
  return { value: inFile && read !== undefined ? read : SETTING_GROUPS.flatMap(g => g.settings).find(s => s.key === key).default, inFile };
}

// Each group's settings, with the value speck reads from `repo`'s speck/config.yml now, and `default: true` for one
// missing from the file, which has speck's default. One the panel can change is `editable`, with its `choices` when
// it's picked from a list. 0261: one this machine can hold is `for_machine`, with the value speck uses, `from` 'machine'
// when that's this machine's own or 'repo' when it's speck/config.yml's, and speck/config.yml's in `repo_value`.
// 0276: `models`, from reviewerModels, is given back as `reviewer_models`, for the view to offer the reviewer's models.
// 0278: and Claude's model names as `claude_models`, for when claude-subagent (or 0292's claude) is picked in the view.
// 0279: `builderModels`, from builderModels, is given back as `builder_models`, for the view to offer the builder's.
// 0348: `foremanModels`, from foremanModels, is given back as `foreman_models`, for the view to offer the Foreman agent's.
// 0288: with `agents`, from findAgentsAsync, reviewer offers only the reviewers whose agent is installed and signed in,
// and the current value, with why the others are left out in `missing`, one line.
// 0393: each model provider in `providers`, given back in `providers` with its label, its models and whether this
// machine has its key (never the key), is offered as builder, reviewer and Foreman while Claude Code is installed.
export function panelSettings(repo, { models, builderModels, foremanModels, agents, providers = knownProviders(repo) } = {}) {
  const text = fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'), file = parseConfig(text), mine = machineConfig(repo);
  return { groups: SETTING_GROUPS.map(g => ({ title: g.title, settings: g.settings.map(s => {
    const { value, inFile } = valueIn(text, repo, s.key), all = choicesOf(s.key, file, providers);
    // 0393: the one set now is the one the view shows: this machine's when it has its own.
    const now = String((MACHINE_SETTINGS.includes(s.key) && Object.hasOwn(mine, s.key) ? mine[s.key] : value) ?? '');
    const { choices, missing } = ['reviewer', 'builder', 'watch_agent'].includes(s.key) && agents ? readyReviewers(all, agents, now, s.key, providers) : { choices: all };
    // 0293: build_command as the file has it, whether it was set by hand, and each builder's own, for the view to say
    // what switching the builder sets it to, and to ask first when it replaces one set by hand. 0324: and whether speck
    // run builds each ticket with its own builder with it, so the view says when it doesn't.
    // 0387: as speck uses it, this machine's over speck/config.yml's, as switching the builder saves it for this machine.
    const used = { ...file, ...mine };
    const build = s.key !== 'builder' ? {} : { build_command: { value: used.build_command === undefined || used.build_command === null ? null : String(used.build_command),
      hand_set: handSetBuildCommand(used), each_ticket: buildsEachTicket(used.build_command ?? ''), own: { ...OWN_BUILD_COMMANDS, ...Object.fromEntries(providers.map(p => [p.name, ''])) } } }; // 0401: and yours
    const machine = !MACHINE_SETTINGS.includes(s.key) ? {}
      : Object.hasOwn(mine, s.key) ? { for_machine: true, from: 'machine', repo_value: value } : { for_machine: true, from: 'repo', repo_value: value };
    return { key: s.key, value: machine.from === 'machine' ? mine[s.key] : value, default: !inFile, explain: explainFully(s),
      editable: EDITABLE.includes(s.key), ...(choices ? { choices } : {}), ...(missing ? { missing } : {}), ...build, ...machine };
  }) })), ...(models ? { reviewer_models: models } : {}), ...(builderModels ? { builder_models: builderModels } : {}),
    ...(foremanModels ? { foreman_models: foremanModels } : {}), claude_models: CLAUDE_MODELS, providers: providersShown(repo, providers) };
}

// 0397: a setting's explanation, ending with what speck uses when it isn't set, unless the explanation already says what
// blank does, and then where a change to it is saved.
export function explainFully(s) {
  const unset = s.default === '' ? '' : ` When it isn't set, speck uses ${Array.isArray(s.default) ? s.default.join(' and ') : String(s.default)}.`;
  const saved = !EDITABLE.includes(s.key) ? ' It\'s changed in speck/config.yml rather than here, and saved there for the project, with a commit.'
    : MACHINE_SETTINGS.includes(s.key) ? ' A change here is saved for your machine only, without a commit.'
      : ' A change here is saved for the project in speck/config.yml, with a commit.';
  return `${s.explain}${unset}${saved}`;
}

// 0393: a provider's models as the Settings view lists them, its default model said as such.
const providerModels = p => p.models.map(slug => ({ slug, display_name: null, description: slug === p.defaultModel ? `${p.label}'s default` : null }));

// 0393: each provider in `providers` as the Settings view shows it, with whether this machine has its key, never the
// key itself. A keys file that can't be read counts as no key, with why in `key_why`.
function providersShown(repo, providers) {
  let set = null, why = null;
  try { set = new Map(keysStatus(repo, { providers }).map(k => [k.name, k.set])); } catch (e) { why = e instanceof SpeckError ? e.message : String(e?.message ?? e); }
  return providers.map(p => ({ name: p.name, label: p.label, models: providerModels(p), default_model: p.defaultModel,
    key_set: set ? set.get(p.name) === true : false, ...(why ? { key_why: why } : {}) }));
}

// 0278: the model names a claude-subagent reviewer (or 0292's claude) takes, each meaning the newest model of its kind. Claude Code has no
// command that lists them, so they're written here. With no `efforts`, reviewer_effort offers speck's own.
// 0288: each with a display name and description, as Codex gives its models.
export const CLAUDE_MODELS = Object.freeze(['fable', 'opus', 'sonnet', 'haiku'].map(slug => {
  const kind = `${slug[0].toUpperCase()}${slug.slice(1)}`;
  return Object.freeze({ slug, display_name: kind, description: `Always the newest ${kind} model` });
}));

// 0288: the agent each built-in reviewer runs on. A reviewer set up as a command under reviewer_options is offered as
// it is: speck can't tell what it runs. 0293: with `builders`, each choice is a builder, run on the agent of its name.
// 0393: `key` is the setting, builder, reviewer or foreman. The Foreman's list leaves out only providers. A provider in
// `providers` runs through Claude Code, so it needs Claude Code installed, though not signed in.
const REVIEWER_AGENTS = { codex: 'codex', claude: 'claude', 'claude-subagent': 'claude', cursor: 'cursor' };
function readyReviewers(choices, { agents }, current, key, providers = knownProviders()) {
  const byId = new Map((Array.isArray(agents) ? agents : []).map(a => [a.id, a]));
  const left = [], cant = [];
  const kept = choices.filter(c => {
    const p = providerNamed(c, providers);
    if (p) {
      const claude = byId.get('claude');
      if (!claude || claude.installed) return true;
      const why = `speck runs ${p.label}'s models through Claude Code, and Claude Code isn't installed`;
      if (c !== current) { left.push(`${p.label} (${why})`); return false; }
      cant.push(`${p.label} can't run here: ${why}.`); // chosen already, so still offered
      return true;
    }
    if (key === 'watch_agent') return true;
    const agent = key === 'builder' ? byId.get(c) : Object.hasOwn(REVIEWER_AGENTS, c) ? byId.get(REVIEWER_AGENTS[c]) : undefined;
    if (!agent || (agent.installed && agent.signed_in) || c === current) return true;
    left.push(`${c} (${String(agent.why || `${agent.name} isn't ready.`).replace(/\.$/, '')})`);
    return false;
  });
  const said = [...(left.length ? [`Not offered: ${left.join('; ')}.`] : []), ...cant];
  return { choices: kept, ...(said.length ? { missing: said.join(' ') } : {}) };
}

// 0276: the models the configured reviewer offers, read now, for the Settings view: { reviewer, models: [{ slug,
// efforts }] } when it can list them (Codex, or Claude's names from 0278), or { reviewer, why } in one line when it can't.
// 0347: and the models Cursor lists for cursor, as builderModels reads them.
// 0393: and a model provider's, from speck's list.
export async function reviewerModels(repo, read = codexModelsAsync, readCursor = () => agentModelsAsync('cursor'), providers = knownProviders(repo)) {
  const reviewer = String(loadConfig(repo).reviewer ?? '');
  if (reviewer === 'claude' || reviewer === 'claude-subagent') return { reviewer, models: CLAUDE_MODELS };
  if (providerNamed(reviewer, providers)) return { reviewer, models: providerModels(providerNamed(reviewer, providers)) };
  if (reviewer === 'cursor') return { reviewer, ...await readCursor() };
  if (reviewer !== 'codex') return { reviewer, why: `${reviewer || 'This reviewer'} can't list its models, so type the model's name as it names it.` };
  return { reviewer, ...await read() };
}

// 0279: the models the configured builder offers, read now, for the Settings view: { builder, models } with Claude's
// model names for claude and the models Codex lists for codex, or { builder, why } in one line when it can't list them.
// 0288: and the models Cursor lists for cursor.
export async function builderModels(repo, read = codexModelsAsync, readCursor = () => agentModelsAsync('cursor'), providers = knownProviders(repo)) {
  const builder = String(loadConfig(repo).builder ?? '');
  if (builder === 'claude') return { builder, models: CLAUDE_MODELS };
  if (providerNamed(builder, providers)) return { builder, models: providerModels(providerNamed(builder, providers)) }; // 0393
  if (builder === 'cursor') return { builder, ...await readCursor() };
  if (builder !== 'codex') return { builder, why: `${builder || 'This builder'} can't list its models, so type the model's name as it names it.` };
  return { builder, ...await read() };
}

// 0348: the models of the agent the Foreman runs on (foremanAgentOf), read now, for the Settings view: { foreman, models }
// with Claude's model names for claude and the models Codex or Cursor lists, or { foreman, why } in one line when it can't.
export async function foremanModels(repo, read = codexModelsAsync, readCursor = () => agentModelsAsync('cursor'), providers = knownProviders(repo)) {
  const foreman = foremanAgentOf(loadConfig(repo), providers);
  if (foreman === 'claude') return { foreman, models: CLAUDE_MODELS };
  if (providerNamed(foreman, providers)) return { foreman, models: providerModels(providerNamed(foreman, providers)) }; // 0393
  return { foreman, ...await (foreman === 'cursor' ? readCursor() : read()) };
}

// 0257: what the panel's GET /api/settings answers: panelSettings, with the models the reviewer (0276), the builder
// (0279) and the Foreman agent (0348) offer, read now, asking Codex once and Cursor once (0347) when more than one runs on
// it, and which agents are installed and signed in (0288), read at the same time. Throws when speck/config.yml can't be read.
// 0393: and each model provider in `providers`.
export async function settingsAnswer(repo, readCodex = codexModelsAsync, readCursorModels = () => agentModelsAsync('cursor', { defaults: true }), find = findAgentsAsync, providers = knownProviders(repo)) {
  let asked = null, cursorAsked = null;
  const read = () => (asked ??= readCodex()), readCursor = () => (cursorAsked ??= readCursorModels());
  const found = Promise.resolve().then(() => find({ models: false })).catch(() => undefined);
  let models, built, foreman;
  try { models = await reviewerModels(repo, read, readCursor, providers); } catch (e) { models = { reviewer: '', why: `Couldn't read the reviewer's models (${e.message}), so type the model's name.` }; }
  try { built = await builderModels(repo, read, readCursor, providers); } catch (e) { built = { builder: '', why: `Couldn't read the builder's models (${e.message}), so type the model's name.` }; }
  try { foreman = await foremanModels(repo, read, readCursor, providers); } catch (e) { foreman = { foreman: '', why: `Couldn't read the models of the agent speck runs on (${e.message}), so type the model's name.` }; }
  const agents = await found, yours = yourAgentsShown(repo, agents, providers);
  const listed = yours.why ? null : await yourModels(yours, read, readCursor, providers);
  return { ...panelSettings(repo, { models, builderModels: built, foremanModels: foreman, agents, providers }), your_agents: yours, ...(listed ? { agent_models: listed } : {}) };
}

// 0407: what the panel's GET /api/settings?quick=1 answers: panelSettings from this machine's and the project's config
// alone, at once, with `loading: true`. It asks no agent anything: the Settings view draws it straight away, then reads
// settingsAnswer for the agents' install and sign-in checks and their models, and fills those in.
export function settingsQuick(repo, providers = knownProviders(repo)) {
  return { ...panelSettings(repo, { providers }), loading: true };
}

// 0400: the models of each of your agents in `yours` (yourAgentsView), in its order, for the Settings view's one list
// for each role: { id, name, efforts, models }, `efforts` true for an agent that takes one (Claude Code and Codex), and
// `why` in one line when its models can't be read, so only its own default is offered. Cursor and Codex are asked
// through `readCursor` and `read`, only when they're yours.
async function yourModels(yours, read, readCursor, providers) {
  const out = [];
  for (const a of (Array.isArray(yours.agents) ? yours.agents : []).filter(a => a.yours === true)) {
    const p = providerNamed(a.id, providers);
    let got;
    if (p) got = { models: p.models.map(slug => ({ slug, display_name: providerModelName(p, slug), description: slug === p.defaultModel ? `${p.label}'s default` : null })) };
    else if (a.id === 'claude') got = { models: CLAUDE_MODELS.map(m => ({ ...m })) };
    else {
      try { got = await (a.id === 'cursor' ? readCursor() : read()); } catch (e) { got = { why: `Couldn't read ${a.name}'s models (${String(e?.message ?? e).split('\n')[0]}).` }; }
    }
    const models = Array.isArray(got?.models) ? got.models.filter(m => m && typeof m.slug === 'string' && m.slug) : [];
    const why = !models.length ? untyped(typeof got?.why === 'string' && got.why ? got.why : `${a.name} lists no models.`) : null;
    const byDefault = defaultModelOf(a.id, p, got, models);
    out.push({ id: a.id, name: a.name, efforts: a.id === 'claude' || a.id === 'codex', models, ...(byDefault ? { default_model: byDefault } : {}), ...(why ? { why } : {}) });
  }
  return out;
}
// 0403: the model an agent runs when its model is left blank, or null when that can't be told: a provider's default,
// Sonnet for Claude Code (its own default with no --model), the one Cursor marks (default), and the first Codex lists,
// as it lists its models in its own order with the one it picks first.
function defaultModelOf(id, provider, got, models) {
  if (provider) return provider.defaultModel || null;
  if (id === 'claude') return 'sonnet';
  if (id === 'cursor') return typeof got?.default_model === 'string' && got.default_model ? got.default_model : null;
  if (id === 'codex') return models.length ? models[0].slug : null;
  return null;
}
// A provider's model by the name its list shows, without the provider's own: "V4 Pro" for deepseek-v4-pro.
const providerModelName = (p, slug) => slug.replace(new RegExp(`^${p.name}-`), '').split('-').map(w => w && `${w[0].toUpperCase()}${w.slice(1)}`).join(' ');
// Why an agent's models can't be read, without telling you to type a model's name: its list has no box for one.
const untyped = why => why.replace(/(?:,? (?:so|or) |: )type the model's name[^.]*\./i, '.').replace(/\s*Type the model's name instead\./i, '').trim();

// 0399: yourAgentsView for the Settings view, from the agents `found`, or { why } in one line when it can't be read,
// such as when this machine's list can't be read.
function yourAgentsShown(repo, found, providers) {
  try { return yourAgentsView(repo, found ?? { agents: [] }, loadConfig(repo), { providers }); }
  catch (e) { return { why: e instanceof SpeckError ? e.message : `Couldn't read your agents: ${String(e?.message ?? e).split('\n')[0]}.` }; }
}

// 0369: the models `agent` offers, read now, for the Settings view while it's chosen as the reviewer, builder or
// Foreman agent but not yet saved: { agent, models } as reviewerModels reads them, or { agent, why } in one line, even
// when reading them fails.
// 0393: and a model provider's, from speck's list.
export async function agentModels(agent, read = codexModelsAsync, readCursor = () => agentModelsAsync('cursor'), providers = knownProviders()) {
  if (agent === 'claude' || agent === 'claude-subagent') return { agent, models: CLAUDE_MODELS };
  if (providerNamed(agent, providers)) return { agent, models: providerModels(providerNamed(agent, providers)) };
  try {
    if (agent === 'cursor') return { agent, ...await readCursor() };
    if (agent === 'codex') return { agent, ...await read() };
  } catch (e) { return { agent, why: `Couldn't read ${agent}'s models (${String(e?.message ?? e).split('\n')[0]}), so type the model's name.` }; }
  return { agent: '', why: 'speck can only list the models of claude, codex and cursor, and of the model providers it knows, so type the model\'s name as the agent names it.' };
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

const COMMAND_EXPLAIN = {
  build_command: 'The command speck run starts each build with. Switching the builder sets it to that builder\'s own.',
  resume_command: 'The command the panel shows to reopen a blocked build\'s session.',
};

// `speck config show [--json]` (0269): each setting of the panel's Settings view, by group, with its value now, whether
// that's speck's default and the explanation the panel shows, so setup and the panel say the same thing.
export function cmdConfigShow(args) {
  const json = args.length === 1 && args[0] === '--json';
  if (args.length && !json) throw new SpeckError('Usage: speck config show [--json]');
  const defaults = Object.fromEntries(SETTING_GROUPS.flatMap(g => g.settings).map(s => [s.key, s.default]));
  // 0397: the explanation without the panel's own ending, which says where a change made there is saved.
  const explains = Object.fromEntries(SETTING_GROUPS.flatMap(g => g.settings).map(s => [s.key, s.explain]));
  // 0386: a value this machine holds is shown as speck uses it, marked this_machine, with speck/config.yml's in repo_value.
  const repo = findRepoRoot(), mine = machineConfig(repo);
  const groups = panelSettings(repo).groups.map(g => ({ title: g.title, settings: g.settings.map(s => {
    const repoValue = s.repo_value ?? s.value, machine = Object.hasOwn(mine, s.key), value = machine ? mine[s.key] : repoValue;
    return { key: s.key, value, is_default: JSON.stringify(value) === JSON.stringify(defaults[s.key]), speck_default: defaults[s.key], explain: explains[s.key],
      ...(machine ? { this_machine: true, repo_value: repoValue } : {}) };
  }) }));
  // build_command and resume_command aren't in the Settings view, so one this machine holds is shown with the builder's.
  const repoCfg = loadConfig(repo, { machine: false }), agents = groups.find(g => g.settings.some(s => s.key === 'builder'));
  for (const key of ['build_command', 'resume_command']) if (Object.hasOwn(mine, key))
    agents.settings.push({ key, value: mine[key], is_default: false, speck_default: '', explain: COMMAND_EXPLAIN[key], this_machine: true, repo_value: repoCfg[key] ?? '' });
  if (json) { console.log(JSON.stringify({ groups }, null, 2)); return; }
  const show = v => Array.isArray(v) ? `[${v.join(', ')}]` : shown(v);
  console.log(groups.map(g => `${g.title}\n${g.settings.map(s =>
    `  ${s.key}: ${show(s.value)} (${s.this_machine ? `this machine's own, over speck/config.yml's ${show(s.repo_value)}; ` : ''}${s.is_default ? 'the default' : `speck's default is ${show(s.speck_default)}`})\n    ${s.explain}`).join('\n')}`).join('\n\n'));
}

// One setting's change, checked as `speck config set` does: the value speck would write in `want`, and `same` when the
// setting already has it, or why it's refused, in `status` and `error`. Nothing is written.
// 0261: with `machine`, the change is to this machine's own value, or clears it when `value` is blank.
// 0387: each of your own settings is saved for this machine, `own`, whether or not the change says so. Blank clears this
// machine's value only when the change says `machine` and not `blank`, which saves a blank value for this machine.
// `after`: the value speck uses once it's saved.
function checkChange(repo, text, cfg, { key, value, machine, blank }) {
  if (!EDITABLE.includes(key))
    return { status: 403, error: `${key} can't be changed from the panel. The panel changes only ${EDITABLE.join(', ')}: change the rest in speck/config.yml.` };
  const own = MACHINE_SETTINGS.includes(key);
  if (machine && !own)
    return { status: 422, error: `Only ${MACHINE_SETTINGS.join(', ')} can be set for this machine, not ${key}. Save it for the repo instead.` };
  const mine = machineConfig(repo), repoValue = valueIn(text, repo, key).value;
  if (own && machine && !blank && value === '')
    return { own, clear: true, want: undefined, after: repoValue, same: !Object.hasOwn(mine, key) };
  let want;
  try { want = checkConfigValue(key, value, knownProviders(repo)); }
  catch (e) { if (e instanceof SpeckError) return { status: 422, error: e.message }; throw e; }
  if (key === 'reviewer_model' && /[\x00-\x1f\x7f]/.test(value))
    return { status: 422, error: 'reviewer_model must be on one line, with no tabs or other control characters.' };
  // 0276: reviewer_effort is checked as speck config set checks it, which accepts an effort Codex lists, such as ultra.
  // 0402: and builder_effort.
  const choices = key === 'reviewer_effort' || key === 'builder_effort' ? undefined : choicesOf(key, parseConfig(text), knownProviders(repo));
  if (choices && ![].concat(want).every(w => choices.includes(w)))
    return { status: 422, error: `${key} must be ${choices.map(shown).join(', ')} (got ${JSON.stringify(value)}).` };
  const now = own && Object.hasOwn(mine, key) ? mine[key] : repoValue;
  const same = key === 'auto_ship_risk' ? [...want].sort().join() === [].concat(now).map(String).sort().join()
    : JSON.stringify(now) === JSON.stringify(want);
  return { own, want, after: want, same };
}

// A refusal of the changes in `keys`, each for the same reason, or each for its own in `refused` (key → why).
const refusal = (status, refused, more = {}) => ({ status, body: { error: [...new Set(Object.values(refused))].join('\n'), refused, ...more } });
const each = (changes, why) => Object.fromEntries(changes.map(c => [c.key, why]));

// 0274: the panel's one Save, for every setting changed in the Settings view. `changes`: { key, value, machine, blank }
// each. Each is checked first, and if any is refused nothing is saved, with why in `refused` by setting. Otherwise
// 0387: your own settings are saved for this machine, as `speck config set` does, without a commit, and the rest are
// written to speck/config.yml, rewriting only their lines, and committed in one commit of only that file on the base
// branch. Settings already at the value given are left alone.
// A change that lets more tickets ship by themselves is refused unless `confirmed` names the risks that would then ship,
// as the dialog you confirmed did ("low,high"), so a page that read the settings before they changed can't confirm more (0259).
// 0293: a change to builder sets build_command to the new builder's own in the same save. One set by hand is replaced
// only when `replace` is it, exactly as speck uses it, as the page read it when you confirmed.
// 0311: and clears a builder_model the new builder doesn't offer, as it would be once saved, giving why in `cleared`. `offered`: { builder, models }, the new builder's models as read already, or they're read now.
export function panelSaveSettings(repo, changes, { confirmed = null, replace = null, offered = null } = {}) {
  const twice = changes.find((c, i) => changes.findIndex(d => d.key === c.key) !== i);
  if (twice) return { status: 400, body: { error: `${twice.key} is given more than once. Reload the panel, then try again.` } };
  const file = path.join(repo, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8'), cfg = loadConfig(repo), mine = machineConfig(repo);
  const checked = changes.map(c => ({ ...c, ...checkChange(repo, text, cfg, c) }));
  const bad = checked.filter(c => c.error !== undefined);
  if (bad.length) return refusal(bad[0].status, Object.fromEntries(bad.map(c => [c.key, c.error])));
  const switched = checked.find(c => c.key === 'builder' && !c.same), cleared = {};
  if (switched && !switched.clear) {
    const to = String(switched.want), given = checked.find(c => c.key === 'builder_model');
    const why = clearsBuilderModel(given ? given.after : cfg.builder_model, to, () => offered?.builder === to ? offered.models : providerNamed(to, knownProviders(repo)) ? providerNamed(to, knownProviders(repo)).models : offeredModels(to)); // 0393
    if (why !== null) {
      if (given) Object.assign(given, { clear: false, want: '', after: '', same: Object.hasOwn(mine, 'builder_model') && mine.builder_model === '' });
      else checked.push({ key: 'builder_model', own: true, want: '', after: '', same: false });
      cleared.builder_model = why;
    }
  }
  // 0387: speck as it would be once saved, with this machine's values over speck/config.yml's.
  const will = { ...cfg, ...Object.fromEntries(checked.map(c => [c.key, c.after])) };
  // 0293: switching the builder sets build_command to its own, for this machine (0387), asking first for one set by
  // hand. Clearing this machine's builder also clears the build_command switching to it saved, as `speck config set` does.
  const own = switched && !switched.clear ? ownBuildCommand(String(switched.want), knownProviders(repo)) : null;
  if (own !== null) will.build_command = own;
  if (switched?.clear && Object.hasOwn(mine, 'build_command') && mine.build_command === ownBuildCommand(mine.builder)) {
    checked.push({ key: 'build_command', own: true, clear: true, want: undefined, same: false });
    will.build_command = loadConfig(repo, { machine: false }).build_command;
  }
  // 0280: a reviewer of the builder's own family is refused only when the two would run the same model, or might, as
  // the settings would be once saved. So a change to builder_model or reviewer_model can be refused too.
  // 0293: and so can a change to builder, saying which reviewer would be from another family.
  const models = checked.filter(c => ['builder', 'reviewer', 'builder_model', 'reviewer_model'].includes(c.key));
  if (models.length && cfg.allow_same_model_review !== true) {
    const problem = sameModelProblem(String(will.builder ?? ''), String(will.reviewer ?? ''), will, will.reviewer_model);
    const switching = models.some(c => c.key === 'builder' && !c.same);
    if (problem) return refusal(422, each(models, switching
      ? `${problem} For a ${will.builder} builder, a reviewer from another family is ${otherFamilyReviewer(String(will.builder))}: pick it as the reviewer in the same Save.` : problem));
  }
  const toFile = checked.filter(c => !c.own && !c.same), toMachine = checked.filter(c => c.own && !c.same);
  if (toFile.length) {
    const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
    if (branch !== cfg.base_branch)
      return refusal(409, each(toFile, `This checkout is on "${branch}", not ${cfg.base_branch}, so the setting would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.`));
    const dirty = sh('git', ['status', '--porcelain', '--', 'speck/config.yml'], { cwd: repo });
    if (dirty.status !== 0 || dirty.stdout.trim())
      return refusal(409, each(toFile, 'speck/config.yml has uncommitted changes, so saving would commit them too. Commit or undo them, then try again.'));
  }
  const ships = toMachine.filter(c => c.key === 'auto_ship' || c.key === 'auto_ship_risk'), more = ships.length ? loosens(shipping(cfg), shipping(will)) : null;
  if (more && confirmed !== more.risks)
    return refusal(409, each(ships, `That would let ${more.words} merge and push to ${cfg.base_branch} without waiting for you, which hasn't been confirmed. Check the settings as they are now, then save again.`), { confirm: true });
  if (own !== null && cfg.build_command !== own) {
    if (handSetBuildCommand(cfg) && replace !== String(cfg.build_command))
      return refusal(409, each([switched], `build_command is set by hand to '${String(cfg.build_command)}', and switching the builder replaces it with ${describeBuildCommand(switched.want, own)}, which hasn't been confirmed. Check the settings as they are now, then save again.`), { replace: true });
    toMachine.push({ key: 'build_command', own: true, want: own });
  }
  let next = text;
  for (const c of toFile) next = setConfigText(next, c.key.split('.'), yamlValue(c.want));
  const read = parseConfig(next), unread = toFile.filter(c => JSON.stringify(lookup(read, c.key)) !== JSON.stringify(c.want));
  if (unread.length)
    return refusal(422, Object.fromEntries(unread.map(c => [c.key, `Couldn't write ${c.key} so that speck reads it back as given. Edit speck/config.yml by hand instead.`])));
  // This machine's first, all at once, so that a write or commit that fails can put them back, and speck/config.yml as it was.
  const undo = () => {
    try { saveMachineValues(repo, toMachine.map(c => [c.key, mine[c.key]])); } catch { /* put back all it can */ }
    if (toFile.length) try { if (fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text); } catch { /* as above */ }
  };
  try {
    if (toMachine.length) saveMachineValues(repo, toMachine.map(c => [c.key, c.want]));
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
  return { status: 200, body: { ok: true, changed: [...toFile, ...toMachine].map(c => c.key), ...(Object.keys(cleared).length ? { cleared } : {}) } };
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
// repo:<key>=<value> for the repo or machine:<key>=<value> for this machine only, machine:<key>= clearing this
// machine's value and blank:<key>= saving a blank one for this machine (0387), and confirm=<risks> once you've
// confirmed a change that lets more tickets ship by themselves (0259). 0293: replace=<build_command> once you've
// confirmed that switching the builder replaces one set by hand.
export function panelSaveRequest(repo, query, { offered = null } = {}) {
  const changes = [];
  let confirmed = null, replace = null;
  for (const [name, value] of new URLSearchParams(query)) {
    const m = name.match(/^(repo|machine|blank):(.+)$/);
    if (name === 'confirm' && confirmed === null) confirmed = value;
    else if (name === 'replace' && replace === null) replace = value; // 0293: the build_command you confirmed replacing
    else if (m) changes.push({ key: m[2], value, machine: m[1] !== 'repo', blank: m[1] === 'blank' });
    else return { status: 400, body: { error: `The panel doesn't save ${JSON.stringify(name)}. Reload the panel, then try again.` } };
  }
  try { return panelSaveSettings(repo, changes, { confirmed, replace, offered }); }
  catch (e) { return { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }; }
}

// 0311: the same, for the panel's server, reading the models of the builder it switches to first without waiting,
// and only when there's a builder_model to check.
export async function panelSaveRequestAsync(repo, query, find) {
  let offered = null;
  try {
    // 0387: the builder and its model as given in any of the ways the Save gives them, over the ones speck uses now.
    const q = new URLSearchParams(query), given = key => ['machine', 'blank', 'repo'].map(w => q.get(`${w}:${key}`)).find(v => v !== null) ?? null;
    const cfg = loadConfig(repo), to = given('builder'), model = given('builder_model') ?? cfg.builder_model;
    if (to && to !== String(cfg.builder ?? 'claude') && !providerNamed(to, knownProviders(repo)) && clearsBuilderModel(model, to, () => []) !== null) // 0393: a provider's are speck's own
      offered = { builder: to, models: await offeredModelsAsync(to, find) };
  } catch { /* panelSaveRequest says what's wrong */ }
  return panelSaveRequest(repo, query, { offered });
}

// 0393: the panel's POST /api/keys/<provider>, the Settings view's field for a model provider's API key. `body` is the
// request's JSON, { key }. The key is saved for this machine only (keys.mjs), with no commit, and never sent back:
// the answer says only whether this machine has the provider's key. Every failure is an answer that doesn't show it.
export function panelKeyRequest(repo, rawName, body, { providers = knownProviders(repo) } = {}) {
  let name;
  try { name = decodeURIComponent(String(rawName ?? '')); } catch { name = ''; }
  const p = providerNamed(name, providers);
  if (!p) return { status: 404, body: { error: `speck doesn't know a model provider called ${JSON.stringify(name)}. Reload the panel, then try again.` } };
  let key;
  try { key = JSON.parse(String(body ?? ''))?.key; } catch { key = undefined; }
  if (typeof key !== 'string') return { status: 400, body: { error: `The ${p.label} API key wasn't sent properly, so nothing was saved. Reload the panel, then try again.` } };
  try { saveProviderKey(repo, p.name, key, { providers }); }
  catch (e) {
    if (e instanceof SpeckError) return { status: 422, body: { error: e.message } };
    return { status: 500, body: { error: `Couldn't save the ${p.label} API key, so nothing was saved: ${e?.code ?? 'an error'} writing this machine's keys file.` } };
  }
  return { status: 200, body: { ok: true, provider: p.name, key_set: true } };
}

// 0399: the panel's POST /api/agents/<agent>/add and /remove, the Settings view's "Your agents". Each changes only this
// machine's list, with no commit, and answers with what it did in `said` and the group as it is now in `your_agents`.
// A refusal, such as removing the reviewer's agent, says why in `error`, with the group as it is.
export async function panelAgentRequest(repo, rawName, action, { find = findAgentsAsync, providers = knownProviders(repo) } = {}) {
  let name;
  try { name = decodeURIComponent(String(rawName ?? '')); } catch { name = ''; }
  if (action !== 'add' && action !== 'remove') return { status: 404, body: { error: 'speck can only add or remove an agent here. Reload the panel, then try again.' } };
  let found;
  try { found = await find({ models: false }); } catch { found = { agents: [] }; }
  const opts = { providers, find: () => found };
  try {
    const said = action === 'add' ? addAgent(repo, name, opts) : removeAgent(repo, name, loadConfig(repo), opts);
    return { status: 200, body: { ok: true, said, your_agents: yourAgentsShown(repo, found, providers) } };
  } catch (e) {
    if (!(e instanceof SpeckError)) return { status: 500, body: { error: `Couldn't change your agents, so nothing changed: ${e?.code ?? 'an error'} writing this machine's list.` } };
    return { status: /doesn't know an agent/.test(e.message) ? 404 : 422, body: { error: e.message, your_agents: yourAgentsShown(repo, found, providers) } };
  }
}

// 0399: the panel's POST /api/keys/<provider>: saves the key as panelKeyRequest does, then adds the provider to this
// machine's list of your agents, so a provider joins it once its key is saved. Still no commit, and the key isn't sent back.
export async function panelKeyAddRequest(repo, rawName, body, { find = findAgentsAsync, providers = knownProviders(repo) } = {}) {
  const out = panelKeyRequest(repo, rawName, body, { providers });
  if (out.status !== 200) return out;
  let found;
  try { found = await find({ models: false }); } catch { found = { agents: [] }; }
  try {
    const said = addAgent(repo, out.body.provider, { providers, find: () => found });
    return { status: 200, body: { ...out.body, said, your_agents: yourAgentsShown(repo, found, providers) } };
  } catch (e) {
    const why = e instanceof SpeckError ? e.message : `${e?.code ?? 'an error'} writing this machine's list`;
    return { status: 422, body: { ...out.body, error: `Saved the key, but couldn't add it to your agents: ${why}`, your_agents: yourAgentsShown(repo, found, providers) } };
  }
}

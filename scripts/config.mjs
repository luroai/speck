// `speck config set <key> <value>`: changes one setting in speck/config.yml, checking the value as speck reads it and
// leaving every other line, comment and the order of settings as they were.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, findRepoRoot, parseYaml, parseConfig, stripComment, EFFORTS, loadConfig, yamlValue, RENAMED, settingName } from './core.mjs';
import { MACHINE_SETTINGS, machineConfig, saveMachineValues } from './machine.mjs';
import { knownEffort } from './codex-models.mjs';
import { ownBuildCommand, handSetBuildCommand, otherFamilyReviewer, describeBuildCommand, clearsBuilderModel } from './builder-switch.mjs';
import { offeredModels } from './agents.mjs';
import { sameModelProblem } from './same-model.mjs';
import { FIXING } from './foreman.mjs';
import { FOREMAN_AGENTS } from './foreman-agent.mjs';
import { knownProviders } from './custom-providers.mjs';
import { SHIP_MODES } from './pull-request.mjs';

const USAGE = 'Usage: speck config set <key> <value>, which saves your own settings for this machine only, speck config set --repo <key> <value> to change speck/config.yml\'s, speck config set --machine <key> "" to remove this machine\'s value, speck config set builder <name> [--replace] to switch the builder, or speck config show [--json] to see the main settings.';

// Every setting `speck config set` can change, with how speck reads it. reviewer_options and other free-form maps
// are left to hand editing.
const KINDS = Object.assign(Object.create(null), {
  base_branch: 'text', branch_prefix: 'text', builder: 'text', builder_model: 'text', reviewer: 'text', reviewer_model: 'text',
  worktree_setup: 'text', build_command: 'text', resume_command: 'text', 'commands.test': 'text', 'github.status_check': 'text',
  'commands.test_files': 'files', 'commands.checks': 'paths',
  allow_same_model_review: 'flag', auto_ship: 'flag', worktrees: 'flag',
  reviewer_effort: 'effort', auto_ship_risk: 'risks', watch: 'fixing',
  watch_agent: 'agent', watch_model: 'text', watch_effort: 'effort', // 0287, 0487: were foreman_fixing, foreman, foreman_model and foreman_effort
  ship_mode: 'shipmode', // 0295
  builder_effort: 'effort', // 0402
  max_parallel_builds: 'count', max_parallel_tests: 'count', test_stall_minutes: 'count', review_timeout_minutes: 'count', ship_wait_minutes: 'count', 'limits.max_acceptance_criteria': 'count', 'limits.max_changed_lines': 'count',
  'limits.max_review_rounds': 'count', 'limits.max_merge_rounds': 'count', 'limits.escalate_after_repeat_disputes': 'count', 'limits.max_ticket_body_lines': 'count',
});

// The value as speck will read it, or a SpeckError saying what's allowed.
export function checkConfigValue(key, value, providers = knownProviders()) {
  const kind = KINDS[key];
  if (!kind) throw new SpeckError(`Unknown setting "${key}". speck config set can change: ${Object.keys(KINDS).join(', ')}.`);
  if (kind === 'flag') {
    if (value !== 'true' && value !== 'false') throw new SpeckError(`${key} must be true or false (got ${JSON.stringify(value)}).`);
    return value === 'true';
  }
  if (kind === 'effort') {
    // 0276: or one Codex lists for one of its models, such as ultra
    if (value !== '' && !knownEffort(value)) throw new SpeckError(`${key} must be blank or one of ${EFFORTS.join(', ')}, or an effort Codex lists for one of its models (got ${JSON.stringify(value)}).`);
    return value;
  }
  if (kind === 'count') {
    const n = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(n) || n < 1) throw new SpeckError(`${key} must be a whole number of 1 or more (got ${JSON.stringify(value)}).`);
    return n;
  }
  if (kind === 'files' && value.trim() && !value.includes('{files}'))
    throw new SpeckError(`${key} must be blank or a command with {files} standing for the test files (for example "node --test {files}"), got ${JSON.stringify(value)}.`);
  if (kind === 'paths') {
    // "a b", "a, b" or "[a, b]": the file names, each once. Blank: none.
    const parts = value.trim().replace(/^\[(.*)\]$/, '$1').split(/\s*,\s*|\s+/).filter(Boolean);
    if (parts.some(p => /['"#\[\]]/.test(p)))
      throw new SpeckError(`${key} must be blank or test file names separated by spaces or commas, without quotes, # or brackets in a name (got ${JSON.stringify(value)}).`);
    return parts.length ? [...new Set(parts)] : '';
  }
  const agents = [...FOREMAN_AGENTS, ...providers.map(p => p.name)]; // 0392: or a model provider's name (0401: or one you've added)
  if (kind === 'agent' && value !== '' && !agents.includes(value)) // 0287
    throw new SpeckError(`${key} must be blank or one of ${agents.join(', ')} (got ${JSON.stringify(value)}).`);
  if (kind === 'shipmode' && !SHIP_MODES.includes(value)) // 0295
    throw new SpeckError(`${key} must be ${SHIP_MODES.join(' or ')} (got ${JSON.stringify(value)}).`);
  if (kind === 'fixing' && !FIXING.includes(value)) // 0286
    throw new SpeckError(`${key} must be ${FIXING.join(', ')} (got ${JSON.stringify(value)}).`);
  if (kind === 'risks') {
    // low, high, "low,high", "low high" or "[low, high]".
    const parts = value.trim().replace(/^\[(.*)\]$/, '$1').split(/\s*,\s*|\s+/);
    if (!parts.length || parts.some(p => p !== 'low' && p !== 'high'))
      throw new SpeckError(`${key} must be low, high or both (for example "low,high"), got ${JSON.stringify(value)}. To stop auto-shipping, set auto_ship to false.`);
    return [...new Set(parts)];
  }
  return value;
}

export { yamlValue }; // 0386: moved to core.mjs, so this machine's file is written the same way

const show = v => Array.isArray(v) ? `[${v.join(', ')}]` : v === '' ? '""' : v === undefined ? '(not set)' : typeof v === 'object' ? '{}' : String(v);

// Each setting line in the file, with its line number, indentation and the keys leading to it, read the way parseYaml does.
function settingLines(lines) {
  const out = [], stack = [];
  lines.forEach((raw, i) => {
    const line = stripComment(raw.replace(/\r$/, ''));
    if (!line.trim()) return;
    const m = line.trim().match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!m) return;
    const indent = line.length - line.trimStart().length;
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const entry = { i, indent, path: [...stack.map(s => s.key), m[1]], value: m[2] };
    out.push(entry);
    if (m[2] === '') stack.push({ indent, key: m[1] });
  });
  return out;
}

// The line `key: value`, keeping the old line's indentation, line ending and trailing comment in its column.
function settingLine(indent, key, v, old = '') {
  const cr = old.endsWith('\r') ? '\r' : '';
  const body = old.replace(/\r$/, '');
  const hash = body.indexOf('#', stripComment(body).length);
  const head = `${' '.repeat(indent)}${key}:${v === '' ? '' : ` ${v}`}`;
  return hash === -1 ? head + cr : `${head.padEnd(hash - 1)} ${body.slice(hash)}${cr}`;
}

// 0487: the file's text with no line left for the old name of the setting `name`. The last old line becomes the new
// name's, keeping its place and comment, when the file has no line for the new name yet.
function dropOldNames(text, name) {
  const olds = Object.keys(RENAMED).filter(o => RENAMED[o] === name);
  if (!olds.length) return text;
  const lines = text.split('\n'), entries = settingLines(lines).filter(e => e.path.length === 1);
  const old = entries.filter(e => olds.includes(e.path[0]));
  if (!old.length) return text;
  const keep = entries.some(e => e.path[0] === name) ? null : old.pop();
  if (keep) lines[keep.i] = settingLine(keep.indent, name, keep.value.trim(), lines[keep.i]);
  const gone = new Set(old.map(e => e.i));
  return lines.filter((_, i) => !gone.has(i)).join('\n');
}

// The file's text with the setting at `keys` set to the written value `v`. A missing setting is added under its section.
// 0487: a setting once named after the Foreman is written under its new name only.
export function setConfigText(text, keys, v) {
  if (keys.length === 1) text = dropOldNames(text, keys[0]);
  const lines = text.split('\n');
  const entries = settingLines(lines);
  const same = (a, b) => a.length === b.length && a.every((k, i) => k === b[i]);
  // speck reads the last copy of a setting or section that appears twice, so that's the one changed or added to.
  const section = keys.length > 1 ? entries.filter(e => same(e.path, keys.slice(0, 1))).pop() : null;
  const at = entries.filter(e => same(e.path, keys) && (!section || e.i > section.i)).pop();
  if (at) { lines[at.i] = settingLine(at.indent, keys.at(-1), v, lines[at.i]); return lines.join('\n'); }
  const cr = lines[0]?.endsWith('\r') ? '\r' : '';
  const name = keys.at(-1);
  if (keys.length === 1 || !section) {
    // Not there at all: add it at the end, in its own new section if it has one.
    const add = keys.length === 1 ? [`${name}: ${v}`] : ['', `${keys[0]}:`, `  ${name}: ${v}`];
    if (lines.at(-1) === '') lines.pop();
    return [...lines, ...add.map(l => l + cr), ''].join('\n');
  }
  if (section.value !== '') {
    if (section.value.trim() !== '{}')
      throw new SpeckError(`${keys[0]} in speck/config.yml isn't a section of settings, so ${keys.join('.')} can't be added under it. Fix that line by hand, then run this again.`);
    lines[section.i] = settingLine(section.indent, keys[0], '', lines[section.i]);
  }
  const children = entries.filter(e => e.path.length > 1 && e.path[0] === keys[0] && e.i > section.i);
  const indent = children.find(e => e.path.length === 2)?.indent ?? section.indent + 2;
  const after = children.length ? children.at(-1).i : section.i;
  lines.splice(after + 1, 0, `${' '.repeat(indent)}${name}: ${v}${cr}`);
  return lines.join('\n');
}

// 0260: `speck config set --machine <key> <value>` sets a setting for this machine only, over speck/config.yml's value,
// in a file git ignores. A blank value removes it, so speck/config.yml's value applies again. 0386: `speck config set`
// does the same for your own settings without --machine, where a blank value is saved as blank rather than removing it.
function setMachine(key, raw, remove, replace = false) {
  key = settingName(key); // 0487
  if (!MACHINE_SETTINGS.includes(key))
    throw new SpeckError(`--machine can set only ${MACHINE_SETTINGS.join(', ')}, not "${key}". Set ${key} for every machine with \`speck config set ${key} <value>\`.`);
  if (key === 'builder' && !remove) return setBuilder(raw, replace, true);
  const value = remove ? undefined : checkConfigValue(key, raw);
  const repo = findRepoRoot();
  const values = machineConfig(repo);
  const committed = loadConfig(repo, { machine: false })[key] ?? (key.startsWith('max_parallel_') ? 1 : undefined);
  const before = Object.hasOwn(values, key) ? values[key] : committed;
  if (value === undefined && !Object.hasOwn(values, key)) {
    console.log(`${key} has no value for this machine, so speck uses speck/config.yml's: ${show(committed)}.`);
    return;
  }
  // Removing a builder also removes the build_command switching to it saved, so speck/config.yml's pair applies again.
  const pair = key === 'builder' && value === undefined && Object.hasOwn(values, 'build_command') && values.build_command === ownBuildCommand(values.builder);
  saveMachineValues(repo, pair ? [[key, undefined], ['build_command', undefined]] : [[key, value]]);
  console.log(value === undefined
    ? `${key} (this machine): ${show(before)} → ${show(committed)}, speck/config.yml's value`
    : `${key} (this machine): ${show(before)} → ${show(value)}`);
}

export function cmdConfig(args) {
  const flags = args.slice(1), machine = flags.includes('--machine'), repoFlag = flags.includes('--repo');
  const words = flags.filter(a => a !== '--machine' && a !== '--repo');
  const replace = words[0] === 'builder' && words.slice(1).includes('--replace'); // 0293
  const [sub, given, ...rest] = [args[0], ...words.filter(a => !(replace && a === '--replace'))];
  const key = given && settingName(given); // 0487: an old name sets the new one
  if (sub !== 'set' || !key || !rest.length || (machine && repoFlag)) throw new SpeckError(USAGE);
  // 0386: your own settings are saved for this machine, unless --repo asks for speck/config.yml's.
  if (machine || (!repoFlag && MACHINE_SETTINGS.includes(key))) return setMachine(key, rest.join(' '), machine && rest.join(' ') === '', replace);
  if (key === 'builder') return setBuilder(rest.join(' '), replace);
  const value = checkConfigValue(key, rest.join(' '));
  const repo = findRepoRoot();
  const file = path.join(repo, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8');
  const keys = key.split('.');
  const get = t => keys.reduce((o, k) => (o && typeof o === 'object' && Object.hasOwn(o, k) ? o[k] : undefined), parseConfig(t));
  const next = setConfigText(text, keys, yamlValue(value));
  // Check the change reads back as given before writing anything.
  if (JSON.stringify(get(next)) !== JSON.stringify(value))
    throw new SpeckError(`Couldn't write ${key} so that speck reads it back as given. Edit speck/config.yml by hand instead.`);
  fs.writeFileSync(file, next);
  console.log(`${key}: ${show(get(text))} → ${show(value)}`);
  const own = machineConfig(repo);
  if (Object.hasOwn(own, key))
    console.log(`This machine uses its own ${key}, ${show(own[key])}, over it. Run \`speck config set --machine ${key} ""\` to use speck/config.yml's.`);
}

// 0293: `speck config set builder <name> [--replace]`, as the panel's Settings view switches it: build_command is set
// to the new builder's own in the same write, for a builder speck starts by itself. One set by hand is replaced only
// with --replace. A builder of the reviewer's family is set, with a note saying which reviewer is from another family.
// 0386: with `machine`, the builder and the settings it changes are saved for this machine, read as speck uses them.
function setBuilder(value, replace, machine = false) {
  const repo = findRepoRoot();
  const file = path.join(repo, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8'), was = machine ? loadConfig(repo) : parseYaml(text);
  const before = was.builder ?? 'claude', own = ownBuildCommand(value);
  const changes = [['builder', value]];
  if (value !== before && own !== null && was.build_command !== own) {
    if (handSetBuildCommand(was) && !replace)
      throw new SpeckError(`build_command is set by hand to ${show(was.build_command)}, and switching the builder to ${value} replaces it with ${describeBuildCommand(value, own)}. Run \`speck config set builder ${value} --replace\` to replace it, or set build_command yourself.`);
    changes.push(['build_command', own]);
  }
  // 0311: and clears a builder_model the new builder doesn't offer, saying why.
  const cleared = value !== before ? clearsBuilderModel(was.builder_model, value, () => offeredModels(value)) : null;
  if (cleared !== null) changes.push(['builder_model', '']);
  if (machine) saveMachineValues(repo, changes);
  else {
    let next = text;
    for (const [k, v] of changes) next = setConfigText(next, [k], yamlValue(v));
    const read = parseYaml(next);
    for (const [k, v] of changes) if (read[k] !== v)
      throw new SpeckError(`Couldn't write ${k} so that speck reads it back as given. Edit speck/config.yml by hand instead.`);
    fs.writeFileSync(file, next);
  }
  const where = machine ? ' (this machine)' : '';
  for (const [k, v] of changes) console.log(`${k}${where}: ${show(was[k])} → ${show(v)}${k === 'builder_model' ? `, cleared because ${cleared}.` : ''}`);
  const cfg = loadConfig(repo);
  if (cfg.allow_same_model_review !== true) {
    const problem = sameModelProblem(value, String(cfg.reviewer ?? ''), cfg, cfg.reviewer_model);
    if (problem) console.log(`Note: ${problem} For a ${value} builder, a reviewer from another family is ${otherFamilyReviewer(value)}: \`speck config set reviewer ${otherFamilyReviewer(value)}\`.`);
  }
}

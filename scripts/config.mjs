// `speck config set <key> <value>`: changes one setting in speck/config.yml, checking the value as speck reads it and
// leaving every other line, comment and the order of settings as they were.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, findRepoRoot, parseYaml, stripComment, EFFORTS, loadConfig } from './core.mjs';
import { MACHINE_SETTINGS, machineConfig, saveMachineValue } from './machine.mjs';

const USAGE = 'Usage: speck config set <key> <value>, speck config set --machine <key> <value> for this machine only, or speck config show [--json] to see the main settings.';

// Every setting `speck config set` can change, with how speck reads it. reviewer_options and other free-form maps
// are left to hand editing.
const KINDS = Object.assign(Object.create(null), {
  base_branch: 'text', branch_prefix: 'text', builder: 'text', reviewer: 'text', reviewer_model: 'text',
  worktree_setup: 'text', build_command: 'text', resume_command: 'text', 'commands.test': 'text', 'github.status_check': 'text',
  'commands.test_files': 'files', 'commands.checks': 'paths',
  allow_same_model_review: 'flag', auto_ship: 'flag', worktrees: 'flag',
  reviewer_effort: 'effort', auto_ship_risk: 'risks',
  max_parallel_builds: 'count', max_parallel_tests: 'count', test_stall_minutes: 'count', review_timeout_minutes: 'count', ship_wait_minutes: 'count', 'limits.max_acceptance_criteria': 'count', 'limits.max_changed_lines': 'count',
  'limits.max_review_rounds': 'count', 'limits.max_merge_rounds': 'count', 'limits.escalate_after_repeat_disputes': 'count', 'limits.max_ticket_body_lines': 'count',
});

// The value as speck will read it, or a SpeckError saying what's allowed.
export function checkConfigValue(key, value) {
  const kind = KINDS[key];
  if (!kind) throw new SpeckError(`Unknown setting "${key}". speck config set can change: ${Object.keys(KINDS).join(', ')}.`);
  if (kind === 'flag') {
    if (value !== 'true' && value !== 'false') throw new SpeckError(`${key} must be true or false (got ${JSON.stringify(value)}).`);
    return value === 'true';
  }
  if (kind === 'effort') {
    if (value !== '' && !EFFORTS.includes(value)) throw new SpeckError(`${key} must be blank or one of ${EFFORTS.join(', ')} (got ${JSON.stringify(value)}).`);
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
  if (kind === 'risks') {
    // low, high, "low,high", "low high" or "[low, high]".
    const parts = value.trim().replace(/^\[(.*)\]$/, '$1').split(/\s*,\s*|\s+/);
    if (!parts.length || parts.some(p => p !== 'low' && p !== 'high'))
      throw new SpeckError(`${key} must be low, high or both (for example "low,high"), got ${JSON.stringify(value)}. To stop auto-shipping, set auto_ship to false.`);
    return [...new Set(parts)];
  }
  return value;
}

// A value as it's written in speck/config.yml, so that it reads back exactly.
export function yamlValue(value) {
  if (typeof value !== 'string') return Array.isArray(value) ? `[${value.join(', ')}]` : String(value);
  const readsBack = v => parseYaml(`k: ${v}   # comment`).k === value;
  if (/^[A-Za-z0-9_./@~-][^#'"]*$/.test(value) && !/:\s|\s$/.test(value) && readsBack(value)) return value;
  if (!value.includes("'") && !/[\n\r]/.test(value) && readsBack(`'${value}'`)) return `'${value}'`;
  return JSON.stringify(value);
}

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

// The file's text with the setting at `keys` set to the written value `v`. A missing setting is added under its section.
export function setConfigText(text, keys, v) {
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
// in a file git ignores. A blank value removes it, so speck/config.yml's value applies again.
function setMachine(key, raw) {
  if (!MACHINE_SETTINGS.includes(key))
    throw new SpeckError(`--machine can set only ${MACHINE_SETTINGS.join(', ')}, not "${key}". Set ${key} for every machine with \`speck config set ${key} <value>\`.`);
  const value = raw === '' ? undefined : checkConfigValue(key, raw);
  const repo = findRepoRoot();
  const values = machineConfig(repo);
  const committed = loadConfig(repo, { machine: false })[key] ?? 1;
  const before = Object.hasOwn(values, key) ? values[key] : committed;
  if (value === undefined && !Object.hasOwn(values, key)) {
    console.log(`${key} has no value for this machine, so speck uses speck/config.yml's: ${show(committed)}.`);
    return;
  }
  saveMachineValue(repo, key, value);
  console.log(value === undefined
    ? `${key} (this machine): ${show(before)} → ${show(committed)}, speck/config.yml's value`
    : `${key} (this machine): ${show(before)} → ${show(value)}`);
}

export function cmdConfig(args) {
  const machine = args.slice(1).includes('--machine');
  const [sub, key, ...rest] = [args[0], ...args.slice(1).filter(a => a !== '--machine')];
  if (sub !== 'set' || !key || !rest.length) throw new SpeckError(USAGE);
  if (machine) return setMachine(key, rest.join(' '));
  const value = checkConfigValue(key, rest.join(' '));
  const repo = findRepoRoot();
  const file = path.join(repo, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8');
  const keys = key.split('.');
  const get = t => keys.reduce((o, k) => (o && typeof o === 'object' && Object.hasOwn(o, k) ? o[k] : undefined), parseYaml(t));
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

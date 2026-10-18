// 0288: `speck agents`: for each agent speck supports, whether it's installed here and signed in, and the models it
// offers, each with its name as the agent takes it, a display name and a description where the agent gives one. Each
// agent's commands are given at most AGENTS_TIMEOUT_MS: a list that can't be read in time, or at all, is left empty
// with the reason in `models_why`. Read the same way waiting (speck's commands) or not (the panel's server).

import { spawnSync, execFile } from 'node:child_process';
import { SpeckError } from './core.mjs';
import { onPath, CURSOR_CLIS } from './install.mjs';
import { parseCodexModels } from './codex-models.mjs';
import { CLAUDE_MODELS } from './settings.mjs';

export const AGENTS_TIMEOUT_MS = 10_000;
const MAX_BUFFER = 64 * 1024 * 1024;

const model = (name, display_name, description) => ({ name, display_name: display_name || null, description: description || null });
const plain = s => String(s ?? '').replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
const lastLine = s => plain(s).trim().split('\n').pop().trim().slice(0, 200);
const seconds = ms => `${ms / 1000} second${ms === 1000 ? '' : 's'}`;

// Cursor's `agent models`: a header, then `<id> - <name>` a line, sometimes followed by (current) or (default), and a
// tip. { models } or { why }.
export function parseCursorModels(stdout) {
  const models = [];
  for (const line of plain(stdout).split('\n')) {
    const m = line.trim().match(/^([A-Za-z0-9][A-Za-z0-9._:/-]*)\s+-\s+(.+?)(?:\s+\((?:current|default|current,\s*default)\))?$/);
    if (!m || /^(Available|Tip:)/.test(line.trim()) || models.some(x => x.name === m[1])) continue;
    models.push(model(m[1], m[2].trim()));
  }
  return models.length ? { models } : { why: 'Cursor listed no models in a form speck reads: check it\'s signed in (agent login).' };
}

// Why a command gave nothing to read, from how it ended.
function failed(label, what, r, ms) {
  if (r.timedOut) return `${label} took more than ${seconds(ms)} to ${what}.`;
  const line = lastLine(r.stderr) || lastLine(r.stdout);
  return `${label} couldn't ${what}${line ? ` (${line})` : r.status !== null && r.status !== undefined ? ` (exit ${r.status})` : ''}.`;
}

// Each agent, as a generator that yields the commands it runs, [cmd, args], and is given each one's result
// ({ status, stdout, stderr, timedOut }), so the same steps run waiting or not. It returns the agent's entry.
function* claude(opts) {
  const base = { id: 'claude', name: 'Claude Code', command: 'claude' };
  if (!onPath('claude')) return { ...base, installed: false, signed_in: false, models: [], why: 'Claude Code isn\'t installed.', models_why: 'Claude Code isn\'t installed.' };
  const auth = yield ['claude', ['auth', 'status']];
  let json = null;
  try { json = JSON.parse(auth.stdout); } catch { /* not signed in, as far as speck can tell */ }
  const signed = json !== null && typeof json === 'object' && json.loggedIn === true;
  const why = signed ? {} : { why: auth.timedOut ? failed('Claude Code', 'say whether it\'s signed in', auth, opts.timeoutMs) : 'Claude Code isn\'t signed in: run claude auth login.' };
  // Claude Code has no command that lists its models: these names each take the newest model of its kind.
  return { ...base, installed: true, signed_in: signed, ...why, models: CLAUDE_MODELS.map(m => model(m.slug, m.display_name, m.description)) };
}

function* codex(opts) {
  const base = { id: 'codex', name: 'Codex', command: 'codex' };
  if (!onPath('codex')) return { ...base, installed: false, signed_in: false, models: [], why: 'Codex isn\'t installed.', models_why: 'Codex isn\'t installed.' };
  const login = yield ['codex', ['login', 'status']];
  const signed = login.status === 0 && !login.timedOut;
  const why = signed ? {} : { why: login.timedOut ? failed('Codex', 'say whether it\'s signed in', login, opts.timeoutMs) : 'Codex isn\'t signed in: run codex login.' };
  if (!opts.models) return { ...base, installed: true, signed_in: signed, ...why };
  const listed = yield ['codex', ['debug', 'models']];
  if (listed.status !== 0 || listed.timedOut) return { ...base, installed: true, signed_in: signed, ...why, models: [], models_why: failed('Codex', 'list its models', listed, opts.timeoutMs) };
  const read = parseCodexModels(listed.stdout);
  return { ...base, installed: true, signed_in: signed, ...why, models: (read.models || []).map(m => model(m.slug, m.display_name, m.description)), ...(read.why ? { models_why: read.why } : {}) };
}

function* cursor(opts) {
  // Cursor's CLI is `agent`, and was `cursor-agent`.
  const command = CURSOR_CLIS.find(onPath);
  const base = { id: 'cursor', name: 'Cursor', command: command || 'agent' };
  if (!command) return { ...base, installed: false, signed_in: false, models: [], why: 'Cursor isn\'t installed.', models_why: 'Cursor isn\'t installed.' };
  const status = yield [command, ['status']];
  const said = plain(status.stdout);
  const signed = status.status === 0 && !status.timedOut && /\blogged in\b/i.test(said) && !/\bnot logged in\b/i.test(said);
  const why = signed ? {} : { why: status.timedOut ? failed('Cursor', 'say whether it\'s signed in', status, opts.timeoutMs) : `Cursor isn't signed in: run ${command} login.` };
  if (!opts.models) return { ...base, installed: true, signed_in: signed, ...why };
  const listed = yield [command, ['models']];
  if (listed.status !== 0 || listed.timedOut) return { ...base, installed: true, signed_in: signed, ...why, models: [], models_why: failed('Cursor', 'list its models', listed, opts.timeoutMs) };
  const read = parseCursorModels(listed.stdout);
  return { ...base, installed: true, signed_in: signed, ...why, models: read.models || [], ...(read.why ? { models_why: read.why } : {}) };
}

const AGENTS = { claude, codex, cursor };
const options = ({ timeoutMs = AGENTS_TIMEOUT_MS, models = true } = {}) => ({ timeoutMs, models });
const which = ({ only } = {}) => Object.entries(AGENTS).filter(([id]) => !only || id === only).map(([, agent]) => agent);

function runSync([cmd, args], ms) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: ms, maxBuffer: MAX_BUFFER, stdio: ['ignore', 'pipe', 'pipe'] });
  const timedOut = r.error?.code === 'ETIMEDOUT';
  return { status: r.error && !timedOut ? null : r.status, stdout: r.stdout || '', stderr: r.stderr || (r.error && !timedOut ? r.error.message : ''), timedOut };
}

function runAsync([cmd, args], ms) {
  return new Promise(resolve => {
    const child = execFile(cmd, args, { encoding: 'utf8', timeout: ms, maxBuffer: MAX_BUFFER }, (error, stdout, stderr) => {
      const timedOut = !!error && error.killed === true && error.code !== 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
      resolve({ status: error ? (typeof error.code === 'number' ? error.code : null) : 0, stdout: stdout || '', stderr: stderr || (error && !timedOut && typeof error.code !== 'number' ? error.message : ''), timedOut });
    });
    child.stdin?.end();
  });
}

// Every agent, waiting for each: { agents: [{ id, name, command, installed, signed_in, why?, models, models_why? }] }.
// `models: false` leaves out the models, and the commands that list them.
export function findAgents(opts) {
  const o = options(opts);
  return { agents: which(opts).map(agent => {
    const g = agent(o);
    let step = g.next();
    while (!step.done) step = g.next(runSync(step.value, o.timeoutMs));
    return step.value;
  }) };
}

// The same, every agent at once, without waiting: for the panel's server.
export async function findAgentsAsync(opts) {
  const o = options(opts);
  return { agents: await Promise.all(which(opts).map(async agent => {
    const g = agent(o);
    let step = g.next();
    while (!step.done) step = g.next(await runAsync(step.value, o.timeoutMs));
    return step.value;
  })) };
}

// One agent's models, read without waiting, in the shape the Settings view takes: { models: [{ slug, display_name?,
// description? }] }, or { why } in one line when there are none.
export async function agentModelsAsync(id, opts) {
  const { agents } = await findAgentsAsync({ ...opts, only: id });
  const a = agents[0];
  if (!a.models.length) return { why: `${a.models_why || a.why || `${a.name} lists no models.`} Type the model's name instead.` };
  return { models: a.models.map(m => ({ slug: m.name, ...(m.display_name ? { display_name: m.display_name } : {}), ...(m.description ? { description: m.description } : {}) })) };
}

// `speck agents` as plain lines.
export function agentLines({ agents }) {
  const lines = [];
  for (const a of agents) {
    const state = !a.installed ? 'not installed' : a.signed_in ? 'installed, signed in' : 'installed, not signed in';
    lines.push(`${a.name} (${a.command}): ${state}`);
    if (a.why && a.installed) lines.push(`  ${a.why}`);
    for (const m of a.models || []) {
      const named = m.display_name && m.display_name !== m.name ? ` (${m.display_name})` : '';
      lines.push(`  ${m.name}${named}${m.description ? `: ${m.description}` : ''}`);
    }
    if (a.models_why && a.installed) lines.push(`  No models listed: ${a.models_why}`);
  }
  return lines.join('\n');
}

// `speck agents [--json]`.
export function cmdAgents(args) {
  const json = args.length === 1 && args[0] === '--json';
  if (args.length && !json) throw new SpeckError('Usage: speck agents [--json]');
  const found = findAgents();
  console.log(json ? JSON.stringify(found, null, 2) : agentLines(found));
}

// 0398: the agents you've set up on this machine: Claude Code, Codex, Cursor and the model providers speck knows, such
// as DeepSeek. The list is kept beside this machine's own settings, in the main checkout's
// speck/.cache/machine/agents.json, which git ignores, so changing it commits nothing. Until this machine has a list,
// every agent that's installed and signed in, and every provider whose key is set, counts as yours.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, findRepoRoot, loadConfig } from './core.mjs';
import { machineConfigFile } from './machine.mjs';
import { sharedCacheDir } from './turns.mjs';
import { findProvider } from './providers.mjs';
import { knownProviders } from './custom-providers.mjs';
import { keysStatus } from './keys.mjs';
import { findAgents, agentLines } from './agents.mjs';
import { foremanAgentOf } from './foreman-agent.mjs';
import { installHint } from './install.mjs';

export const yourAgentsFile = repo => path.join(path.dirname(machineConfigFile(repo)), 'agents.json');

const CLI_AGENTS = ['claude', 'codex', 'cursor'];
const knownIds = providers => [...CLI_AGENTS, ...providers.map(p => p.name)];

// This machine's list, as agent ids speck knows, in speck's order, or null when it has none. `repo` is null outside a
// speck project, where there's no list or key to read.
export function readYourAgents(repo, { providers = knownProviders(repo) } = {}) {
  if (repo === null) return null;
  const file = yourAgentsFile(repo);
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  let read;
  try { read = JSON.parse(text); } catch { read = null; }
  if (!read || typeof read !== 'object' || !Array.isArray(read.agents))
    throw new SpeckError(`This machine's list of your agents, ${file}, can't be read. Delete it, then add each agent again with \`speck agents add <agent>\`.`);
  return knownIds(providers).filter(id => read.agents.includes(id));
}

function writeYourAgents(repo, ids, providers) {
  sharedCacheDir(repo, 'machine');
  const file = yourAgentsFile(repo), tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ agents: knownIds(providers).filter(id => ids.includes(id)) }, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

// Every agent speck knows, with whether it's ready here: { agents, providers }, each entry with `ready`. Agents come
// from findAgents, providers with whether this machine has their key, and the models speck runs them on.
function everyAgent(repo, { find = findAgents, models = true, providers = knownProviders(repo) } = {}) {
  const agents = find({ models }).agents.map(a => ({ ...a, ready: a.installed === true && a.signed_in === true }));
  const keys = repo === null ? {} : Object.fromEntries(keysStatus(repo, { providers }).map(k => [k.name, k.set]));
  const provs = providers.map(p => ({ id: p.name, name: p.label, key_set: keys[p.name] === true, ready: keys[p.name] === true,
    ...(keys[p.name] ? {} : { why: `${p.label} has no API key on this machine: set one with speck keys set ${p.name}.` }),
    models: models ? p.models.map(m => ({ name: m, display_name: null, description: null })) : [] }));
  return { agents, providers: provs };
}

const readyIds = ({ agents, providers }) => [...agents, ...providers].filter(a => a.ready).map(a => a.id);

// The ids of your agents: this machine's list, or every ready one while it has none.
export function yourAgents(repo, opts = {}) {
  return readYourAgents(repo, opts) ?? readyIds(everyAgent(repo, { ...opts, models: false }));
}

// `speck agents --json`: every agent speck knows, each with `yours`, and `list`: whether this machine has a list.
export function agentsReport(repo, opts = {}) {
  const every = everyAgent(repo, opts), list = readYourAgents(repo, opts), mine = list ?? readyIds(every);
  const mark = a => ({ ...a, yours: mine.includes(a.id) });
  return { list: list !== null, agents: every.agents.map(mark), providers: every.providers.map(mark) };
}

// 0398 AC3: makes this machine's list from every ready agent when it has none. The ids added, or null when it had one.
// With none ready it makes no list, so an agent set up later still counts as yours.
export function fillYourAgents(repo, opts = {}) {
  if (readYourAgents(repo, opts) !== null) return null;
  const ids = readyIds(everyAgent(repo, { ...opts, models: false }));
  if (ids.length) writeYourAgents(repo, ids, opts.providers ?? knownProviders(repo));
  return ids;
}

const nameOf = (id, providers) => findProvider(id, providers)?.label ?? { claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor' }[id];
const names = (ids, providers) => ids.map(id => nameOf(id, providers)).join(', ');

function idOf(name, providers) {
  const id = String(name ?? '').toLowerCase();
  if (!knownIds(providers).includes(id)) throw new SpeckError(`speck doesn't know an agent called "${name}". It knows: ${knownIds(providers).join(', ')}.`);
  return id;
}

// Adds `name` to this machine's list, refusing one that isn't installed or a provider without its key. Returns what to say.
export function addAgent(repo, name, opts = {}) {
  const providers = opts.providers ?? knownProviders(repo), id = idOf(name, providers);
  const every = everyAgent(repo, { ...opts, models: false }), entry = [...every.agents, ...every.providers].find(a => a.id === id);
  if (entry.key_set === false) throw new SpeckError(`${entry.name} has no API key on this machine, so it wasn't added. Set one with \`speck keys set ${id}\`, then add it again.`);
  if (entry.installed === false) throw new SpeckError(`${entry.name} isn't installed, so it wasn't added. Install it, sign in, then add it again.`);
  // The first change makes this machine's list, from the agents that counted as yours until then.
  const kept = readYourAgents(repo, opts), list = kept ?? readyIds(every);
  const signedOut = entry.signed_in === false ? ` It isn't signed in yet: ${entry.why || 'sign in to it'}` : '';
  if (kept && list.includes(id)) return `${entry.name} is already one of your agents on this machine.${signedOut}`;
  writeYourAgents(repo, list.includes(id) ? list : [...list, id], providers);
  return `Added ${entry.name} to your agents on this machine.${signedOut}`;
}

// The roles that use agent `id` in `cfg`: builder, reviewer or speck, as Your agents names them.
export function rolesUsing(id, cfg, providers = knownProviders()) {
  const reviewer = cfg?.reviewer === 'claude-subagent' ? 'claude' : cfg?.reviewer;
  return [['builder', cfg?.builder], ['reviewer', reviewer], ['speck', foremanAgentOf(cfg, providers)]].filter(([, v]) => v === id).map(([role]) => role);
}

// Removes `name` from this machine's list, refusing one the builder, reviewer or Foreman uses. Returns what to say.
export function removeAgent(repo, name, cfg, opts = {}) {
  const providers = opts.providers ?? knownProviders(repo), id = idOf(name, providers), label = nameOf(id, providers);
  const roles = rolesUsing(id, cfg, providers);
  if (roles.length) {
    const named = roles.map(r => (r === 'speck' ? 'the agent speck watches with' : `the ${r}`)); // 0486
    const said = named.length > 1 ? `${named.slice(0, -1).join(', ')} and ${named.at(-1)}` : named[0];
    throw new SpeckError(`${label} is ${said}, so it wasn't removed. Set ${said} to another agent first, then remove it.`);
  }
  const list = readYourAgents(repo, opts) ?? yourAgents(repo, opts);
  if (!list.includes(id)) return `${label} isn't one of your agents on this machine, so there was nothing to remove.`;
  writeYourAgents(repo, list.filter(x => x !== id), providers);
  return `Removed ${label} from your agents on this machine.`;
}

// 0399: the Settings view's "Your agents": every agent speck knows, read from `found` (as findAgentsAsync finds them,
// without their models), each with whether it's yours, whether it's ready, how to install one that isn't, and the
// roles in `cfg` that use it. Never a key: only whether a provider has one.
export function yourAgentsView(repo, found, cfg, opts = {}) {
  const providers = opts.providers ?? knownProviders(repo);
  const report = agentsReport(repo, { ...opts, providers, models: false, find: () => found });
  const row = (a, kind) => ({ id: a.id, name: a.name, kind, yours: a.yours === true, ready: a.ready === true,
    ...(kind === 'agent' ? { installed: a.installed === true, signed_in: a.signed_in === true } : { key_set: a.key_set === true }),
    ...(a.why ? { why: String(a.why) } : {}), ...(kind === 'agent' && !a.installed && installHint(a.id) ? { install: installHint(a.id) } : {}),
    roles: rolesUsing(a.id, cfg, providers) });
  return { list: report.list, agents: [...report.agents.map(a => row(a, 'agent')), ...report.providers.map(p => row(p, 'provider'))] };
}

// `speck agents` as plain lines: each agent, then each provider, with whether it's yours.
export function reportLines(report) {
  const yours = a => (a.yours ? 'yours' : 'not yours');
  const agents = agentLines({ agents: report.agents }).split('\n').map(line => {
    const a = report.agents.find(x => line.startsWith(`${x.name} (${x.command}): `));
    return a ? `${line}, ${yours(a)}` : line;
  });
  const provs = report.providers.flatMap(p => [`${p.name} (${p.id}): ${p.key_set ? 'key set' : 'no key'}, ${yours(p)}`,
    ...(p.why ? [`  ${p.why}`] : []), ...p.models.map(m => `  ${m.name}`)]);
  const head = report.list ? [] : ["This machine has no list of your agents yet, so every agent that's ready counts as yours. Change it with speck agents add <agent> or speck agents remove <agent>.", ''];
  return [...head, ...agents, ...provs].join('\n');
}

const USAGE = 'Usage: speck agents [--json], to see every agent speck knows, speck agents add <agent> or speck agents remove <agent>.';

// `speck agents [--json]`, `speck agents add <agent>` and `speck agents remove <agent>`.
export function cmdAgents(args, opts = {}) {
  const [sub, name, ...rest] = args;
  if (sub === 'add' || sub === 'remove') {
    if (!name || rest.length) throw new SpeckError(USAGE);
    const repo = findRepoRoot();
    console.log(sub === 'add' ? addAgent(repo, name, opts) : removeAgent(repo, name, loadConfig(repo), opts));
    return;
  }
  const json = args.length === 1 && sub === '--json';
  if (args.length && !json) throw new SpeckError(USAGE);
  // Before speck is set up, as setup asks, it still lists every agent, none with a key or a list.
  let repo = null;
  try { repo = findRepoRoot(); } catch (e) { if (!(e instanceof SpeckError)) throw e; }
  const report = agentsReport(repo, opts);
  console.log(json ? JSON.stringify(report, null, 2) : reportLines(report));
}

// What `speck init` says after filling the list: one line, or null when the list was already there.
export function fillLine(repo, opts = {}) {
  const added = fillYourAgents(repo, opts), providers = opts.providers ?? knownProviders(repo);
  if (added === null) return `kept    this machine's list of your agents (${names(yourAgents(repo, opts), providers) || 'none'})`;
  return added.length ? `added   your agents on this machine: ${names(added, providers)}` : 'found   no agent installed and signed in, or provider with its key set, so this machine has no list of your agents yet. Each one you set up counts as yours until you make one with speck agents add <agent>.';
}

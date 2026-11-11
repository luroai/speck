// 0645: each team member's bench, the agents in order that speck switches it to while its own agent is held by a usage
// limit. builder_bench, reviewer_bench and watch_bench are your own settings (machine.mjs). Blank is your agents in
// speck agents' order, leaving out the member's own agent and every model provider, as those bill per token.

import { SpeckError } from './core.mjs';

export const BENCHES = Object.freeze(['builder_bench', 'reviewer_bench', 'watch_bench']);
const CLI_AGENTS = ['claude', 'codex', 'cursor'];
const MEMBER = { builder_bench: 'the builder', reviewer_bench: 'the reviewer', watch_bench: 'the watch agent' };

export const benchKnown = (providers = []) => [...CLI_AGENTS, ...providers.map(p => p.name)];

// A bench as written: a list, or text such as "codex, cursor", "codex cursor" or "[codex, cursor]". Each agent once,
// in order. [] when it's blank.
export function benchList(value) {
  if (value === undefined || value === null || value === '') return [];
  const parts = Array.isArray(value) ? value : typeof value === 'string' ? value.trim().replace(/^\[(.*)\]$/, '$1').split(/\s*,\s*|\s+/) : null;
  if (!parts || parts.some(p => typeof p !== 'string')) return null;
  return [...new Set(parts.map(p => p.trim().toLowerCase()).filter(Boolean))];
}

// Why `value` can't be `key`'s bench, with `own` the member's own agent, or null when it can.
export function benchProblem(key, value, own, providers = []) {
  const list = benchList(value), known = benchKnown(providers);
  if (list === null) return `${key} must be blank or a list of agents, such as "codex, cursor" (got ${JSON.stringify(value)}).`;
  const unknown = list.find(a => !known.includes(a));
  if (unknown !== undefined) return `${key} names "${unknown}", an agent speck doesn't know. It knows: ${known.join(', ')}.`;
  if (own && list.includes(own)) return `${key} names ${own}, which is ${MEMBER[key]}'s own agent, so it can't stand in for it.`;
  return null;
}

// `key`'s bench in `cfg` as speck uses it, refusing one `benchProblem` refuses. Blank is `yours`, your agents in speck
// agents' order, without `own` or a model provider.
export function benchOf(cfg, key, { yours = [], own = '', providers = [] } = {}) {
  const value = cfg?.[key], problem = benchProblem(key, value, own, providers);
  if (problem) throw new SpeckError(`${problem} Fix it with \`speck config set ${key} <agents>\`, or blank it with \`speck config set ${key} ""\` to use your agents in order.`);
  const list = benchList(value);
  return list.length ? list : yours.filter(a => CLI_AGENTS.includes(a) && a !== own);
}

// What `speck config show` says about each bench.
export const BENCH_EXPLAIN = Object.freeze({
  builder_bench: 'The agents, in order, for the builder to switch to while its own agent is held by a usage limit: claude, codex, cursor or a model provider. Blank means your agents in the order speck agents lists them, leaving out the builder\'s own agent and any model provider on an API key, as those bill per token.',
  reviewer_bench: 'The agents, in order, for the reviewer to switch to while its own agent is held by a usage limit: claude, codex, cursor or a model provider. Blank means your agents in the order speck agents lists them, leaving out the reviewer\'s own agent and any model provider on an API key, as those bill per token.',
  watch_bench: 'The agents, in order, that speck looks into stopped work on while the watch agent\'s own agent is held by a usage limit, skipping any that isn\'t ready or is held by its own limit: claude, codex, cursor or a model provider. Blank means your agents in the order speck agents lists them, leaving out the watch agent\'s own agent and any model provider on an API key, as those bill per token.',
});

// `speck config show`'s row for each bench, with the title of its member's group: the value speck uses, this machine's
// `mine` over speck/config.yml's `repoCfg`.
export const benchRows = (repoCfg, mine) => BENCHES.map(key => {
  const repoValue = repoCfg?.[key] ?? '', machine = Object.hasOwn(mine, key), value = machine ? mine[key] : repoValue;
  return { group: key === 'watch_bench' ? 'Your engineering manager' : 'Building and reviewing',
    row: { key, value, is_default: benchList(value)?.length === 0, speck_default: '', explain: BENCH_EXPLAIN[key], ...(machine ? { this_machine: true, repo_value: repoValue } : {}) } };
});

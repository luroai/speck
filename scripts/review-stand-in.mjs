// 0649: while the reviewer's own agent is held by a recorded usage limit, a review round runs on the first agent on
// reviewer_bench that's ready (installed and signed in, or a provider with its key), not held by a limit itself and
// allowed to review this build under the same-model rule, on that agent's own default model and effort. Its reviewer
// differs from the last round's, so it starts a fresh session with the full history (0388), as does the first round
// back on the reviewer's own agent once the limit has reset.

import { ticketAgents } from './core.mjs';
import { benchOf } from './bench.mjs';
import { knownProviders } from './custom-providers.mjs';
import { sameModelProblem } from './same-model.mjs';
import { configBuilder } from './build-model.mjs';
import { heldBy, agentHeld } from './reviewer-limit.mjs';
import { agentsReport, readYourAgents } from './your-agents.mjs';

// Your agents that are ready here, in speck agents' order. None are asked when this machine's list of yours is empty.
export function readyAgents(repo) {
  if (readYourAgents(repo)?.length === 0) return [];
  const r = agentsReport(repo, { models: false });
  return [...r.agents, ...r.providers].filter(a => a.yours && a.ready).map(a => a.id);
}

// Why `reviewer` is held, in words, from its limit on record `s`.
export const heldWhy = (reviewer, s) => s.resets ? `the ${reviewer} reviewer's usage limit is reached until ${s.resets.slice(0, 16).replace('T', ' ')} UTC`
  : `the ${reviewer} reviewer's usage limit is reached, and it didn't say when it resets`;

// The stand-in for the ticket's reviewer, `fm` being the ticket's fields: { name, for, why }, or null when its own agent
// isn't held by a recorded limit or no agent on its bench can take the round. `ready` lists your ready agents and
// `held(agent)` says whether a recorded limit holds one: both are read only when the reviewer is held.
export function standInFor(repo, fm, cfg, { now = Date.now(), providers = knownProviders(repo), ready = () => readyAgents(repo), held = agent => agentHeld(repo, agent, now) } = {}) {
  const { builder, reviewer } = ticketAgents(fm, cfg);
  const limit = heldBy(repo, reviewer, now);
  if (!limit) return null;
  const own = reviewer === 'claude-subagent' ? 'claude' : reviewer, configured = configBuilder(cfg);
  let yours = [];
  try { yours = ready(); } catch { /* none can be read: the round waits for the limit */ }
  yours = (Array.isArray(yours) ? yours : []).filter(a => typeof a === 'string');
  const allowed = a => cfg.allow_same_model_review || !sameModelProblem(builder, a, cfg, '', builder !== configured ? configured : null);
  // Not refused for naming `own`: the ticket's own reviewer can differ from the settings' one, which loadConfig checks.
  const name = benchOf(cfg, 'reviewer_bench', { yours, providers }).find(a => a !== own && yours.includes(a) && !held(a) && allowed(a));
  return name ? { name, for: reviewer, why: heldWhy(reviewer, limit) } : null;
}

// The round's state `s` for the stand-in `sub`: its own agent, on its default model and effort, as reviewer_model and
// reviewer_effort are for the reviewer's own agent, with the stand-in kept for the round's record.
export const standInRound = (s, sub) => ({
  ...s,
  cfg: { ...s.cfg, reviewer: sub.name, reviewer_model: '', reviewer_effort: '' },
  ticket: { ...s.ticket, fm: { ...s.ticket.fm, reviewer: sub.name, reviewer_model: '', reviewer_effort: '' } },
  standIn: { for: sub.for, why: sub.why },
});

// What a round's record keeps of a stand-in, to spread into it.
export const standInMeta = s => (s.standIn ? { stand_in: s.standIn } : {});

// The words that say a round ran on a stand-in, from its record's meta, or '' when it didn't.
export const standInWords = m => {
  const s = m?.stand_in;
  return s && typeof s === 'object' && typeof s.for === 'string' ? `standing in for ${s.for}${typeof s.why === 'string' && s.why ? `, as ${s.why}` : ''}` : '';
};

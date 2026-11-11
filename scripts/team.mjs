// 0652: the Settings view's Your team. The settings its cards show that no other group has, each member's bench and
// QA's own (your own settings, saved for this machine), and each member's agent as speck runs it now, with whether a
// recorded usage limit holds it and which agent on its bench stands in meanwhile.

import { loadConfig } from './core.mjs';
import { benchOf, benchOwnAgent, BENCH_EXPLAIN } from './bench.mjs';
import { QA_EXPLAIN, qaOn } from './app-check.mjs';
import { agentHeld } from './reviewer-limit.mjs';
import { sameModelProblem } from './same-model.mjs';

export const TEAM_GROUP = Object.freeze({ title: 'Your team', settings: Object.freeze(['watch_bench', 'builder_bench', 'reviewer_bench', 'qa_agent', 'qa_model', 'qa_effort', 'qa_bench']
  .map(key => Object.freeze({ key, default: '', explain: BENCH_EXPLAIN[key] ?? QA_EXPLAIN[key] }))) });
export const TEAM_KEYS = Object.freeze(TEAM_GROUP.settings.map(s => s.key));

// Each member's bench, by the name the view gives it. QA's is the watch agent's while QA's settings are all blank, as
// its checks then run as the watch agent's looks do (0651).
const benchKey = (member, cfg) => (member === 'qa' ? (qaOn(cfg) ? 'qa_bench' : 'watch_bench') : { manager: 'watch_bench', builder: 'builder_bench', reviewer: 'reviewer_bench' }[member]);
export const MEMBERS = Object.freeze(['manager', 'builder', 'reviewer', 'qa']);

// Each member in `cfg`: { agent, limited }, and while `held(agent)` says a usage limit holds its agent, `stand_in`, the
// first agent on its bench that's in `ready`, isn't held itself and, for the reviewer, may review the builder's work
// under the same-model rule, or null when none can. A bench speck refuses has no one to stand in.
export function teamNow(cfg, { ready = [], held = () => false, providers = [] } = {}) {
  const out = {};
  for (const member of MEMBERS) {
    const key = benchKey(member, cfg), agent = benchOwnAgent(cfg, member === 'qa' ? 'qa_bench' : key, providers);
    if (!held(agent)) { out[member] = { agent, limited: false }; continue; }
    let bench = [];
    try { bench = benchOf(cfg, key, { yours: ready, own: agent, providers }); } catch { /* refused: none stands in */ }
    const allowed = a => member !== 'reviewer' || cfg.allow_same_model_review === true || !sameModelProblem(String(cfg.builder ?? 'claude'), a, cfg, '');
    out[member] = { agent, limited: true, stand_in: bench.find(a => a !== agent && ready.includes(a) && !held(a) && allowed(a)) ?? null };
  }
  return out;
}

// teamNow for the Settings view, with your agents that are ready as `yours` (yourAgentsView's) says, and the limits
// recorded in `repo`. null when the config can't be read.
export function teamShown(repo, yours, providers, { held = agent => agentHeld(repo, agent) } = {}) {
  try {
    const ready = (Array.isArray(yours?.agents) ? yours.agents : []).filter(a => a && a.yours === true && a.ready === true).map(a => a.id);
    return teamNow(loadConfig(repo), { ready, held, providers });
  } catch { return null; }
}

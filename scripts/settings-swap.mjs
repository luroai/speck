// 0748: a builder or reviewer picked from the other's family is refused, as for a moment the two would be the same
// family. When setting the other one to the picked one's agent until now would fix that, the refusal offers that swap,
// so the Settings view can ask, and on yes save both in one step.

import { modelFamily } from './core.mjs';
import { sameModelProblem } from './same-model.mjs';

const OTHER = { builder: 'reviewer', reviewer: 'builder' };
const MODEL = { builder: 'builder_model', reviewer: 'reviewer_model' };
const text = v => v === undefined || v === null ? '' : String(v);

// The swap that would let `checked` (the changes, as saveRepoSettings checked them) save, as { <key>: <value> } for the
// other role's agent and model, or null when there's none: when both roles change,
// when the picked agent is of the same family as the one it replaces (a change of model within one agent's family),
// when the other's value would be refused (`refused(key, value)` gives why, or null), or when the swap still clashes.
// `cfg` is the settings as they are now, `will` as they would be once saved.
export function swapOffer(checked, cfg, will, refused) {
  const roles = checked.filter(c => (c.key === 'builder' || c.key === 'reviewer') && !c.same && !c.clear);
  if (roles.length !== 1 || checked.some(c => c.key === OTHER[roles[0].key] || c.key === MODEL[OTHER[roles[0].key]])) return null;
  const role = roles[0].key, other = OTHER[role], was = text(cfg[role]), now = text(roles[0].after);
  if (!was || modelFamily(was) === modelFamily(now)) return null;
  if (modelFamily(now) !== modelFamily(text(cfg[other]))) return null; // the clash isn't with the other's agent
  // A Claude subagent reviewer becomes a Claude Code builder: a builder runs in its own session.
  // Its model goes with it, so the agent doesn't keep a model of the other's.
  const swap = { [other]: other === 'builder' && was === 'claude-subagent' ? 'claude' : was, [MODEL[other]]: text(cfg[MODEL[role]]) };
  if (Object.entries(swap).some(([k, v]) => refused(k, v) !== null)) return null;
  const after = { ...will, ...swap };
  return sameModelProblem(text(after.builder), text(after.reviewer), after, after.reviewer_model) === null ? swap : null;
}

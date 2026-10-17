// 0280: whether a builder and reviewer would run the same model. Two agents of one family (a claude builder with a
// claude-subagent reviewer, say) are kept apart only when they'd run the same model, or when that can't be told
// because a model is left at the agent's default. Two names for one model, such as an alias and its full name, count
// as different.

import { blank, modelFamily, reviewerSettings } from './core.mjs';
import { modelOf } from './build-model.mjs';

// Why `builder` and `reviewer` can't review each other without allow_same_model_review, or null when they can.
// `cfg` gives builder_model, which only Claude Code builds are given, and `reviewerModel` is the reviewer's model as
// the ticket and speck/config.yml resolve it, blank for the reviewer's default.
export function sameModelProblem(builder, reviewer, cfg, reviewerModel) {
  if (blank(builder) || modelFamily(builder) !== modelFamily(reviewer)) return null;
  const set = modelOf(cfg), b = builder === 'claude' ? set : '', r = blank(reviewerModel) ? '' : String(reviewerModel).trim();
  if (b && r && b.toLowerCase() !== r.toLowerCase()) return null;
  const who = builder === reviewer ? `builder and reviewer are both "${builder}"` : `builder "${builder}" and reviewer "${reviewer}" are the same model family`;
  const fix = 'Set builder_model and reviewer_model to two different models, use a reviewer from another family or set allow_same_model_review: true.';
  if (b && r) return `${who}, and both would run "${b}" (builder_model "${b}", reviewer_model "${r}"). ${fix}`;
  const builderSide = b ? `builder_model is "${b}"`
    : set ? `builder_model ("${set}") is only passed to Claude Code builds, so the ${builder} builder runs its default model`
    : 'builder_model isn\'t set, so the builder runs its default model';
  const reviewerSide = r ? `reviewer_model is "${r}"` : 'reviewer_model isn\'t set, so the reviewer runs its default model';
  return `${who}, and ${builderSide} and ${reviewerSide}, which could be the same. ${fix}`;
}

// The same, for a ticket: its builder and reviewer, with its reviewer model falling back to speck/config.yml's.
export const ticketSameModelProblem = (fm, cfg) => sameModelProblem(fm.builder, fm.reviewer, cfg, reviewerSettings(fm, cfg).model);

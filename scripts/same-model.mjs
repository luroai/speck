// 0280: whether a builder and reviewer would run the same model. Two agents of one family (a claude builder with a
// claude-subagent reviewer, say) are kept apart only when they'd run the same model, or when that can't be told
// because a model is left at the agent's default. Two names for one model, such as an alias and its full name, count
// as different.

import { blank, modelFamily, ticketAgents } from './core.mjs';
import { modelOf, codexBuilds, configBuilder } from './build-model.mjs';

// The model a `builder` build runs on, as far as speck can tell, or '' when it can't: builder_model, counted only when
// speck gives it to the build. Always for Claude Code, which has it added to build_command, and for Codex and Cursor
// only when build_command is blank, so speck starts the build itself (0313). 0330: a Cursor build without builder_model,
// or on a ticket of another builder's (0312), runs on Cursor's `auto`.
function builderModel(builder, cfg, elsewhere) {
  if (builder === 'claude') return elsewhere ? '' : modelOf(cfg);
  if (builder === 'codex') return !elsewhere && codexBuilds(cfg) ? modelOf(cfg) : '';
  if (builder === 'cursor') return blankBuildCommand(cfg) ? (!elsewhere && modelOf(cfg)) || 'auto' : '';
  return '';
}
const blankBuildCommand = cfg => typeof cfg?.build_command === 'string' && !cfg.build_command.trim();

// Why `builder` and `reviewer` can't review each other without allow_same_model_review, or null when they can.
// `cfg` gives builder_model (see builderModel).
// `reviewerModel` is the reviewer's model as the ticket and speck/config.yml resolve it, blank for the reviewer's default.
// `elsewhere` names the configured builder when builder_model isn't passed to this build because it's another
// builder's (0312).
export function sameModelProblem(builder, reviewer, cfg, reviewerModel, elsewhere = null) {
  if (blank(builder) || modelFamily(builder) !== modelFamily(reviewer)) return null;
  const set = modelOf(cfg), b = builderModel(builder, cfg, elsewhere), given = blank(reviewerModel) ? '' : String(reviewerModel).trim();
  // 0330: a Cursor reviewer on `auto` lets Cursor pick its model, which can't be told apart from the builder's.
  const r = reviewer === 'cursor' && given.toLowerCase() === 'auto' ? '' : given;
  if (b && r && b.toLowerCase() !== r.toLowerCase()) return null;
  const who = builder === reviewer ? `builder and reviewer are both "${builder}"` : `builder "${builder}" and reviewer "${reviewer}" are the same model family`;
  const fix = 'Set builder_model and reviewer_model to two different models, use a reviewer from another family or set allow_same_model_review: true.';
  if (b && r) return `${who}, and both would run "${b}" (builder_model "${b}", reviewer_model "${r}"). ${fix}`;
  const builderSide = b === 'auto' && builder === 'cursor' && !/^auto$/i.test(set) ? (set && elsewhere
      ? `builder_model ("${set}") is only passed to tickets built with the ${elsewhere} builder, so Cursor picks the builder's model (auto)`
      : 'builder_model isn\'t set, so Cursor picks the builder\'s model (auto)')
    : b ? `builder_model is "${b}"`
    : set && elsewhere ? `builder_model ("${set}") is only passed to tickets built with the ${elsewhere} builder, so the ${builder} builder runs its default model`
    : set ? `builder_model ("${set}") is only passed to Claude Code builds, and to Codex and Cursor builds when build_command is blank, so the ${builder} builder runs its default model`
    : 'builder_model isn\'t set, so the builder runs its default model';
  const reviewerSide = r ? `reviewer_model is "${r}"`
    : given ? `reviewer_model is "${given}", so Cursor picks the reviewer's model`
    : 'reviewer_model isn\'t set, so the reviewer runs its default model';
  return `${who}, and ${builderSide} and ${reviewerSide}, which could be the same. ${fix}`;
}

// The same, for a ticket: the builder, reviewer and reviewer model it would use, its own or else the settings' (0388).
// 0312: builder_model counts only when the ticket's builder is the one in speck/config.yml, as only that builder is given it.
export function ticketSameModelProblem(fm, cfg) {
  const own = configBuilder(cfg), use = ticketAgents(fm, cfg);
  return sameModelProblem(use.builder, use.reviewer, cfg, use.reviewer_model, use.builder !== own ? own : null);
}

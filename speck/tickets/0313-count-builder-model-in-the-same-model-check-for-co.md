---
id: "0313"
title: "Count builder_model in the same-model check for Codex builds"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0311"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:33:53.327Z"

---
# 0313 · Count builder_model in the same-model check for Codex builds

**Status:** 🔨 building

## Problem
speck run passes `builder_model` to Codex builds (0289), but the same-model check (0280) counts it only for Claude Code. A Codex builder and a Codex reviewer on two different models are refused unless `allow_same_model_review` is on, while the same pair on Claude Code is allowed.

## Outcome
The same-model check compares the models of a Codex builder and reviewer as it does Claude Code's.

## Acceptance criteria
1. With `builder: codex`, `build_command` blank, `builder_model` set and a Codex reviewer with a different model, `speck lint`, `speck set <id> status ready` and saving in the Settings view accept it without `allow_same_model_review`.
2. With the same model on both, or either left blank, it's refused as today unless `allow_same_model_review` is true.
3. When `build_command` is set, `builder_model` isn't counted for any builder, since speck doesn't know what the command runs.
4. The `allow_same_model_review` explanation in the Settings view no longer says `builder_model` counts only for Claude Code.

## Out of scope
- Cursor builders.

## Notes
- From `speck/ideas/2026-10-18-same-model-check-counts-builder-model-on-codex-builds.md` (inbox, from 0289). The check is in `scripts/lint.mjs` and `scripts/settings.mjs`.
- Failing before this build: none
- AC3 read as: builder_model counts only where speck gives it to the build. For Claude Code that is every build, as speck adds `--model` to build_command whatever it is (`withBuilderModel`), so a Claude builder is unchanged; for Codex only when build_command is blank. Counting it for no Claude build with build_command set would refuse the default Claude Code setup with a claude-subagent reviewer on two different models.
- AC4 already held: the Settings view's `allow_same_model_review` explanation never said builder_model counts only for Claude Code. The refusal message did, and now says Codex builds count when build_command is blank. Its test guards it.
- Self-check: saving a switch of the builder to codex in the Settings view now checks the models with the blank build_command the switch gives it, rather than the old one, so a Codex reviewer on a different model is accepted there too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

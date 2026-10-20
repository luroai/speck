---
id: "0330"
title: Accept a Cursor build reviewed by Cursor on a chosen model                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:00:50.848Z"

---
# 0330 · Accept a Cursor build reviewed by Cursor on a chosen model

**Status:** 🔨 building

## Problem
Someone who only has Cursor (on a work laptop, say) can build with one model and review with another, as Cursor offers many. But the same-model check counts `builder_model` only for Claude Code and Codex builds (0280, 0313), so a Cursor builder with a Cursor reviewer is always refused unless `allow_same_model_review` turns the check off for the whole project.

## Outcome
A Cursor builder and a Cursor reviewer pass the same-model check when the reviewer has a model of its own, and are refused only when both are given the same model or the reviewer's model is left blank.

## Acceptance criteria
1. With `builder: cursor`, `build_command` blank, `builder_model` set and `reviewer: cursor` with a different `reviewer_model` (compared ignoring case), `speck lint`, `speck set <id> status ready` and saving in the Settings view accept it without `allow_same_model_review`.
2. With `builder: cursor`, `build_command` blank and `builder_model` blank, so the build runs on Cursor's `auto`, and `reviewer: cursor` with `reviewer_model` set to anything but `auto`, the same three accept it without `allow_same_model_review`.
3. It's refused as today, unless `allow_same_model_review` is true, when `builder_model` and `reviewer_model` are the same, when `reviewer_model` is blank or `auto`, or when `build_command` is set, as speck then doesn't know what model the command runs.
4. The refusal message no longer says `builder_model` is passed only to Claude Code and Codex builds.
5. No test that passed before this change fails.

## Out of scope
- Showing the builder's or reviewer's model in the review pack. The pack leaves models out by design: it's for someone who doesn't read code (`scripts/pack.mjs`).
- Requiring a different model provider (for example a Claude model building and a GPT model reviewing). Two models from one provider count as different, as for Claude Code and Codex.

## Notes
- Mirrors 0313, which did the same for Codex. The check is `sameModelProblem` in `scripts/same-model.mjs`; `cursorBuilds` in `scripts/build-model.mjs` already says when speck starts the build with its own Cursor command, and `cursorStartWords` in `scripts/cursor-build.mjs` passes `builder_model`, or `auto` when it's blank.
- AC2 is the user's decision (2026-10-20): Cursor choosing the builder's model is fine as long as the reviewer's model is chosen and the review runs in its own session. Auto could pick the reviewer's model, and the user accepts that: same model in a separate session is acceptable, a different model is better.
- A ticket that records `builder: cursor` while `speck/config.yml` names another builder is built on `auto` (0312: `builder_model` is passed only to the configured builder's tickets). It counts as `auto` under AC2.
- Checked 2026-10-20: Cursor's CLI takes `--model <model>` and lists models with `--list-models` (`agent --help`, installed CLI).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

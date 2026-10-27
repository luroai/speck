---
id: "0530"
title: "Record each build's spend by model"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0529"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T12:13:53.436Z"

---
# 0530 · Record each build's spend by model

**Status:** 🔨 building

## Problem
A Codex or Cursor build records its tokens but no cost, and no build records which model did the work. In a project that builds with more than one agent, its builder spend can't be compared or added up model by model.

## Outcome
Every build's spend records the model or models it ran on, with each model's tokens and cost, whichever agent built it.

## Acceptance criteria
1. A Claude Code build's spend keeps, for each model in its result's `modelUsage`, its tokens split into uncached input, cached input, cache writes and output, and its `costUSD`. The build's cost stays its `total_cost_usd`.
2. A Codex build's spend keeps its model, its tokens split the same way from its last `turn.completed` line, and a cost priced from the price table (0524). Its model is the `-m` its command gives or, failing that, the one its session file in `~/.codex/sessions/` records.
3. A Cursor build's spend keeps the model its `--model` gives, its tokens split from its result's `usage` as a Cursor review round's are (0529), and a cost priced the same way. Its `builder_tokens` counts cache reads once: `inputTokens` plus `cacheWriteTokens` plus `outputTokens`, not with `cacheReadTokens` added again as 0291's `builderSpend` does today. A build on `auto`, or on a model with no rates, keeps its tokens with an unknown cost, never $0.
4. `speck status --json` gives each ticket's `builder_cost_usd` with its priced Codex and Cursor builds included, and `builder_models`, a list of the models its builds ran on, each with its tokens and its cost or null.
5. A Claude Code build's `builder_tokens` and `builder_cost_usd` are the same as before this change.

## Out of scope
- Builds that ended before this change: 0528.
- Showing models in the panel. `speck spend --by=model` (0527) gives them.

## Notes
- `builderSpend` in `scripts/spend.mjs` reads the logs and keeps only totals today. It's called from `recordExit` in `scripts/run.mjs`, which 0523 changes, so this waits for 0523.
- Checked 2026-10-27: Cursor's `inputTokens` already include `cacheReadTokens`: a short prompt gave 7,544 input and 6,016 cache reads, and one about 9,600 tokens longer gave 17,120 and 13,440, so input grew by the whole extra prompt although 7,424 of it was cache reads (Cursor CLI, run locally by 0529's first build).
- Failing before this build: none
- Self-check: an inline comment had swallowed `reviewer_cost_usd` in `speck status --json`, fixed; the brief's `speck run` row still said Codex and Cursor costs are left unknown, updated with a test.
- Codex builds get `-m <builder_model>` (`scripts/build-model.mjs`, 0289). Cursor builds get `--model`, with `auto` when `builder_model` is blank (`scripts/cursor-build.mjs`).
- Checked 2026-10-27: Claude Code's result `modelUsage` gives per model `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens` and `costUSD` (claude CLI, run locally). The Codex and Cursor output formats are the ones checked in 0529's Notes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

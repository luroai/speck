---
id: "0530"
title: "Record each build's spend by model"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-27T12:22:08.622Z"
finished: "2026-10-27T12:26:07.609Z"

---
# 0530 · Record each build's spend by model

**Status:** ✅ done

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
Each build now remembers which AI model did the work, and how many tokens and dollars went to each model. Builds made with Codex or Cursor now get a cost too, estimated from speck's price table, where before they showed tokens only. A Cursor build's token count is also smaller and more accurate than before, as it no longer counts reused prompt text twice. To see it, let `speck run` build a ticket and look at `speck status --json`: the ticket's `builder_models` lists each model with its tokens and cost. A Cursor build on `auto`, or one on a model the price table doesn't know, shows its tokens with an unknown cost rather than $0. Builds that finished before this change have no per-model figures.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new documentation test checks the exact prose fragment 'so theirs is left unknown'.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 519,208
- Elapsed since build started: 8 min
- Changed lines: 122 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, no inbox notes):
- Known limit: a Claude Code result with `usage` but no `modelUsage` records no models, so its spend falls under no model. Claude Code always gives `modelUsage` today.
- Known limit: a Codex build's model is read from `-m`/`--model` or its session file, not from a `-c model=…` override in a custom `build_command`; the session file usually still names it.
- Tidy-up: the Cursor log in `test/build-log-0291.test.mjs` has more cache reads than input, which Cursor never reports, so its split is unknown there.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "2b705c970f0b40b518f90f75b7f12fa1e2799b8f",
    "session": "fresh",
    "thread_id": "01a17d4e-9fb9-78e0-9de6-eb08a62b5d2d",
    "builder_response": "- Tests run: test/spend-0530.test.mjs test/build-log-0291.test.mjs test/spend-0120.test.mjs, with --related (every test file naming a changed file, plus the checks).\n- Existing tests changed: build-log-0291 and spend-0120 now expect the added `models` list, and Cursor's builder_tokens counting cache reads once (1,240 rather than 4,240), as AC3 asks.\n- A Claude Code result with only `usage` and no `modelUsage` gives no models (AC1 covers modelUsage only); its tokens and cost are as before (AC5).\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 199477,
      "cached_input_tokens": 143616,
      "cache_write_input_tokens": 0,
      "output_tokens": 919,
      "reasoning_output_tokens": 107
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 55861,
      "cached": 143616,
      "write": 0,
      "output": 919
    },
    "cost_usd": 0.1352736,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T12:21:30.284Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/spend.mjs builderSpend preserves each Claude model's token split and costUSD, retaining total_cost_usd. Both 0530 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderSpend uses commandModel, codexModel and roundTokens to price the last turn's usage. Passing 0530 AC2 tests cover command precedence, session lookup and unknown rates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "builderSpend prices Cursor usage through roundTokens and counts inputTokens + cacheWriteTokens + outputTokens. Passing 0530 AC3 tests cover priced models, auto and missing rates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "run.mjs recordExit saves logSpend results; builderSpent aggregates model spend across builds; speck.mjs statusData exposes builder_models and builder_cost_usd. The 0530 AC4 behavioural tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Claude totals retain their previous calculation and total_cost_usd. The passing 0530 AC5 test checks modelUsage, usage-only results and aggregation with earlier builds."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/spend-0530.test.mjs:180",
        "issue": "The new documentation test checks the exact prose fragment 'so theirs is left unknown'. The review rules explicitly prohibit tests of document wording. This assertion also cannot establish whether the brief accurately describes pricing.",
        "suggested_fix": "Remove the assertion against that prose fragment. Retain tests of field and command names, and judge the explanation's accuracy by review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The implementation records models and their spend, prices Codex and Cursor builds, and preserves Claude totals. The reported behavioural tests pass. One documentation test checks exact wording, which the review rules prohibit; remove that assertion before approval."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6264842769e4f7f5e2e76d06107c6f08058cdff2",
    "session": "continued",
    "thread_id": "01a17d4e-9fb9-78e0-9de6-eb08a62b5d2d",
    "builder_response": "- Tests run: test/spend-0530.test.mjs test/build-log-0291.test.mjs test/spend-0120.test.mjs (with the checks).\n- F1: fixed. Removed the assertion on the brief's prose; the test now checks only the field names, the command and `auto`.\n",
    "seconds": 15,
    "usage": {
      "input_tokens": 317278,
      "cached_input_tokens": 256512,
      "cache_write_input_tokens": 0,
      "output_tokens": 1534,
      "reasoning_output_tokens": 107
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4905,
      "cached": 112896,
      "write": 0,
      "output": 615
    },
    "cost_usd": 0.0272496,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T12:21:57.542Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/spend.mjs builderSpend retains each Claude model's four token counts and costUSD, while keeping total_cost_usd as the build cost. Both 0530 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderSpend prices the last turn.completed usage using the command's model or codexModel's session lookup. Passing 0530 AC2 tests cover token splitting, model precedence, session fallback and unknown rates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "builderSpend uses Cursor's --model and roundTokens, counts cache reads once, and preserves null costs for auto and unpriced models. All three 0530 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "run.mjs recordExit saves logSpend results; builderSpent aggregates costs and models across builds; speck.mjs statusData exposes builder_cost_usd and builder_models. The 0530 AC4 behavioural tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "builderSpend preserves Claude's previous total-token calculation and total_cost_usd. The passing 0530 AC5 test covers modelUsage, usage-only results and earlier-build aggregation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/spend-0530.test.mjs:177",
        "issue": "The prohibited assertion against an exact prose fragment has been removed. The remaining assertions check field, command and model names.",
        "suggested_fix": "No further change needed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Builds now record spend by model, including estimated Codex and Cursor costs, while preserving Claude totals. All five criteria are met and the reported tests pass. The documentation test issue is resolved; no blocking concerns remain."
  }
}
```

</details>

---
id: "0529"
title: Record what each review round costs                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0523", "0524"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0529 · Record what each review round costs

**Status:** 📋 ready

## Problem
Review rounds record the reviewer's tokens but no cost, so a ticket's spend leaves out its reviewer. Codex and Cursor report no cost, and the Claude reviewer's `total_cost_usd` isn't saved. In this repo that's 852 Codex rounds with no cost.

## Outcome
Every review round saves its model, its tokens and its cost, whichever agent reviewed it.

## Acceptance criteria
1. Each review round saves the model it ran on, its tokens split into uncached input, cached input, cache writes and output, and its cost. For a Codex round, uncached input is `input_tokens` minus `cached_input_tokens`. For a Cursor round, uncached input is `inputTokens` minus `cacheReadTokens`, with `cacheReadTokens` as cached input and `cacheWriteTokens` as cache writes.
2. A round the Claude reviewer returns, or one from a provider speck runs through Claude Code, costs the `total_cost_usd` its result reports. Because a resumed Claude Code session's `total_cost_usd` covers the whole session, a round that resumed the session of the round before it costs its `total_cost_usd` minus that earlier round's.
3. A Codex or Cursor round is priced from the price table (0524) at its model's rates. Its model is the round's `reviewer_model` when one is set. When none is set, a Codex round's model is the one its session file in `~/.codex/sessions/` records for the round's thread.
4. A round whose model is Cursor's `auto`, isn't known or has no rates, or that reported no usage, saves an unknown cost, never $0. `speck status --json` gives each ticket's `reviewer_cost_usd`, the sum of its rounds' known costs, or null when none is known.
5. Rounds saved before this change read as they do today. 0528 prices them.

## Out of scope
- Pricing rounds saved before this change: 0528.
- Showing reviewer cost in the panel: 0526.

## Notes
- The rounds are saved by `saveRound`, from `scripts/review.mjs` (Codex) and `scripts/reviewers.mjs` (Claude, Cursor, providers and command reviewers). Today they keep `usage` as the agent gave it.
- Checked 2026-10-27: `codex exec --json` ends with `turn.completed` and `usage` {`input_tokens`, `cached_input_tokens`, `cache_write_input_tokens`, `output_tokens`, `reasoning_output_tokens`}, and `input_tokens` includes the cached ones. It doesn't print the model, but the session's file `~/.codex/sessions/YYYY/MM/DD/rollout-<time>-<thread id>.jsonl` records it (codex-cli 0.159.0, run locally).
- Checked 2026-10-27: `agent -p --mode ask --trust --output-format json` prints a `result` with `usage` {`inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`}, with no model and no cost (Cursor CLI, run locally).
- Checked 2026-10-27: `claude -p --output-format json` prints `total_cost_usd`, plus `modelUsage` giving each model's tokens and `costUSD`, with `costBasis: "list"` (claude CLI, run locally).
- Checked 2026-10-27: Codex's `output_tokens` already include `reasoning_output_tokens`: in a Codex session file, `total_tokens` (353,577) is `input_tokens` (352,062) plus `output_tokens` (1,515), with the 441 reasoning tokens not added again. So cost uses `output_tokens` and leaves `reasoning_output_tokens` out (0529's first build).
- Checked 2026-10-27: Cursor's `inputTokens` already include `cacheReadTokens`: a short prompt gave 7,544 input and 6,016 cache reads, and one about 9,600 tokens longer gave 17,120 and 13,440, so input grew by the whole extra prompt although 7,424 of it was cache reads (Cursor CLI, run locally by 0529's first build).
- speck (2026-10-27 11:35 UTC) asked you: The build found Cursor's inputTokens already include cache reads, so AC1 would count them twice: may it change AC1's Cursor sentence to 'uncached input is inputTokens minus cacheReadTokens' and carry on? (Recommended: yes, and record 0291's builderSpend double count as a follow-up.). Why: The build stopped before starting because its test showed AC1's Cursor rule is wrong, and changing an approved criterion is the user's call.
- You dismissed speck's question (2026-10-27 12:00 UTC): The build found Cursor's inputTokens already include cache reads, so AC1 would count them twice: may it change AC1's Cursor sentence to 'uncached input is inputTokens minus cacheReadTokens' and carry on? (Recommended: yes, and record 0291's builderSpend double count as a follow-up.)
- Changed 2026-10-27, after that question: AC1's Cursor sentence now subtracts `cacheReadTokens` from `inputTokens`, as the build proposed. The same double count in `builderSpend` for Cursor builds is fixed by 0530, so no follow-up is needed for it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

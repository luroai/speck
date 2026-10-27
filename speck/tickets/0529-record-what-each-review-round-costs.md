---
id: "0529"
title: Record what each review round costs                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-27T12:01:08.429Z"
approved: "2026-10-27T12:09:46.788Z"

---
# 0529 · Record what each review round costs

**Status:** 👍 approved

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
- Failing before this build: none
- Codex reports a resumed session's totals, not the round's own: in this repo's rounds, each continued round's output_tokens grow by about one round's worth (0519: 975, 1504, 2046, 2579). So a resumed Codex round's tokens are its usage less that of the round whose session it resumed, as AC2 does for Claude's cost, and unknown when that round saved no usage. Whether Cursor does the same on a resumed chat isn't known, so its rounds are taken as they report.
- Self-check: a resumed Codex round whose earlier round saved no usage was priced on the whole session's totals; it now saves unknown tokens and cost. Added the brief's sentence on round costs, with a test for the field it names.

## In plain words
Every review round now keeps a note of which AI model did the review, how many tokens it used and what it cost. Claude rounds use the cost Claude reports. Codex and Cursor rounds are priced from speck's price table. When speck can't tell the model or its price, as with Cursor's "auto", the cost is left unknown rather than shown as free. Each ticket's total reviewer cost is now available to the panel, though showing it there is a later ticket. Older rounds aren't priced yet, and a later ticket does that too. Keep an eye on Cursor reviews that run several rounds: it isn't yet known whether Cursor reports each round's own usage or the whole chat's so far.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A resumed Codex round whose predecessor reported no usage is incorrectly charged for the whole session.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 413,958
- Elapsed since build started: 9 min
- Changed lines: 143 (limit 5000)
- Follow-ups:
  - Inbox: speck/ideas/2026-10-27-check-a-resumed-cursor-review-round-s-usage.md (whether Cursor's usage on a resumed chat is the whole chat's, as Codex's is).
- Known limit: a Codex round's model, when no reviewer_model is set, comes from Codex's session file on the machine that ran the round; without it the cost is unknown.

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
    "reviewed_sha": "ac1f72ee4b20f00981246aa0ed8007d6958422a5",
    "session": "fresh",
    "thread_id": "01a17d42-ac42-7d42-93be-717ed9a12a59",
    "builder_response": "- Tests run: test/round-cost-0529.test.mjs, with `speck test --related`, which also ran every existing test file that names a changed file (180 files, 0 failures).\n- Codex reports a resumed session's totals, not the round's own (see the ticket's Notes: 0519's continued rounds' output_tokens go 975, 1504, 2046, 2579). So a resumed Codex round's tokens, and so its cost, are its usage less the usage of the round whose session it resumed, as AC2 does for Claude's total_cost_usd. Without that, each continued Codex round would be priced on the whole session so far.\n- The raw `usage` each agent gives is still saved as before, so `speck status --json`'s per-round `tokens` and the Delivery log's reviewer tokens read as they do today (AC5). The new fields are `model`, `tokens` {input, cached, write, output}, `cost_usd` (null when unknown) and, for Claude Code rounds, `session_cost_usd` (the raw total_cost_usd, used by the next resumed round).\n- claude-subagent rounds (`speck record`) report no usage, so they save the reviewer_model when set and null tokens and cost.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 155764,
      "cached_input_tokens": 109184,
      "cache_write_input_tokens": 0,
      "output_tokens": 961,
      "reasoning_output_tokens": 78
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46580,
      "cached": 109184,
      "write": 0,
      "output": 961
    },
    "cost_usd": 0.1136884,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T12:08:37.307Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "roundTokens in scripts/round-cost.mjs treats an empty earlier usage object as zero counts, so a resumed Codex round can save session totals as its own tokens. The resumed-round test checks before:null but misses before:{}."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "commandSpend saves total_cost_usd and subtracts the previous session_cost_usd on continuation. The reported passing Claude integration test exercises fresh and resumed rounds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "codexSpend selects the configured model or codexModel's session-file model and uses the price table. Passing tests cover model precedence, session lookup and Cursor pricing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing tests cover unknown models, Cursor auto, missing usage and reviewer_cost_usd aggregation. reviewerCost sums known saved costs and returns null when none exist."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing legacy-round test verifies that old records remain unchanged, retain their existing status representation and receive no retrospective cost."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/round-cost.mjs",
        "issue": "A resumed Codex round whose predecessor reported no usage is incorrectly charged for the whole session. runCodexReview saves missing usage as {}, then passes that object as before. roundTokens accepts it and subtracts zero for every missing count. A direct read-only reproduction with before:{} returned the full current token totals instead of null.",
        "suggested_fix": "Validate that the earlier usage contains usable token counts before calculating a delta; otherwise save null tokens and cost. Add a regression test that resumes a round whose saved usage is {}, preferably through the review adapter.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change records reviewer costs and exposes ticket totals, with passing tests for the main paths. One resumed Codex edge case still overstates spending when the previous round reported no usage. Fix that before merge."
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
    "reviewed_sha": "3cb254ef90d0594af1b740cb4a600791170a3d10",
    "session": "continued",
    "thread_id": "01a17d42-ac42-7d42-93be-717ed9a12a59",
    "builder_response": "- Tests run: test/round-cost-0529.test.mjs\n- F1: fixed. roundTokens (scripts/round-cost.mjs) now needs the earlier round's usage to have an input or output count before it takes a difference; an empty or count-less earlier usage leaves the resumed round's tokens, and so its cost, null. Added unit cases for `before: {}` and a usage with only reasoning tokens, and a regression test through the Codex review adapter: round 1 reports no usage (saved as {}), round 2 resumes thread T1 with usage, and round 2 saves null tokens and cost while keeping the raw usage.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 255639,
      "cached_input_tokens": 203520,
      "cache_write_input_tokens": 0,
      "output_tokens": 1594,
      "reasoning_output_tokens": 78
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5539,
      "cached": 94336,
      "write": 0,
      "output": 633
    },
    "cost_usd": 0.0268416,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T12:09:24.470Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/round-cost.mjs roundTokens normalises the required token categories and subtracts resumed Codex usage. Passing AC1 tests cover all three agents and the adapter regression where earlier usage is {}."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "commandSpend uses reported total_cost_usd and subtracts the previous session_cost_usd for continued sessions. Both Claude cost tests passed, including fresh and resumed adapter runs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "codexSpend uses reviewer_model before session-file lookup; commandSpend prices Cursor usage using its configured model. Passing AC3 tests cover lookup, precedence and table-based pricing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests cover auto, unknown models, missing usage and null costs. scripts/spend.mjs reviewerCost sums known costs, and scripts/speck.mjs exposes reviewer_cost_usd."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC4/AC5 legacy-round test verifies unchanged historical records and status token values, with no retrospective pricing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/round-cost.mjs",
        "issue": "Resumed Codex rounds previously treated empty earlier usage as zero, incorrectly charging the whole session.",
        "suggested_fix": "Implemented: reject earlier usage without usable input or output counts. Unit tests and a passing adapter regression cover saved usage of {}.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change records reviewer models, token breakdowns and costs, and exposes each ticket’s known reviewer spending. The resumed Codex overcount is fixed and covered by a regression test. All five criteria pass; no blocking findings remain."
  }
}
```

</details>

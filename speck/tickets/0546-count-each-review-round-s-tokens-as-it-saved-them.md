---
id: "0546"
title: "Count each review round's tokens as it saved them"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-count-reviewer-tokens-as-each-round-saved-them.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0545"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T10:15:15.556Z"

---
# 0546 · Count each review round's tokens as it saved them

**Status:** 🔍 reviewing

## Problem
The panel's "Reviewer tokens" figure, and each round's `tokens` in `speck status --json`, add up the raw input and output a round's usage reports. A resumed Codex round's usage covers the whole session, so earlier rounds are counted again; a Claude round's cache reads and writes are left out; and a Cursor round's camelCase usage reads as 0. Anyone looking at what review costs sees the wrong number, and the ticket's total (0526) already counts it differently.

## Outcome
Each review round's tokens are counted as the round saved them, as the ticket's total does, in the panel and in `speck status --json`.

## Acceptance criteria
1. In `speck status --json`, each round's `tokens` is the tokens the round saved when it was recorded (its uncached and cached input, cache writes and output added up), the same figure the ticket's `total_tokens` counts for that round.
2. A round saved without its own tokens, as rounds were before 0529, keeps today's figure: its usage's input plus output.
3. A resumed Codex round counts only its own tokens, not the session's earlier rounds, and a Cursor round's tokens are its real count, not 0.
4. The panel's "Reviewer tokens" figure for a ticket, and the Shipped lane's median of it, add up the rounds' `tokens` as above.
5. No test that passed before this change fails.

## Out of scope
- Re-saving or backfilling old rounds (0528 did the backfill).
- Builder tokens and costs.

## Notes
- From review round 1 of 0526 (F1), which fixed this for `total_tokens` only.
- Failing before this build: none
- Self-check: no changes
- Today: each round's `tokens` is set in `scripts/speck.mjs` (`rounds:` in the status entry) from `meta.usage`; a round's saved tokens come from `roundTokens` in `scripts/round-cost.mjs` (0529); the panel shows it in `templates/panel.js` ("Reviewer tokens").

## In plain words
The "Reviewer tokens" figure on a shipped ticket in the panel, and the Shipped lane's median of it, now count what each review round really used. Before, a round that carried on an earlier Codex conversation counted that conversation's earlier rounds again, a Claude round left out its cached reading, and a Cursor round showed as nothing. Rounds saved before speck started recording their own counts show the same figure as before. To see it, open a shipped ticket's details in the panel and compare Reviewer tokens with the total: they now agree on how a round is counted. The review pack and the Delivery log still use the old count, so they can differ from the panel for now; a follow-up is in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: the review pack's and Delivery log's "Reviewer tokens" line still sums each round's usage input and output (inbox: speck/ideas/2026-10-28-count-the-pack-s-reviewer-tokens-as-each-round-saved-them.md).

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "c80bfd06305699cb4329d22ba6f325c506b4f6f9",
    "session": "fresh",
    "thread_id": "01a18209-32ae-78a2-addc-cd92805290f1",
    "builder_response": "- Tests run: `speck test --related test/round-tokens-0546.test.mjs` (the ticket's own test file plus every test file naming scripts/core.mjs, scripts/speck.mjs or scripts/spend.mjs, and the checks).\n- Two timing tests of real processes failed in that run while the machine's load average was about 33: `0232 AC3: 0176 AC3's check fails…` (CPU per check) and `0319 AC1, AC2, AC3, AC4: speck run tells another speck run's build…`. Neither touches review-round tokens; both pass when rerun with this change in (the rerun is appended at the end of the test output), and 0319 also passed with the change stashed.\n- Approach: `roundTokenCount` in scripts/spend.mjs gives a round's tokens as it saved them (`meta.tokens` input+cached+write+output, as `roundSpent` counts them for `total_tokens`), or, for a round saved without any of those counts, its usage's `input_tokens + output_tokens` as before (AC2, so an old Cursor round still reads 0). `statusData`'s `rounds[].tokens` now uses it. The panel's Reviewer tokens and the Shipped lane's median already sum `rounds[].tokens` (panel-model.js, and board-feed.mjs's `review_total` for slimmed tickets), so they follow without a change.\n- Not changed: the Delivery log's and review pack's \"Reviewer tokens\" lines (close.mjs, pack.mjs); the ticket names only the panel and `speck status --json`.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 129176,
      "cached_input_tokens": 90880,
      "cache_write_input_tokens": 0,
      "output_tokens": 771,
      "reasoning_output_tokens": 14
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 38296,
      "cached": 90880,
      "write": 0,
      "output": 771
    },
    "cost_usd": 0.09339,
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:23:54.459Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs statusData uses roundTokenCount, which sums saved input, cached input, cache writes and output. Passing test '0546 AC1' checks status output and agreement with total_tokens."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/spend.mjs roundTokenCount falls back to usage.input_tokens plus usage.output_tokens when no token counts were saved. Passing test '0546 AC2' exercises legacy rounds, missing counts and status output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing tests '0546 AC1' and '0546 AC3' verify that saved counts override cumulative Codex usage and camelCase Cursor usage, producing 4,200 and 5,060 tokens respectively."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing test '0546 AC4' exercises statusData and panelModel, checking ticket totals and the shipped median. templates/panel-model.js sums rounds[].tokens; scripts/board-feed.mjs preserves that sum in review_total; templates/panel.js displays it as Reviewer tokens."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full supplied test log confirms all four ticket tests passed. Two process timing tests failed initially and both passed on rerun. The scoped code change does not affect those process behaviours, and no existing tests were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Review token figures now use each round's saved count, correcting resumed Codex, Claude cache and Cursor totals. Older rounds retain their previous calculation. The panel totals and median receive the corrected figures. Tests cover the requested behaviour; no blocking issues were found."
  }
}
```

</details>

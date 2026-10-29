---
id: "0553"
title: "Count the pack's reviewer tokens as each round saved them"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-count-the-pack-s-reviewer-tokens-as-each-round-saved-them.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:13:41.438Z"
approved: "2026-10-29T14:17:55.020Z"
finished: "2026-10-29T14:50:54.302Z"

---
# 0553 · Count the pack's reviewer tokens as each round saved them

**Status:** ✅ done

## Problem
The review pack's and the Delivery log's "Reviewer tokens" line still adds up each round's raw usage input and output. Since 0546 the panel and `speck status --json` count each round as it saved its tokens, so for a resumed Codex round, a Claude round or a Cursor round the pack and the Delivery log give a different figure from the panel's for the same ticket.

## Outcome
The review pack's and the Delivery log's "Reviewer tokens" figure is the one the panel shows for the same ticket.

## Acceptance criteria
1. The review pack's "Reviewer tokens" line adds up each round's tokens as `speck status --json` counts them since 0546: the tokens the round saved (its uncached and cached input, cache writes and output added up), so it matches the panel's figure for the same ticket.
2. The "Reviewer tokens" line `speck close` writes in the Delivery log at approval gives the same figure as the review pack.
3. A round saved without its own tokens, as rounds were before 0529, counts its usage's input plus output, as today.
4. The line's wording and number format are unchanged, for example `Reviewer tokens: 166,010`.
5. No test that passed before this change fails.

## Out of scope
- Rewriting the Delivery logs of tickets already shipped.
- How rounds save their tokens (0529, 0546).

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0546's builder note: the line comes from `reviewTotals` in `scripts/pack.mjs`, which `scripts/close.mjs` also uses. 0546's per-round count is in `scripts/spend.mjs`, beside `roundSplit`.
- Shares `scripts/spend.mjs` with 0556, unchained: this one reads the per-round count beside `roundSplit`, 0556 changes how `recordDelegatedSpend` finds Codex sessions.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
The "Reviewer tokens" figure in a ticket's review pack, and the one written into its delivery log when it's approved, now matches the figure the panel shows for the same ticket. Before, a reviewer that carried on an earlier conversation, or one that reads a lot from its cache, could show a much bigger or smaller number in the pack than in the panel. To see it, open an approved ticket's review pack in the panel and compare its "Reviewer tokens" with the ticket's tokens in the panel: they agree. Tickets already shipped keep the figure they were given at the time.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 119,903
- Elapsed since build started: 4 min
- Changed lines: 5 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "2b0ce6b608481cbda58025f8c724669c02e9a4b1",
    "session": "fresh",
    "thread_id": "01a18805-c94d-7fa0-82eb-511e9b7975dc",
    "builder_response": "- Tests run: speck test --related test/pack-tokens-0553.test.mjs test/close.test.mjs test/pack-0131.test.mjs test/build-log-0291.test.mjs test/ship-0048.test.mjs test/round-tokens-0546.test.mjs (plus every test file --related brought in for scripts/pack.mjs, and the commands.checks files)\n- Change: `reviewTotals` in scripts/pack.mjs now adds up `roundTokenCount(r)` (0546's per-round count from scripts/spend.mjs, the one speck status --json gives each round) instead of raw usage input + output. `speck close` already takes its figure from `reviewTotals`, so the Delivery log line follows.\n- AC2 is checked end to end: a real `speck record` round, rewritten to hold a resumed Codex round's usage and saved tokens, gives 4,200 in both `speck pack` and the Delivery log `speck close` writes (it gave 10,500 before).\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 119276,
      "cached_input_tokens": 83968,
      "cache_write_input_tokens": 0,
      "output_tokens": 627,
      "reasoning_output_tokens": 0
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35308,
      "cached": 83968,
      "write": 0,
      "output": 627
    },
    "cost_usd": 0.0852828,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:17:47.627Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pack.mjs reviewTotals now uses roundTokenCount, the same helper scripts/speck.mjs uses for status JSON. Passing 0553 AC1 checks saved Codex, Claude and Cursor counts against an explicit total."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/close.mjs uses reviewTotals. Passing 0553 AC2 exercises record, pack and close, checking that both generated outputs report 4,200."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "roundTokenCount retains the usage input-plus-output fallback. Passing 0553 AC3 checks legacy, mixed and missing usage."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both output templates retain 'Reviewer tokens:' and reviewTotals retains en-GB formatting. Passing AC4 checks 166,010 formatting; AC2 checks the actual generated wording."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded test output confirms 275 passed, 3 skipped and no failures across 278 tests. The production change is limited to reusing the existing counting helper."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The review pack and Delivery log now count reviewer tokens consistently with the panel, while preserving older rounds and the existing display format. Relevant tests pass, and no blocking issues were found."
  }
}
```

</details>

---
id: "0237"
title: "Reuse a result recorded while a test run waited its turn"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0228"]          # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:06:24.452Z"
approved: "2026-10-15T22:16:10.919Z"

---
# 0237 · Reuse a result recorded while a test run waited its turn

**Status:** 👍 approved

## Problem
`speck test` looks for a recorded result for its code before it waits for a turn, and not again once it gets one. When several builds start together on code with no recorded result, for example after a commit to `main` outside a ship, each waits its turn and then runs the whole suite on the same code, one after another. With 4 builds and an 8-minute suite, the last one waits about half an hour for a result the first one recorded long before.

## Outcome
A test run that waited its turn reuses a result recorded for the same code while it waited, instead of running the suite again.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When `speck test` waits for a turn, and while it waits a result is recorded for the same code and test command, it prints that result and exits with its exit code once its turn comes, without running the suite, and says in one line that the result is reused, as it does today when one was recorded before it started.
2. `speck ship`'s test run does the same with a passing result recorded while it waited, and still runs the suite when the result recorded while it waited is a failure.
3. `speck test --fresh` never reuses a result, whether it was recorded before it started or while it waited.
4. A run that reuses a result frees its turn straight away, so the next waiting run starts without waiting for a run that never started.
5. No test that passed before this change fails.

## Out of scope
- Changing what counts as the same code, or how long results are kept (0112).
- Sharing results between machines or clones.
- `speck test --files`, which takes no turn and records no result.

## Notes
- Today `testRun()` in `scripts/results.mjs` checks `recorded()` before it calls `runTestsInTurn()` in `scripts/turns.mjs`, which waits for the turn and runs the suite with no look at the results.
- Found 2026-10-15 while deciding 0235: a build's first whole-suite run is usually reused from the ship before it, except after a change to `main` made outside a ship.
- 0228 changes the retry in `testRun()`. Build this after it.
- Failing before this build: none
- Self-check: the first look for a result no longer runs git twice; a result found after the wait is reused only if the checkout still holds the code the run started on. Two 0109 tests started a second plain `speck test` on the same code to show turn-taking, which now reuses the first's result, so their second run is `--fresh`.

## In plain words
When several builds start at once on the same code, they no longer each run the whole test suite in turn. The first one runs it, and the others, which were waiting their turn, use its result as soon as their turn comes and hand the turn straight on. With four builds and an eight-minute suite, the last one now gets its result in about eight minutes instead of half an hour.

To see it, start two test runs on the same code at the same moment: the second says it is waiting, then says it is reusing the first one's result rather than running the tests. Asking for a fresh run still always runs the tests, and a ship still never reuses a failure.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 134,657
- Elapsed since build started: 10 min
- Changed lines: 27 (limit 5000)
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
    "reviewed_sha": "cb483554cc824bed04b8d4b86064bc99a5fabbfb",
    "thread_id": "01a141a2-b0e7-7052-8212-5fa5f7987905",
    "seconds": 20,
    "usage": {
      "input_tokens": 134014,
      "cached_input_tokens": 95232,
      "cache_write_input_tokens": 0,
      "output_tokens": 643,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:16:02.764Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/results.mjs testRun() checks reusable results again after acquiring a turn and prints the existing reuse message and output. Passing 0237 AC1 test covers both passing and failing results, preserving exit codes without executing the suite."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/ship.mjs calls testRun() with reuse: 'pass'. Passing 0237 AC2 test exercises that policy after waiting: a pass is reused, while a failure causes the suite to run."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reuse: 'none' prevents both result lookups. Passing 0237 AC3 covers results recorded during the wait; existing passing 0112 AC4 covers results recorded before starting and the --fresh CLI option."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/turns.mjs runTestsInTurn() releases its claim in finally before returning a reused result. Passing 0237 AC4 verifies no claim remains and the next fresh run starts without waiting."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the full output at /tmp/speck-0237-tests.txt: 2020 tests, 2017 passed, 3 skipped, zero failures or cancellations. No pre-build failures were listed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Waiting test runs now reuse a matching result recorded while they waited and immediately release their turn. Shipping reuses only passing results, and --fresh still runs the suite. The tests cover these behaviours, the full suite passed, and no blocking issues were found."
  }
}
```

</details>

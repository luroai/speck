---
id: "0239"
title: "Keep the computer usable while speck runs tests"                # one outcome, no "and"
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
after: ["0237","0238"]   # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:46:53.383Z"
approved: "2026-10-15T22:58:21.213Z"

---
# 0239 · Keep the computer usable while speck runs tests

**Status:** 👍 approved

## Problem
`speck test --files` takes no turn, so with several builds going each can run test files at once, alongside a whole run, and every run gets the same share of the computer as the user's own programs. On an 8 GB MacBook Air that leaves the machine unusable while speck builds.

## Outcome
The computer stays usable while speck runs tests, because they run one at a time and give way to the user's own programs.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `speck test --files` waits for a turn as a whole run does, sharing `max_parallel_tests`, saying once what it's waiting for, and still records no result.
2. A test run that speck starts while it already holds a turn (the retry of failing tests, and `speck ship`'s run on the base branch alone) runs in that turn or takes the next one, and never waits on a turn held by its own command.
3. Every test run speck starts (`speck test`, with or without `--files`, the retry and `speck ship`'s runs) runs at a lower priority than normal, through `nice`, when `nice` is on the system, and as today when it isn't.
4. A test run's output, exit code and stall check are as today, and `docs/brief.md` describes both changes.
5. No test that passed before this change fails.

## Out of scope
- Running fewer of speck's own test files at once inside one run (0233).
- Lowering `max_parallel_builds`, a setting each user chooses.

## Notes
- Turns are in `scripts/turns.mjs` (`runTestsInTurn()`); `--files` runs through `watched()` in `cmdTest()` with no turn. Test commands start through `scripts/stall.mjs`, which runs them with `sh -c`.
- Today the retry runs after `runTestsInTurn()` returns, so after its turn has ended (`retry()` in `scripts/results.mjs`).
- 0237 changes how `testRun()` uses turns, after 0228 changes the retry, and 0238 adds `--recorded` to `cmdTest()`. Build this after them.
- Checked 2026-10-15: `nice` is a POSIX utility, present on Linux and macOS (`command -v nice` on this box).
- Failing before this build: none
- Self-check: no changes

## In plain words
When several builds are going, their test runs now wait their turn, including the quick runs of just a few test files that builds make while they work, so only as many run at once as the setting allows. Every test run also gives way to your own programs, so the computer should stay responsive while speck tests. To see it, start two builds at once: one says it's waiting for a turn while the other's tests run. Worth watching: builds may take a little longer, as their quick test runs now queue behind full runs.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 160,093
- Elapsed since build started: 11 min
- Changed lines: 117 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: a speck command started by a test command itself (a separate process) still takes a turn of its own, so with `max_parallel_tests: 1` it would wait for the run that started it; no test command speck ships with does that.

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
    "reviewed_sha": "065601bbe8d5e55e2666d43628a38f52c2d82369",
    "thread_id": "01a141c9-3661-7252-abb1-f3d6516d311b",
    "seconds": 23,
    "usage": {
      "input_tokens": 159324,
      "cached_input_tokens": 109952,
      "cache_write_input_tokens": 0,
      "output_tokens": 769,
      "reasoning_output_tokens": 47
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:58:10.441Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/turns.mjs cmdTest() now uses runTestsInTurn() for --files without recording results. Both AC1 tests in test/turns-0239.test.mjs passed, checking waiting, one notification, shared capacity and no recorded result."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/results.mjs testRun() holds inTurn() across the initial run and retry. Both AC2 tests passed, including verification that both runs hold the same claim. scripts/ship.mjs testFailure() checks the base branch after the previous testRun() has released its turn."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/stall.mjs launches commands through nice when available and directly through sh otherwise. All full, file, retry and ship runs use this launcher. Both AC3 tests passed, measuring actual process priority with and without nice available."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 output, exit-code and documentation tests passed. Existing test/stall-0152.test.mjs coverage includes stalled --files runs and process cleanup; it passed alongside the other stall and killed-process regression tests. docs/brief.md describes turns and lower priority."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test log confirms 134 tests passed with no failures across the ticket tests and related regression files. No existing tests were weakened. The whole-suite check remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "File-specific tests now share the test queue, retries keep their turn, and test commands run at lower priority when supported. The relevant 134 tests passed. I found no blocking issues or unrelated changes."
  }
}
```

</details>

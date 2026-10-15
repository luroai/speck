---
id: "0239"
title: "Keep the computer usable while speck runs tests"                # one outcome, no "and"
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
after: ["0237","0238"]   # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:46:53.383Z"

---
# 0239 · Keep the computer usable while speck runs tests

**Status:** 🔨 building

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

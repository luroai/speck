---
id: "0112"
title: "Reuse a test run's result when the code hasn't changed"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T09:59:34.988Z"

---
# 0112 · Reuse a test run's result when the code hasn't changed

**Status:** 🔨 building

## Problem
A build runs the whole test suite (about 100 seconds here) six or seven times, including its ship, which is 10–12 minutes of a 15–20 minute build. Some of those runs test code that has already been tested unchanged: with one build at a time, the last ship has just run the suite on the base branch the build starts from, and a ship often re-tests exactly what the builder's last run tested.

## Outcome
`speck test` and `speck ship` reuse a passing or failing result for code that has already been tested, instead of running the suite again.

## Acceptance criteria
1. When `speck test` or `speck ship` runs the suite with no uncommitted changes outside `speck/`, speck records the result: pass or fail, the failing tests' output, and the test command, against the commit's files outside `speck/`. No result is recorded when there are uncommitted changes outside `speck/`.
2. `speck test` with no uncommitted changes outside `speck/`, whose files outside `speck/` match a recorded result for the same test command, prints that result and exits with its exit code without running the suite. It says in one line that the result is reused, and from which commit and when.
3. `speck ship`'s test run reuses a recorded passing result the same way, saying so in one line. A recorded failure is never reused by ship: it runs the suite.
4. `speck test --fresh` always runs the suite, and records its result as in AC1.
5. A change to any file outside `speck/`, or to `commands.test`, means no result is reused.

## Out of scope
- Running only some tests (0113).
- Reusing results across machines or clones.

## Notes
- Excluding `speck/` matters because ticket commits change only `speck/`, so a ship's merge after the user has committed tickets still matches the builder's last run.
- Known risk: a test that reads files under `speck/` (as some tests in this repo do) could reuse a result that would now differ. `--fresh` is the way out; the builder should list any such tests it finds as a follow-up.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

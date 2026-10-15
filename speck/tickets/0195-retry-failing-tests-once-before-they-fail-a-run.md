---
id: "0195"
title: "Retry failing tests once before they fail a run"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T10:34:23.148Z"

---
# 0195 · Retry failing tests once before they fail a run

**Status:** 🔨 building

## Problem
A test that fails once by chance fails the whole run: it cost 0164 a review round and can stop a ship, and then someone has to step in although nothing is wrong with the change.

## Outcome
When a full test run fails, speck runs the failing tests' files once more, and tests that pass the second time don't fail the run but are reported as flaky.

## Acceptance criteria
1. When a full test run through speck fails (`speck test` without `--files`, or the tests `speck ship` runs), speck runs `commands.test_files` once more with only the files that had a failing test, taken from each failing test's `location:` in the output. If every test passes in that second run, the run counts as passed: `speck test` exits 0 and `speck ship` carries on.
2. If any test fails in the second run, the run fails exactly as it does today, and its output is the first run's output followed by the second run's.
3. The output of a run that passed only on the second try ends with a line `Flaky: <test name>; <test name>…` naming each test that failed and then passed, and the same tests are added, with the time and the branch, to one log every worktree of the repo shares.
4. There's no second run, and the run fails as today, when `commands.test_files` is blank, when any failing test has no `location:` in a test file, or when the run stalled.
5. No test that passed before this change fails.

## Out of scope
- Quarantining or skipping flaky tests, or fixing them.
- Showing flaky tests in the panel.
- Retrying `speck test --files` runs.

## Notes
- Asked for 2026-10-15, with 0193 and 0194, to stop chance failures needing the user.
- Checked 2026-10-15: `node --test` with output that isn't a terminal writes TAP, and a failing test's details include `location: '<absolute path>:<line>:<col>'` (Node v22.23.3, tried on a one-test file).
- `scripts/results.mjs` `testRun` is shared by `speck test` and `speck ship`; `scripts/tap.mjs` `failingTests` already reads failing test names from the output.
- A result that passed only on the second try may be recorded as a pass for reuse.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

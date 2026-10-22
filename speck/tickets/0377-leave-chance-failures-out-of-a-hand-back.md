---
id: "0377"
title: "Leave chance failures out of a hand-back"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-leave-chance-failures-out-of-a-hand-back.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:24.194Z"

---
# 0377 · Leave chance failures out of a hand-back

**Status:** 🔨 building

## Problem
When a ship's tests fail and some of those tests pass on a second try, the ship still names the ones that passed. With the base branch's own tests failing, that alone can hand the ticket back to its build to fix a test that isn't broken.

## Outcome
A test that fails once and passes on the second try is not named as the ticket's own failure, and is not what hands the ticket back.

## Acceptance criteria
1. When a ship's tests fail, the failing tests' files are run once more, and a test that failed passes on that second try, the ship's refusal does not name that test, and that test is not a reason speck run hands the ticket back to its build.
2. A test that fails on both tries is still named, and still hands the ticket back when the base branch's tests pass, or when that test passes on the base branch, as it does today.
3. When every test that failed the first time passes on the second try, the ship counts the run as passed, as it does today.
4. No test that passed before this change fails.

## Out of scope
- How many times a failing file is retried.
- A test run that isn't a ship's.

## Notes
- Checked 2026-10-22: `testRun` in `scripts/results.mjs` counts a retry that passes altogether as a pass (0195). A retry that doesn't is appended to the first run's output, and `failingTests` in `scripts/tap.mjs` lists every test that isn't ok in that output. `testFailure` in `scripts/ship.mjs` names that list and, with `together`, makes speck run hand the ticket back (0264).
- Waits for 0375 so it ships in 0.13.1, not in 0.13.0. It changes `scripts/ship.mjs`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

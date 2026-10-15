---
id: "0228"
title: "Skip the retry for tests that already fail on the base branch"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:23:50.976Z"

---
# 0228 · Skip the retry for tests that already fail on the base branch

**Status:** 🔨 building

## Problem
When a full test run fails, speck runs the failing tests' files once more to catch tests that fail by chance. Tests that already fail on the base branch aren't failing by chance, so retrying them only costs time, and with them in the run the retry can never pass it. On an 8 GB MacBook Air, the 26 tests already failing on `main` cost 316 s of test time per full run, half of it on the retry.

## Outcome
The retry after a failing run leaves out tests that already fail on the base branch.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a full test run fails and the result recorded for the base branch's code lists failing tests, the retry leaves those tests' files out, unless one of them also holds a failing test that didn't fail on the base branch.
2. When every failing test also failed on the base branch, there's no retry, and speck says in one line that the failing tests already fail on the base branch.
3. When no result is recorded for the base branch's code, the retry works as today.
4. The run still counts as failed while any test failed, the `Flaky:` line still names only tests that failed and then passed, and no test that passed before this change fails.

## Out of scope
- Changing which tests a build records as failing before it starts.
- Listing a test that failed on both tries once in the summary (0221).

## Notes
- The retry is `retry()` in `scripts/results.mjs`, called from `testRun()`. Results are recorded per code (`recorded()`), so the base branch's result is usually there already: a build's first full run is on the base branch's code.
- Measured 2026-10-15 on an 8 GB MacBook Air: 26 tests failing on `main`, 52 failing rows (each failed twice), 316 s of test time.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

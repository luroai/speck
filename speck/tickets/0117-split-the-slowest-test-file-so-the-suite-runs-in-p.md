---
id: "0117"
title: "Split the slowest test file so the suite runs in parallel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-make-the-test-suite-faster.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:21:32.012Z"

---
# 0117 · Split the slowest test file so the suite runs in parallel

**Status:** 🔨 building

## Problem
Every build waits on the full test suite several times, and the suite takes about 108 seconds. 89 of those are one file, `test/speck.test.mjs` (171 tests): `node --test` runs files in parallel, but the tests in one file one after another, so everything else finishes while that file is still running.

## Outcome
The tests in `test/speck.test.mjs` are spread over several smaller files, so they run in parallel and the full suite takes about as long as its next slowest file.

## Acceptance criteria
1. `test/speck.test.mjs` is replaced by test files grouped by the area they test, none with more than 30 tests.
2. Every test from `test/speck.test.mjs` is in one of the new files with the same name and the same checks, and the suite has the same number of tests as before.
3. Helpers the new files share are in a module under `test/support/`, not copied into each file.
4. No test that passed before this change fails.
5. The Delivery log gives the full suite's elapsed time before and after the change, each measured with `speck test` on the same machine.

## Out of scope
- Changing what any test checks, or speeding up individual tests.
- The panel tests' port clash (0118) and their fixed waits.

## Notes
- Measured 2026-10-11 on 16 cores: the full suite takes 108 seconds and `test/speck.test.mjs` 89 alone. The next slowest file, `test/run.test.mjs`, takes 27, so expect about 30 seconds afterwards.
- This changes only test files, which don't count towards `max_changed_lines`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

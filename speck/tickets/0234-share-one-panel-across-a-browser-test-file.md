---
id: "0234"
title: "Share one panel across a browser test file"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-share-one-panel-across-a-browser-test-file.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0231"]               # ticket ids that must be done first
created: 2026-10-15

---
# 0234 · Share one panel across a browser test file

**Status:** 📋 ready

## Problem
Each test in the real-browser test files makes a repo and starts a `speck panel` only to serve the page, about 0.6 s of its 1 s or so. Tried on `test/panel-0155.test.mjs` during 0198, sharing one panel took the file from about 25 s to 9 s with all 22 tests passing.

## Outcome
The real-browser test files whose page stub answers every request start one repo and one panel for the whole file.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. In `test/panel-0155.test.mjs` and `test/panel-0160.test.mjs`, one repo and one `speck panel` are started for the whole file and kept until it ends, instead of one for each test.
2. When the file ends, whether its tests passed or failed, that panel is stopped and its repo removed.
3. No test that passed before this change fails.

## Out of scope
- Other browser test files, whose page stubs don't answer every request.

## Notes
- The shared panel's repo needs a `speck-keep-*` folder, which `test/support/tmp.mjs` leaves alone between tests.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

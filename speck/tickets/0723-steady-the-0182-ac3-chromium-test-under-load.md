---
id: "0723"
title: "Steady the 0182 AC3 Chromium test under load"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-12-fix-0182-ac3-failing-in-the-full-suite.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:06.030Z"

---
# 0723 · Steady the 0182 AC3 Chromium test under load

**Status:** 🔨 building

## Problem
The 0182 AC3 test ("Chromium has closed within 10 s of a test file finishing that ran out of time") fails now and then in the full suite on a busy machine, then passes on retry. Each failure turns main red, so speck run raises fix tickets and builds can't trust the baseline.

## Outcome
The 0182 AC3 test passes on a busy machine and still catches Chromium left running.

## Acceptance criteria
1. The 0182 AC3 test passes 10 runs out of 10 while the machine is under the load speck's own steadying tests use (as in 0689).
2. It still fails when Chromium really is left running after a test file runs out of time.
3. No test that passed before this change fails.

## Out of scope
- Other timing tests.

## Notes
- The test is `test/panel-0182.test.mjs`. Seen failing in full-suite records from 2026-10-23 to 2026-11-11, and twice in `speck/.cache/flaky/flaky.log` (2026-11-12 and 2026-11-15); the latest full suite on main (2c2af9f) passed. The failure is "Chromium still running 10 s after the test file finished": the cleanup is late, not missing. 0689 replaced fixed bounds with ones measured in the test.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

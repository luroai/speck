---
id: "0745"
title: "Name only the tests that still fail after a full-suite retry"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-24-name-only-the-tests-that-still-fail-after-a-full-suite-retry.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:16:24.266Z"

---
# 0745 · Name only the tests that still fail after a full-suite retry

**Status:** 🔨 building

## Problem
When the full suite's retry clears some of the first run's failures, `latest.json` and the fix ticket still name every first-run failure. On a busy machine that makes oversized fix tickets: 0736 named 22 tests when only 0159 AC3 still failed.

## Outcome
The full suite's result and its fix ticket name only the tests that failed again on the retry.

## Acceptance criteria
1. When the retry passes some first-run failures and fails others, `latest.json` and the fix ticket speck run writes name only those that failed on the retry.
2. When the retry fails everything that failed first, they name all of them, as today.
3. No test that passed before this change fails.

## Out of scope
- When the full suite retries.

## Notes
- `full-suite.mjs` builds `tests` with `failingTestFiles`, which doesn't drop first-run failures that passed on the retry, as `failingTests` does since 0377.
- Failing before this build: none
- Self-check: no changes. A test whose file was left out of the retry because it already fails on the base branch has no pass on the retry, so it is still named; a test that failed only on the retry is named too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

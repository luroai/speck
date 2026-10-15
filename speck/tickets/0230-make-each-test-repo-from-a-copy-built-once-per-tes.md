---
id: "0230"
title: "Make each test repo from a copy built once per test file"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
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

---
# 0230 · Make each test repo from a copy built once per test file

**Status:** 📝 draft

## Problem
Most of speck's tests make a fresh temporary git repo with speck set up in it, running `git init` and several commits each time. On an 8 GB MacBook Air, 507 tests took 1 to 3 s each, 43% of the suite's test time, and setting up their repos is a large part of that.

## Outcome
Tests get their temporary repos by copying one made earlier in the same test file, not by setting each one up from scratch.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. The shared helpers that make a temporary speck repo (`reviewRepo()` and the others in `test/support/`) set up the first repo of each kind in a test file as today, and make each later one by copying it, running no `git init` or setup commits.
2. Each copy is its own repo: a change in one test's repo never shows in another's, and each is removed when its test ends, as today.
3. No test that passed before this change fails.

## Out of scope
- Starting the speck CLI inside the test process (0231).
- Test files that set up their repos by hand, without the shared helpers.

## Notes
- The helpers are in `test/support/speck.mjs`; `test/support/tmp.mjs` cleans up temporary folders and leaves `speck-keep-*` ones alone between tests.
- Write the suite's total test time before and after, on the same machine, in the Delivery log.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

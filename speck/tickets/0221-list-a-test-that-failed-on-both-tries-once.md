---
id: "0221"
title: "List a test that failed on both tries once"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-list-a-test-that-failed-twice-once.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0221 · List a test that failed on both tries once

**Status:** 📝 draft

## Problem
When a full test run fails and its failing tests fail again on the second try, the reviewer's test summary lists each failing test twice, once per run, and its totals are the second try's few files rather than the whole suite's. A reviewer sees double the failures and a suite that looks tiny, which can cost a review round asking about it.

## Outcome
A test that failed on both tries appears once in the reviewer's test summary, with the whole suite's totals.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a full test run fails and its failing tests' files are run again and fail again, the reviewer's test summary lists each failing test once, with the error details from the second try.
2. That summary's totals (tests, passes and failures) are the full run's, not the second try's.
3. The failing count saved with the review round, and shown in the review pack, counts each failing test once.
4. A run whose second try passes (with its `Flaky:` line) and a run with no second try are summarised as today, and no test that passed before this change fails, except 0209's check that a test failing on both tries is listed twice, which is changed to check AC1 to AC3.

## Out of scope
- Showing the first try's error details as well.

## Notes
- The two runs' output is joined in `scripts/results.mjs` and summarised by `readTap()` and `summariseTap()` in `scripts/tap.mjs`, which only cut the text at the retry note when a `Flaky:` line follows.
- The note's open question is settled as the second try's details only (AC1).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

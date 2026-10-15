---
id: "0209"
title: "Show the reviewer which failures passed on a retry"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-show-the-reviewer-which-failures-passed-on-a-retry.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15

---
# 0209 · Show the reviewer which failures passed on a retry

**Status:** 📝 draft

## Problem
When a full test run passes only on its second try (0195), the summary of the test output the reviewer gets still lists the first try's failures as failing tests, beside a run that passed. A reviewer may then spend a round asking about them.

## Outcome
The reviewer's test summary says which tests failed and then passed on the second try, apart from real failures.

## Acceptance criteria
1. For a run that passed only on its second try, the summary the reviewer gets says the run passed, and lists the tests that failed then passed under "Passed on a second try", not under failing tests.
2. For a run that failed on both tries, the summary lists the failing tests as it does today.
3. A run that passed first time is summarised as it is today.
4. The summary in `speck pack` for the ticket agrees with the reviewer's.
5. No test that passed before this change fails.

## Out of scope
- Fixing the tests that fail by chance (0207).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- The summary comes from `summariseTap` in `scripts/tap.mjs` (0119); the `Flaky:` line is written by `scripts/results.mjs` (0195) at the end of the output.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

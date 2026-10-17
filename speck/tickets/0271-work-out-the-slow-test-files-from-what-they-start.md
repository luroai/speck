---
id: "0271"
title: "Work out the slow test files from what they start"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T10:57:50.396Z"

---
# 0271 · Work out the slow test files from what they start

**Status:** 🔨 building

## Problem
Test files that start a real panel, a browser or `speck run` must be listed by hand in `test/support/heavy.mjs`, and a test (0233 AC1) fails when one isn't. Builders don't run that test, so they forget, and the ticket is handed back at ship time. Every such ticket also adds to the same list, so tickets built side by side conflict there. On 2026-10-17 this handed back 0258, 0261 and 0268, and caused 0268's merge conflict.

## Outcome
The test runner works out which test files are heavy from what they start, so there's no list to keep up to date and nothing to forget.

## Acceptance criteria
1. `npm test` treats as heavy every test file that starts a real panel, a browser or `speck run`, found from the file's own code the way 0233 AC1's check finds them today, and only those files.
2. A new test file that starts a real panel is treated as heavy without any other file being changed.
3. On a machine with 8 cores or fewer, the heavy files still run at most 2 at a time beside the others, and with more cores they run with no limit of their own, as today.
4. No hand-kept list of heavy test files is left, and no test checks one.
5. No test that passed before this change fails, apart from those that checked the hand-kept list.

## Out of scope
- Changing which helpers count as starting a real panel, browser or `speck run`.
- Changing how many heavy files run at once.

## Notes
- Today's list is `HEAVY` in `test/support/heavy.mjs`, used by `runSuite` in `test/support/suite.mjs`. The check is the 0233 AC1 test in `test/suite-0233.test.mjs`, which finds the files with a pattern of helper names.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

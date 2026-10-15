---
id: "0238"
title: "Start a build without running the whole suite"                # one outcome, no "and"
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
after: ["0231","0235","0237"] # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:35:17.058Z"

---
# 0238 · Start a build without running the whole suite

**Status:** 🔨 building

## Problem
Every build starts by running the whole suite, only to list the tests that already fail before it changes anything. Usually that reuses the result from the ship before it, but after any change to the base branch made outside a ship it's a whole run on a laptop that may already be busy, for a list that's nearly always "none".

## Outcome
A build lists the tests already failing from a result speck has recorded, and never runs the whole suite to find them.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `speck test --recorded` prints the result recorded for this checkout's code and test command, as `speck test` does when it reuses one, and exits with its exit code, without running any tests. With none recorded, it runs nothing, says so in one line and exits with code 0.
2. `/speck-build` tells the builder, before it changes anything, to run `speck test --recorded` instead of the whole suite, and to write `Failing before this build:` from it: the failing tests, `none`, or `not checked` when no result is recorded.
3. The reviewer prompt treats `Failing before this build: not checked` as an empty list: fixing a test unrelated to the ticket is still an unrelated change, but no test is singled out as listed.
4. `docs/brief.md` describes `speck test --recorded` and says a build doesn't run the whole suite before it starts.
5. No test that passed before this change fails.

## Out of scope
- Running only the ticket's own tests during review rounds (0235).
- Recording results anywhere new: this reads the ones `speck test` and `speck ship` already record (0112).

## Notes
- Results are recorded per code in `scripts/results.mjs` (`testedCode()`, `recorded()`); `speck test` is `cmdTest()` in `scripts/turns.mjs`. A ship records the result for the code it lands, so a build started after it usually finds one.
- The builder's step is `skills/speck-build/SKILL.md` section 1 step 6; the reviewer's scope rule is item 4 in `templates/reviewer-prompt.md`.
- 0235 changes the same skill and reviewer prompt, 0237 the same `testRun()` and `cmdTest()` code, and 0231 `scripts/speck.mjs`, where `speck test`'s usage lines are; all three come first.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

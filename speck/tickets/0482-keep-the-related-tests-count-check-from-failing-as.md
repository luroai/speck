---
id: "0482"
title: "Keep the related-tests count check from failing as the suite grows"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-keep-the-related-tests-count-check-from-failing-as-tests-grow.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0482 · Keep the related-tests count check from failing as the suite grows

**Status:** 📋 ready

## Problem
0447's AC3 test checks that 0437's change (`scripts/turns.mjs`, the build skill and `docs/brief.md`) picks fewer than 100 related tests from a copy of this repo's own `test/` folder. It picks 98 today, and every new test that names `docs/brief.md` adds one, so within a few tickets `speck ship` will fail on it for a ticket that did nothing wrong.

## Outcome
The check still guards 0447's rules for `speck test --related`, without depending on how many tests the suite has.

## Acceptance criteria
1. 0447's AC3 check passes however many test files name `docs/brief.md`, `scripts/turns.mjs` or the build skill: with 100 more test files that each name `docs/brief.md` in the tests it measures, it still passes, where today it fails.
2. The check still fails when `--related` brings a test in through a support module for a skill's `SKILL.md`, and when it brings one in through a support module for a file more than a quarter of the support modules name: checked by turning each of those two rules off in `scripts/related.mjs` in turn and seeing the check fail.
3. Every test file that names `scripts/turns.mjs` is still among the tests 0437's change picks. No test that passed before this change fails.

## Out of scope
- Which tests `--related` picks: `scripts/related.mjs` doesn't change.
- Picking the tests that load the panel's page through `test/support/panel.mjs` (the inbox note "Bring in page tests for a panel script change").

## Notes
- From the inbox note, raised while building 0447. Measured on 2026-10-24 on main: 0437's change picks 98 test files, so two more tests that name the brief fail it.
- Today: `measuredRepo()` and the AC3 test in `test/related-0447.test.mjs` copy the live `test/` folder. history-0085 forbids commit ids in tests, so the check can't pin the folder to a commit.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0657"
title: "Run the panel's house-rule tests before every ship"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0656"]                # ticket ids that must be done first
created: 2026-11-11

---
# 0657 · Run the panel's house-rule tests before every ship

**Status:** 📋 ready

## Problem
Since 0631, speck ships on its quick tests, which leave out every test that starts a real panel or browser. Some of those check rules for the whole panel, such as every coloured background setting its text colour (0161 AC1) and the allowed text sizes (0427 AC1), so on 2026-11-11 two panel tickets shipped breaking them, and the full suite failed on `main` afterwards, showing Needs you.

## Outcome
A build or ship that breaks one of the panel's house rules fails before review and ship, not afterwards on `main`.

## Acceptance criteria
1. `node test/support/suite.mjs --quick` always runs every file listed in `commands.checks`, heavy or not, as well as the files it runs today.
2. `commands.checks` in `speck/config.yml` lists the test files that check a rule across the whole panel, `test/panel-0161.test.mjs` and `test/panel-0427.test.mjs` among them, and each listed file exists.
3. A change that sets 13 px text where 0427 forbids it, or a coloured background with text and no text colour of its own, fails `speck test --files` with any other file, and fails the quick run.
4. No test that passed before this change fails.

## Out of scope
- Moving other heavy tests back into ships.

## Notes
- 0631 made the quick run (`--quick` in `test/support/suite.mjs`); `commands.checks` already runs alongside `speck test --files` in builds (brief: `speck test`).
- After 0656, as these rules fail on `main` until it ships.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

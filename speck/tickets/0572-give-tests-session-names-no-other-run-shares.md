---
id: "0572"
title: "Give tests session names no other run shares"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-29-give-tests-session-names-no-other-run-shares.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:15:19.379Z"

---
# 0572 · Give tests session names no other run shares

**Status:** 🔨 building

## Problem
speck finds a resumed build by looking for its session name across every process on the machine. Tests that start a stand-in agent with a fixed session name, such as `hand-0001` in `test/seen-builds-0300.test.mjs`, can find another test run's copy when the same file runs twice at once, and fail by chance: `0300 AC2` did so beside the suite in 0559's runs.

## Outcome
Tests that are found through the process table give their stand-in agents session names unique to the test run, as 0559 did for `resumed-0002`.

## Acceptance criteria
1. Every test that starts a stand-in agent process with a session name that speck finds through the process table uses a name unique to its test run, and the Delivery log lists the tests changed.
2. Two copies of each changed test file, run at the same time, both pass, five times in a row, recorded in the Delivery log.
3. Each changed test still fails if speck stops finding the build by its session name: the Delivery log says how this was checked.
4. No test that passed before this change fails.

## Out of scope
- How speck finds a resumed build.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- From 0559's own runs. 0559 made `resumed-0002` unique with the test process's pid (`test/seen-builds-0300.test.mjs`, around line 172).
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

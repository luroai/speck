---
id: "0775"
title: "Steady the 0067 panel restart tests"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-25-steady-the-0067-ac2-restart-token-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26

---
# 0775 · Steady the 0067 panel restart tests

**Status:** 📝 draft

## Problem
"0067 AC2: the token survives a restart" and "0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again" fail now and then on a busy machine, turning builds' and `main`'s test runs red for no real fault.

## Outcome
The two 0067 restart tests pass on a busy machine and still catch a real fault.

## Acceptance criteria
1. 0067 AC2 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if the token changes across a restart.
2. 0067 AC4 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if failing new code stops the old server serving.
3. No test that passed before this change fails.

## Out of scope
- Other panel tests.

## Notes
- From 0751's and 0761's builds. 0689 and 0723 replaced fixed waits with bounds measured in the test.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

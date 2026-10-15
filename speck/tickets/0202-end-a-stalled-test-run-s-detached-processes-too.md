---
id: "0202"
title: "End a stalled test run's detached processes too"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-end-a-stalled-test-run-s-detached-processes-too.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15

---
# 0202 · End a stalled test run's detached processes too

**Status:** 📋 ready

## Problem
When a test run stalls, speck ends the test command's process group, but not processes the tests started in a group of their own, or whose parent has already exited. Those can run for good, using memory and slowing every later run and build on the machine: the same kind of leak that pushed this machine's load above 100 on 2026-10-14.

## Outcome
When speck ends a stalled test run, every process that run started has ended too.

## Acceptance criteria
1. When a full test run through speck stalls and speck ends it, every process the run started has ended within 10 seconds, including ones the tests started in a process group of their own and ones whose parent had already exited.
2. Processes that the run didn't start, including another build's test run going at the same time, are left running.
3. A run that doesn't stall works as before, and so does the stall limit (`test_stall_minutes`).
4. The reviewer time limit (0180) still ends every process a reviewer started, and the two use the same way of finding a run's processes rather than two copies of it.
5. No test that passed before this change fails.

## Out of scope
- Processes left behind before this ships.
- Killed ships and builds (0174).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- From the 0180 review: the reviewer limit finds a run's processes by their descendants (through `ps`) and by an environment marker each one carries (`runLimited` in `scripts/reviewers.mjs`). The stall handling in `scripts/stall.mjs` (0152, 0174) still uses the process group alone.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

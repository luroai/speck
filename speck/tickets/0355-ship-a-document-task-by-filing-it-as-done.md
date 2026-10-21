---
id: "0355"
title: "Ship a document task by filing it as done"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0354"]                # ticket ids that must be done first
created: 2026-10-21

---
# 0355 · Ship a document task by filing it as done

**Status:** 📋 ready

## Problem
`auto_ship` covers both risks in this project, so a document task would be approved and filed as done before the user had read it. For a document, reading it is the review, and every new task starts with the user holding Gate 2.

## Outcome
A document task waits approved until the user ships it, and shipping it carries only the ticket's own records.

## Acceptance criteria
1. Neither `speck ship <id> --auto` nor `speck run`'s ship queue ships a document task, whatever `auto_ship` and `auto_ship_risk` say. The reason given says a document task waits for you to ship it.
2. `speck ship <id>` on an approved document task whose branch changes only files under `speck/` merges it and files it as done without running the test suite.
3. `speck ship <id>` refuses a document task whose branch changes any file outside `speck/`, naming those files, and ships nothing.
4. A code ticket ships as it does today.
5. No test that passed before this change fails.

## Out of scope
- A per-task `auto_ship` setting, for once the user trusts documents: later, from how many came back unchanged.
- Asking for changes instead of shipping (0356, 0357).

## Notes
- Agreed with the user 2026-10-21: documents never auto-ship to begin with.
- The branch still merges, because it carries the ticket's status, review rounds and logs. The document itself is in `outputs/`, which isn't in git, so there's nothing to test.
- `autoShipWhyNot` and `shipTicket` in `scripts/ship.mjs`; `scripts/ship-queue.mjs`. The panel's Ship button runs `speck ship`, so it needs no change.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

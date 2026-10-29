---
id: "0552"
title: "Hand back a pull request refused for private words"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-25-hand-back-a-pull-request-refused-for-private-words.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29

---
# 0552 · Hand back a pull request refused for private words

**Status:** 📋 ready

## Problem
In pull request mode, when `speck ship --auto` refuses a ticket because a file under `speck/` holds a private word or the home folder's path (exit 17), speck run's pull request queue only says it didn't ship. The ticket waits for the Foreman or the user, though its build has steps to take them out, as it does in local mode.

## Outcome
speck run's pull request queue hands a ticket refused for private words back to its build, as the local ship queue does.

## Acceptance criteria
1. In pull request mode, when speck run's pull request queue ships a ticket and `speck ship <id> --auto` exits 17, the ticket is handed back to its build with the kind `private` and the ship log's last line as the reason, as the local ship queue does for exit 17.
2. While that hand-back is still to run, the pull request queue doesn't try to ship the ticket again, as for a ticket handed back for a conflict today.
3. Exit 13 is still handed back as a conflict, and any other refusal is handled as today: said in one line and tried again once its pull request, the base branch or its branch changes.
4. No test that passed before this change fails.

## Out of scope
- Handing back other exit codes in pull request mode, such as tests (16) or the base branch (14).

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0506's own note: the private-words check in `scripts/ship.mjs` runs in both modes, but only the local ship queue maps exit 17 to a hand-back (`HAND_BACK` in `scripts/ship-queue.mjs`). The pull request queue hands back only exit 13 (`scripts/pr-queue.mjs`, in its ship callback). 0323 made that conflict hand-back.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

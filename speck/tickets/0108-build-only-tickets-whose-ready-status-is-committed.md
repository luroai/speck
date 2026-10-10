---
id: "0108"
title: "Build only tickets whose ready status is committed"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0095", "0100"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T19:51:22.377Z"

---
# 0108 · Build only tickets whose ready status is committed

**Status:** 🔨 building

## Problem
`speck set <id> status ready` doesn't commit the ticket, but `speck run` launches any ticket marked ready, committed or not. `speck start` then refuses the uncommitted ticket, so on 2026-10-10 five builds (0095, 0097–0100) each committed their own ticket on `main` in the shared checkout to get past it, with five different commit messages. Builders changing `main` to get past a refusal is exactly the improvising speck must stop.

## Outcome
A ticket is built only once its ready status is committed, setting a ticket ready commits it, and builders never change the main checkout to get past a refusal.

## Acceptance criteria
1. `speck set <id> status ready` commits only that ticket's file, as `speck(<id>): ready`, as setting ready from the panel does. It refuses, changing nothing, when the checkout isn't on the base branch. Other `speck set` changes still don't commit.
2. `speck run` launches a ticket only when it's `ready` in the base branch's latest commit. A ticket marked ready but not committed isn't launched, and `speck run` says once that it's waiting for that ticket to be committed.
3. The build skill says never to commit, stage or change files in the main checkout, and that when `speck start` refuses, the builder reports the reason in plain words and stops.
4. No test that passed before this change fails.

## Out of scope
- Committing other `speck set` changes.

## Notes
- After 0095 (also changes the build skill) and 0100 (also changes `speck set`), to avoid merge conflicts.
- `speck start` already refuses an uncommitted ticket; that refusal is what the builders worked around.
- Failing before this build: none
- Three existing tests ran `speck set <id> status ready` assuming it doesn't commit. Only their fixtures changed, and each still checks the same thing: `CLI: init, new, lint, set ready, status` (speck.test.mjs) and 0083 AC3 (lint-0083.test.mjs) now give git an identity (and 0083's repo a `main` branch), since this machine has no global git identity; 0079 AC5 (panel-0079.test.mjs) undoes `speck set`'s commit before replaying the panel's Ready, so the panel has something to commit.
- A ticket set ready from speck/tickets/done/ is committed as a move: the commit removes the copy in done/ when git knew it, so nothing is left over. Setting ready on a ticket already committed as ready commits nothing.
- Self-check: narrowed the skill's "if `speck start` refuses, stop" to a `ready` ticket, since resuming deliberately runs `speck start` and uses its refusal; added tests for a detached HEAD, a failed commit after a move from done/, and setting ready twice.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

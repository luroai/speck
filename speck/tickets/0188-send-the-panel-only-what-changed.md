---
id: "0188"
title: "Send the panel only what changed"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0187"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0188 · Send the panel only what changed

**Status:** 📋 ready

## Problem
Since 0187, each change pushed to the panel sends the whole board, 1.19 MB on 2026-10-14, to every open page, including a phone over its data connection, even when one ticket changed.

## Outcome
Each update to an open page carries only what changed, however many tickets there are.

## Acceptance criteria
1. After the full board a page gets when it connects, each update carries only the tickets, ideas and speck run state that changed. The size of an update for one changed ticket doesn't depend on how many other tickets there are: with 150 other tickets and with 300, it's the same size to within 1 KB.
2. After any sequence of updates, the page shows exactly what it would show if it loaded the board afresh at that moment.
3. A page that may have missed updates, for example after reconnecting, gets the full board again.
4. `speck status --json` prints the same as before.
5. No test that passed before this change fails.

## Out of scope
- Making the full board smaller (0178).

## Notes
- 0187 (shipped) pushes the whole board on each change, through `scripts/board-feed.mjs`.
- Ticket files run up to about 36 KB (0008), so an update's size limit is relative, not fixed.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

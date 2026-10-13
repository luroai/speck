---
id: "0153"
title: "Show a ticket's ship in progress in the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13

---
# 0153 · Show a ticket's ship in progress in the panel

**Status:** 📋 ready

## Problem
When a build's own ship (`speck ship <id> --auto`) is running, or has stopped without shipping, the panel shows the ticket as plainly approved, the same as a ticket waiting for the user. On 2026-10-13, 0149's auto-ship hung for nine minutes and the user only found out by clicking Ship.

## Outcome
The panel shows when a ticket is being shipped, by anyone, for how long, and says so plainly when an auto-ship ends without shipping.

## Acceptance criteria
1. While `speck ship <id>` is running for a ticket, started by a build, the panel's Ship button or `/speck-ship`, that ticket's Build queue row shows "Shipping…" and how long it has been running, and this survives a reload of the page.
2. While a ship is running, the ticket's Ship button can't be clicked, and a second `speck ship` for the same ticket refuses with a message saying a ship is already running, changing nothing.
3. When an auto-ship ends without shipping (it failed, was refused or was killed), the row says "Auto-ship didn't finish", followed by speck ship's own message when there is one, and "Ship it from its review pack, or run /speck-ship <id>".
4. A ticket waiting for the user to ship it because auto-ship doesn't cover it (for example a high-risk ticket) doesn't show any of these messages.
5. No test that passed before this change fails.

## Out of scope
- Why a ship fails (0152 covers stalled tests).
- Retrying a failed auto-ship automatically.

## Notes
- The panel only knows about a ship it started itself today (`shipping` in `scripts/panel.mjs`); a ship started elsewhere leaves no record it can read.
- Related idea: `speck/ideas/2026-10-12-show-a-panel-ship-in-progress-after-a-reload.md`.
- 0138 colours an approved ticket waiting to ship in purple; these messages sit with that, not in red unless the ship failed.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

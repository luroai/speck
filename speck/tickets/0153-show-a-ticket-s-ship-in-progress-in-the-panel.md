---
id: "0153"
title: "Show a ticket's ship in progress in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-13T23:42:21.427Z"

---
# 0153 · Show a ticket's ship in progress in the panel

**Status:** 🔨 building

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
- Failing before this build: none
- Design: `speck ship` keeps a record, `speck/.cache/runs/<id>.ship.json` in the main checkout, while it runs, so the panel sees a ship started by a build, the Ship button or `/speck-ship` alike, and `speck status --json` gives it as each ticket's `ship`. An auto-ship that ends without shipping leaves the record with its message; a killed one leaves it with a pid that has gone.
- "Not in red unless the ship failed": "Auto-ship didn't finish" is red, as the ship failed; "Shipping…" is neither red nor purple. An auto-ship failure from before the ticket's latest approval isn't shown.
- Self-check: a record whose pid now belongs to another program (or another ticket's ship) no longer holds the ticket; a record folder that can't be written gives a plain error instead of a stack trace.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0727"
title: "Keep Set ready off a closed Plan row"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:15:49.304Z"

---
# 0727 · Keep Set ready off a closed Plan row

**Status:** 🔨 building

## Problem
Every closed draft in Plan has a Set ready button on its row, so a ticket can be set ready without ever being opened, and the button takes space the title needs. Gate 1 should come after at least a scan of the ticket.

## Outcome
Set ready shows only once a draft is open, on its open row or in its full view, and a closed row gives its title the room.

## Acceptance criteria
1. A closed draft row in Plan has no Set ready button, and its title and details line run to where the button was, still ending in an ellipsis only when they don't fit.
2. An open draft row still has Set ready, behaving as today: it can't be pressed while the draft fails the ready check and says why, and reads "Setting ready…" while the request is under way.
3. A draft's full view still has Set ready in its bar, as today.
4. The brief's description of Plan says Set ready is on an open draft and in its full view, not on the row.
5. No test that passed before this change fails, except tests that check for Set ready on a closed row, which are changed to check it isn't there.

## Out of scope
- The priority tag, which stays on the closed row.
- `speck set <id> status ready`, which is unchanged.

## Notes
- Raised by the user on 2026-11-24 from a screenshot of the panel in Cursor's browser pane: the button crowds each row, and opening a ticket first should be the habit.
- `ticketHead` in `templates/panel.js` adds `setReadyButton` to every draft's top row; the closed row's grid gives it column 2 (`.item.row .head .set-ready` in `templates/panel-cards.css`). The brief's Plan description is in the `speck panel` row of `docs/brief.md` ("with Set ready and priority on the row").
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

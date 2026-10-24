---
id: "0494"
title: "Line up a shipped ticket's title with Build and Plan on a phone"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0494 · Line up a shipped ticket's title with Build and Plan on a phone

**Status:** 📋 ready

## Problem
On a phone, a collapsed shipped ticket's title sits lower in its card than a Build or Plan ticket's. The title is a link to the full ticket, and on a touch screen it's a 44 px tall target with its text centred in it, so the text starts about 11 px further down. With a mouse, the three line up.

## Outcome
A collapsed shipped ticket's title starts as far from the top of its card as a Build or Plan ticket's, on a phone as well as with a mouse.

## Acceptance criteria
1. On a touch screen at 390 px wide, and with a mouse at 390 px and 1280 px, the top of a collapsed shipped ticket's title text is the same distance from the top of its card as a collapsed Build or Plan ticket's, to within 2 px, measured in a real browser.
2. On a touch screen, the title is still a target at least 44 px tall that opens the full ticket, as today, without adding space above the title's text.
3. A collapsed shipped ticket is no taller than it was before this change.

## Out of scope
- The second line and the Details button (0453, 0420).

## Notes
- From the user's phone screenshot on 2026-10-24. Measured on the live panel with a touch screen at 390 px: the shipped title's box is 44 px tall, with its text centred in it.
- Shipped cards are styled by `#shipped tr` and `#shipped .line .title` in `templates/panel-cards.css`.
- Waits for nothing: no open ticket changes that file. 0452 waits for this one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

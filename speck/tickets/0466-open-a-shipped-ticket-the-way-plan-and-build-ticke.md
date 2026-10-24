---
id: "0466"
title: Open a shipped ticket the way a Build ticket opens                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0465"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0466 · Open a shipped ticket the way a Build ticket opens

**Status:** 📋 ready

## Problem
In Plan and Build, pressing a ticket's top row opens the card, and the open card has a Full ticket button. In Shipped, pressing the title jumps straight to the full ticket, and a separate Details button opens the card. The same press does different things in different tabs.

## Outcome
A shipped ticket opens and closes like a Plan or Build ticket, and its full ticket is reached from a Full ticket button in the open card.

## Acceptance criteria
1. Pressing anywhere on a shipped ticket's top row, its title included, opens the card in place, and pressing it again closes it, as a Build ticket's top row does, with the mouse and with the keyboard (Tab to it, then Enter or Space). Pressing the title no longer opens the full ticket.
2. A shipped ticket has no Details button.
3. The open card has a Full ticket button, the same as an open Build ticket's, which opens the full ticket, and Close brings the focus back to that button. Review pack stays beside it.
4. A shipped ticket's open or closed state is kept as the list refreshes, as before. No test that passed before this change fails.

## Out of scope
- What the open card shows (0464), and the full ticket itself (0465).

## Notes
- Asked for by the user on 2026-10-24: "on the plan and the build tickets, you expand the ticket and then there's a button to see the full ticket … in the shipped tickets, if you click the title, it just expands into the full ticket … make the ship tickets follow that same pattern."
- Today, in `templates/panel.js`: the Shipped list's title is `fullLink(t)`, which opens the full ticket, and its `Details` button flips `openShipped` (0157, 0420). Build's card toggles from its top row (`toggleLog`), and its open card has `fullButton(t, 'queue')` (0326).
- Waits for 0465, which waits for 0464: 0464 changes what a shipped ticket's open card shows, and all three change `templates/panel.js`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

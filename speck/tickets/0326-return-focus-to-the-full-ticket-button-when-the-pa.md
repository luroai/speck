---
id: "0326"
title: "Return focus to the Full ticket button when the pane closes"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-return-focus-after-the-full-ticket-pane-closes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19

---
# 0326 · Return focus to the Full ticket button when the pane closes

**Status:** 📋 ready

## Problem
When the full ticket pane closes, by Close, Escape or a click outside, the keyboard focus falls to the page itself, so someone using the keyboard has to Tab from the top of the page to get back to the ticket they were on.

## Outcome
Closing the full ticket pane puts the keyboard focus back on the Full ticket button that opened it.

## Acceptance criteria
1. Closing the full ticket pane with its Close button, Escape or a click outside puts the focus on the Full ticket button of the ticket it showed.
2. When the board refreshed while the pane was open, so the button was drawn again, the focus goes to that ticket's new button.
3. When that ticket is no longer on the board, the focus goes to the top of its section instead of the page.
4. Nothing else about opening and closing the pane changes.

## Out of scope
- Other panes and dialogs.

## Notes
- From `speck/ideas/2026-10-09-return-focus-after-the-full-ticket-pane-closes.md`. The pane is in `templates/panel.html` (0060).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

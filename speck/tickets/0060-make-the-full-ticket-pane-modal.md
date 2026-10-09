---
id: "0060"
title: "Make the full ticket pane modal"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:33:00.080Z"

---
# 0060 · Make the full ticket pane modal

**Status:** 🔨 building

## Problem
While the full ticket pane is open, the page behind it still scrolls, so scrolling past the end of a long ticket moves the panel instead. The only ways to close the pane are its Close button and Escape, so the user has to aim for a small button to get back to the board.

## Outcome
The full ticket pane holds the page still while it's open, and a click anywhere outside it closes it.

## Acceptance criteria
1. While the pane is open, scrolling with the mouse wheel, trackpad, touch or keyboard (for example Page Down or Space) never moves the page behind it, including when the pane is already scrolled to its top or bottom. The pane itself still scrolls when the ticket is longer than the window.
2. When the pane closes, by any means, the page is at the same scroll position as when the pane opened.
3. While the pane is open, a click anywhere outside it closes the pane and does nothing else: it doesn't open or close an item, press a button or follow a link under it. The ticket stays open in the list, as it does when the pane closes with Close.
4. Clicking inside the pane, or selecting text that starts inside it and ends outside it, leaves the pane open.
5. Close, Escape and the 2-second refresh behave as before: the first two close the pane, and the refresh neither closes it nor moves the page.

## Out of scope
- How the pane's text looks (0061).
- The short open view in the Tickets list.
- Ideas and inbox notes, which don't open in the pane.

## Notes
- Changes 0054's rule that clicking "Full ticket" on another ticket replaces the pane's content: with the pane open, that click now only closes it, so switching tickets takes two clicks.
- "Collapse" read as closing the pane, with the ticket left open in the list. To confirm before ready.
- A dimmed backdrop behind the pane is the builder's choice.
- product.md's Shaping description needs updating.
- The panel has no links, so AC3's "follow a link" is covered by the backdrop taking every click outside the pane; the browser test clicks over a ticket row and a toggle button.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

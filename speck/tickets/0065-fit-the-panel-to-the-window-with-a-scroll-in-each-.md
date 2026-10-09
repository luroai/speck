---
id: "0065"
title: "Fit the panel to the window with a scroll in each section"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0064"]               # ticket ids that must be done first
created: 2026-10-09

---
# 0065 · Fit the panel to the window with a scroll in each section

**Status:** 📝 draft

## Problem
The panel page scrolls as a whole, so scrolling down to a ticket in one section moves the other section, and the header, out of view. The two columns are also uneven (Shaping is wider), so the boundary between them sits right of centre.

## Outcome
On a wide window the panel fits the window, with Shaping and Queue side by side at equal widths, each scrolling on its own.

## Acceptance criteria
1. When the window is at least 900px wide, the page itself never scrolls: the header and both sections fit the window's height, each section's heading and toggle stay in view, and each section's list scrolls on its own when it's longer than the space.
2. When the window is at least 900px wide, Shaping and Queue are exactly the same width, so the boundary is down the middle, whatever they contain: long text such as a worktree path or a wide build log wraps or scrolls inside its own column.
3. Each list (Tickets, Ideas, Inbox, Queue and Shipped) keeps its own scroll position through the 2-second refresh, and when the user switches to another list and back.
4. Below 900px wide, the sections stack and the page scrolls, as today.
5. While the full ticket pane is open, no list behind it scrolls, as 0060 does for the page today, and every list is where it was when the pane closes.

## Out of scope
- One section at a time and swiping on narrow screens (0066), which replaces criterion 4's stacking.
- Changing what any list shows.

## Notes
- After 0064, which moves Shipped into the Queue section and leaves two columns.
- 900px is a default chosen while ticketing. To confirm before ready.
- Today the columns are `1.15fr 1fr` in `templates/panel.html`.
- product.md's panel description needs updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

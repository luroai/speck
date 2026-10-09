---
id: "0066"
title: "Swipe between Shaping and Queue on narrow screens"                # one outcome, no "and"
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
after: ["0060", "0065"]               # ticket ids that must be done first
created: 2026-10-09

---
# 0066 · Swipe between Shaping and Queue on narrow screens

**Status:** 📝 draft

## Problem
On a narrow screen, such as a phone, Shaping and Queue are too tight side by side, and stacked they make a long page where the queue is far below the fold. The user mostly wants the queue at a glance there.

## Outcome
On a narrow screen the panel shows one section at a time, Queue first, and a swipe moves between Shaping and Queue.

## Acceptance criteria
1. When the window is under 900px wide, one section fills the screen below the header, with its own scroll, and a `Shaping | Queue` tab bar at the top shows which section is showing. Queue shows when the page loads.
2. Swiping left or right, or tapping a tab, moves to the other section, coming to rest on one whole section, never part of both. A swipe that starts inside something that scrolls sideways, such as a wide build log, scrolls that instead.
3. While any ticket in the queue is red (needs you), the bar's Queue tab is red with the number of red tickets, whichever section is showing.
4. Under 900px wide, the full ticket pane covers the whole screen. Swiping in it never changes the section behind it, and closing it shows the same section at the same scroll position.
5. The section showing survives the 2-second refresh, and each list keeps its own scroll position, as in 0065.

## Out of scope
- Reaching the panel from another device: `speck panel` serves only `127.0.0.1` on this machine. That would be its own, high-risk ticket.
- Wide windows (0065).

## Notes
- After 0065, which fits the page to the window and sets the 900px width, and after 0060, which makes the pane modal.
- A tab bar as well as the swipe, because a swipe can't be discovered and doesn't work with a mouse or keyboard.
- product.md's panel description needs updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

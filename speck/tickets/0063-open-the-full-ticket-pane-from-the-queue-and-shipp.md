---
id: "0063"
title: "Open the full ticket pane from any ticket in the panel"               # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0052", "0053", "0062", "0064"]               # ticket ids that must be done first
created: 2026-10-09

---
# 0063 · Open the full ticket pane from any ticket in the panel

**Status:** 📋 ready

## Problem
The full ticket pane opens only from a draft in Shaping. Once a ticket is in the queue or has shipped, the user can't read what it was meant to do without opening its file, which is when they most often want a reminder: watching a build, or checking what just shipped.

## Outcome
Any ticket in the queue or the Shipped list can be opened in the full ticket pane.

## Acceptance criteria
1. An open queue ticket (one whose log is showing) has a "Full ticket" button, and each row in the Shipped list has one too. Clicking either opens the pane on that ticket and opens, closes or selects nothing else.
2. For a ticket that isn't a draft, the pane shows the same id, title and sections as for a draft, with no readiness list and no **Set ready** button.
3. The pane stays open on the same ticket while that ticket shows anywhere in the panel (Tickets, the queue or the Shipped list's 5), including when it moves between them: a draft set ready, a queued ticket that starts building, a build that ships. It closes when the ticket shows nowhere, for example when a sixth ticket ships and pushes it off the Shipped list.
4. Opening and closing the pane leaves queue tickets open or closed as they were, and text selected in a queue or Shipped row, and a log's scroll position, stay put through the refresh as they do today.

## Out of scope
- Ready tickets that aren't in flight: the queue opens only in-flight tickets today (0051), and this doesn't change that.
- Cancelled tickets and done tickets beyond the latest 5.
- The review rounds or delivery log in the pane: it shows the same sections as for drafts.

## Notes
- After 0062, as 0060, 0061 and 0062 all change the side pane; after 0052 and 0053, which change the open queue ticket; and after 0064, which makes Shipped a tab in the Queue section, all in `templates/panel.html`.
- Changes the rule from 0054 and 0062 that the pane closes when a draft is set ready: with this, it stays open on that ticket in the queue (criterion 3).
- The pane's lookup is in `renderFull`, which looks only in the Tickets list today. Done tickets already come with their sections in `/api/state`.
- product.md's Queue and Shipped descriptions need updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

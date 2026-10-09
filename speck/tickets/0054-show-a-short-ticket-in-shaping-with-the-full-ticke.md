---
id: "0054"
title: "Show a short ticket in Shaping with the full ticket on demand"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-09-shorter-ticket-view-with-full-view-on-demand.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:07:59.238Z"

---
# 0054 · Show a short ticket in Shaping with the full ticket on demand

**Status:** 🔨 building

## Problem
An open ticket in Shaping shows everything: problem, outcome, acceptance criteria, out of scope and notes, then the readiness list. That makes it long, so the user can't judge a draft at a glance before setting it ready.

## Outcome
An open ticket in Shaping shows a short view, and one click shows the whole ticket in a side pane.

## Acceptance criteria
1. Opening a ticket in the Tickets list shows its problem, outcome, readiness list and **Set ready** button, and not its acceptance criteria, out of scope or notes.
2. The open ticket has a "Full ticket" button. Clicking it doesn't close the ticket, and opens a side pane showing that ticket's id, title, problem, outcome, numbered acceptance criteria, out of scope and notes, as text, with any section that has nothing in it left out.
3. The side pane shows one ticket at a time: clicking "Full ticket" on another ticket replaces its content. It closes with its close button or the Escape key, and closing it leaves the open ticket in the list open.
4. The side pane stays open, showing the same ticket, through the 2-second refresh; when that ticket's data changes it shows the new content, and when the ticket leaves the Tickets list (for example, it's set ready) the pane closes.
5. Text selected in the side pane stays selected through the refresh while that ticket's data in `/api/state` is unchanged, as in the open ticket today.

## Out of scope
- Ideas and inbox notes: they keep showing their whole note when opened.
- Queue and Shipped rows (0051 opens queue tickets to read the build log).
- Showing the review log, delivery log or anything else not in `/api/state` today. Nothing in the JSON changes.
- Editing a ticket from the pane.

## Notes
- Changes the open view that 0033 (done) added; the open and close rules from 0039 (done) still apply to the short view.
- Side pane, not popup, and the full view shows today's sections rather than the raw file: defaults chosen while ticketing, to confirm before ready.
- What's open in the pane survives the refresh and is never sent to the server, like what's open in the lists.
- product.md's Shaping description needs updating.
- Older panel tests (0031 AC5, 0033 AC4, 0039 AC4, 0040) that read criteria or notes in the open ticket now read them in the side pane, or select problem and outcome text instead, as AC1 moves those sections out of the short view.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0062"
title: "Show the open ticket's readiness panel in the full ticket pane"               # one outcome, no "and"
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
after: ["0061"]               # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T20:11:42.960Z"

---
# 0062 · Show the open ticket's readiness panel in the full ticket pane

**Status:** 🔨 building

## Problem
The full ticket pane shows the ticket's text but not its readiness list or **Set ready** button. After reading the whole ticket, the user has to close the pane and find the open ticket in the list to check readiness and act on it.

## Outcome
The full ticket pane shows the same readiness list and action buttons as the open ticket in the list, so the user can read a ticket and set it ready in one place.

## Acceptance criteria
1. The pane shows the ticket's readiness list, the same lines as the open ticket in the list (size and risk, criteria count, each lint error and warning in full or "lint passes", and each `after:` id marked done or not done, or "no after: tickets"), straight after the id and title, before the problem.
2. Below the readiness list, the pane shows the same action buttons as the open ticket in the list, except "Full ticket": today that's **Set ready**. It's disabled, with the same hover text, whenever the list's button is, and shows "Setting ready…" while a request for that ticket is in progress, whichever button sent it.
3. Clicking **Set ready** in the pane leaves the pane open until the next refresh. If the server refuses, the reason shows under the button in the pane and under the button in the list, until the next click on either of them. When it succeeds, the next refresh moves the ticket to the queue and closes the pane, as it does today.
4. The readiness list and button change on the refresh when the ticket's data changes, and text selected elsewhere in the pane stays selected while it's unchanged.

## Out of scope
- Moving the readiness list or button out of the short view: both stay there.
- New actions. Any action added to the open ticket later should appear in the pane too, but that's for the ticket that adds it.
- How the pane's text looks (0061), and how it opens and closes (0060).

## Notes
- After 0061, which comes after 0060: all three change the side pane in `templates/panel.html`, so ordering them keeps the builds from conflicting.
- Readiness at the top, so it's visible without scrolling, is a default chosen while ticketing. To confirm before ready.
- The refusal reasons and pending requests are already kept by ticket id in the page (`refused`, `settingReady`).
- product.md's Shaping description needs updating.
- The pane's readiness list carries the same "Readiness" heading as the list's, so the 0054 and 0061 tests that list the pane's headings now start with it.
- Self-check: the pane's Set ready kept the focus on a node that was replaced, so the keys stopped scrolling the pane after a click; the pane now takes the focus back (browser test added).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

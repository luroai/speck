---
id: "0423"
title: "Open the full ticket over the whole panel"                # one outcome, no "and"
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
after: ["0422"] # ticket ids that must be done first
created: 2026-10-23

---
# 0423 · Open the full ticket over the whole panel

**Status:** 📋 ready

## Problem
The full ticket opens in a 480 px pane at the side of the panel. In a narrow side pane it covers the page anyway, and on a wider window it squeezes a long document into a strip.

## Outcome
The full ticket, and a review pack, open over the whole panel, as Settings does.

## Acceptance criteria
1. Full ticket opens over the whole panel, the window's full width and height, as Settings does, instead of a pane at the side. Review pack opens the same way.
2. Its title row and Close button stay at the top while the ticket scrolls. Close and Escape close it, and the focus goes back as today.
3. On a window wider than 760 px, the ticket's text is at most 720 px wide and centred.

## Out of scope
- How the ticket's text is set out (0424).

## Notes
- The user asked for this on 2026-10-23.
- Today: `#full-ticket` in `templates/panel.html`. Settings' full view is `#settings` (0409).
- Waits for 0422: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

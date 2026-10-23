---
id: "0428"
title: "Round the panel's corners as Cursor does"                # one outcome, no "and"
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
after: ["0427"] # ticket ids that must be done first
created: 2026-10-23

---
# 0428 · Round the panel's corners as Cursor does

**Status:** 📋 ready

## Problem
Every corner in the panel is square: `* { border-radius: 0 !important; }` in `templates/panel.html`. Beside Cursor's rounded controls and panels, it looks like a different product.

## Outcome
The panel's controls, cards and pop-ups have rounded corners like Cursor's.

## Acceptance criteria
1. Buttons, inputs, selects, tags, toggles, the priority menu and the open tab's top corners have an 8 px corner radius.
2. Ticket cards, the build log, the stats, Settings' groups and pop-ups (the full ticket, a document, the pipeline log and the questions Settings asks) have a 12 px corner radius.
3. Every button has a visible border on all four sides, at the contrast 0161 sets for a control's edge, including the small Full ticket, Review pack and Stop build buttons on an open ticket, which have only a line under them today. The focus ring follows each control's rounded corners.
4. speck's screen and its frame keep the corners they have.
5. Nothing forces square corners on the whole page any more. The switches' round track and knob stay round.

## Out of scope
- Colours (0426) and fonts (0427).

## Notes
- The user asked for this on 2026-10-23: the panel is used mostly beside Cursor, at work and at home, and should look like part of it.
- Unverified: Cursor's exact corner radii (no Cursor source or docs to check). 8 px and 12 px are estimated from the user's screenshot of Cursor on 2026-10-23 (its buttons about 8 px, its message bubble and input box about 10–12 px), and the user agreed to them.
- Criterion 3: 0421 left the open card's buttons with only an underline, which the user noticed on 2026-10-23.
- Waits for 0427: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

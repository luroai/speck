---
id: "0453"
title: "Draw all four sides of every button on a phone"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-keep-the-settings-buttons-borders-whole-on-a-phone.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0449"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:08:45.305Z"

---
# 0453 · Draw all four sides of every button on a phone

**Status:** 🔨 building

## Problem
On a phone, some buttons lose a side of their border: the Shipped list's Details button and the full ticket's Close button show no left edge. Their borders are half a CSS pixel and their edges can fall between device pixels, so the phone doesn't draw that side. 0281 fixed the same thing for Settings' info buttons and boxes.

## Outcome
Every button on the panel shows all four sides of its border on a phone.

## Acceptance criteria
1. Every button on the panel, including the Shipped list's Details, the full ticket's, a document's and Settings' Close, Save and Review pack, has a border at least one device pixel wide on all four sides and its edges on whole CSS pixels, as 0281 gave Settings' info buttons.
2. On a phone-sized page at a device pixel ratio of 3, each of those buttons shows all four sides of its border, checked in a real browser.
3. The buttons keep their 8 px corners (0428) and the contrast 0161 sets for a control's edge.

## Out of scope
- Cards and boxes that aren't buttons.

## Notes
- For release 0.15.0 (0452). From the user's phone screenshots on 2026-10-24: the Details and Close buttons have no left edge.
- From the builder's note on 0281 (this note was dropped in the 0.15.0 triage, then picked up again for this).
- Waits for 0449: both change `templates/panel.css`. 0452 waits for this one.
- Failing before this build: none
- How: the panel's script makes each button with a border a whole number of pixels wide as soon as the page changes (CSS can't round a width that comes from the words), and again on a resize or a font loading. The tabs are laid out in whole pixels in CSS, and the tab before another draws the edge they share, rather than the two overlapping by half a pixel; the side shared with the open tab takes its text colour. The main column, a document's and the Foreman's are centred on a whole pixel. Below a pixel ratio of 2, every button's border is 1 px. "Edges" means the left and right ones, as in 0281; the top and bottom aren't rounded.
- Changed older tests: 0281 AC3 now allows rules marked 0453 to use its rounding outside Settings; 0428's shared-edge check reads the new way the tabs share it (the left tab draws it), still once.
- Self-check: moved the rounding from the next frame to straight after each change, as More stats → Fewer stats wrapped for a frame in its old width (0420's test caught it); the tabs' width rounds to the nearest pixel, as a third of 288 px came out a hair under 96 and rounded down to 95 (0425's test caught it).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

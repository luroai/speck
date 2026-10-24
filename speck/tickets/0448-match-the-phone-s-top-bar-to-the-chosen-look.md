---
id: "0448"
title: "Match the phone's top bar to the chosen look"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-13-match-the-phone-s-top-bar-to-the-panel-s-chosen-look.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:46:02.107Z"

---
# 0448 · Match the phone's top bar to the chosen look

**Status:** 🔨 building

## Problem
When the panel runs as a home-screen app, the phone's top bar takes its colour from the page's `theme-color`, which follows only the phone's own light or dark setting. Choosing Light or Dark in Settings (0412) changes the panel but leaves the top bar in the other look.

## Outcome
The phone's top bar follows the look chosen in Settings.

## Acceptance criteria
1. With Light chosen in Settings, the page's `theme-color` is the light look's page colour (`#f3f3f3`), and with Dark the dark look's (`#141414`), whatever the phone's own setting. With System, it follows the phone's setting, as today.
2. Choosing another look in Settings changes the `theme-color` at once, without a reload, and a reload keeps it.
3. The home-screen app's status-bar style still follows the same look, as 0160 set.

## Out of scope
- The look itself (0412).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0149. The `theme-color` tags and the script that sets the look before the page is drawn are in `templates/panel.html`.
- Waits for nothing.
- Failing before this build: none
- Self-check: no changes
- Pictures: none, because the change is to the phone's own top bar when the panel runs as a home-screen app, which a desktop or headless browser doesn't draw; the panel itself looks the same.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

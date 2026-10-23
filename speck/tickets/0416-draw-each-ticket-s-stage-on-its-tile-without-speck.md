---
id: "0416"
title: "Show each ticket's stage in words only"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0415"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T15:38:42.935Z"

---
# 0416 · Show each ticket's stage in words only

**Status:** 🔨 building

## Problem
Each in-flight ticket's card has a 56 px tile showing speck at the laptop, with the reviewer or pushing the boat. speck is the Foreman on the screen at the top (0413), the builders and reviewers are other models, and a moving tile on every card competes with that one screen.

## Outcome
A ticket's card says its stage in words only, and speck's screen is the only part of the panel that animates.

## Acceptance criteria
1. No ticket card has a tile or any other picture or animation of its stage, at any stage. The card's text starts at its left edge where the tile was.
2. Each card still says its stage in the same words as today, such as `Writing tests and code`, `Checking its own work`, `<reviewer> is reviewing · round <n>`, `Shipping` or `Blocked · it has a question for you`, with its stage names under its title. A card waiting for you is still shown in the panel's purple, and one that needs you in its crimson.
3. Apart from speck's screen, nothing on the panel moves unless you've just done something, such as the ring that lights a ticket after "Go to ticket".

## Out of scope
- New wording for the stages.
- speck's screen and its animations (0413, 0414).

## Notes
- Removes the builder badge: `badgeOf` and its canvas in `templates/panel.html` (0168, 0169, 0172, 0302). The `PANEL` poses in `templates/lcd.js` stay, as speck's screen uses `ship`, `wait` and `bad` (0414).
- The user decided on 2026-10-23 that the status text is enough.
- Waits for 0415: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: no changes to the panel; an old 0156 check expected a stage border on a ticket waiting for you to ship it, which it never had, and its "Shipping" sentence check already covers it, so that line went.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

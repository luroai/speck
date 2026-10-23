---
id: "0412"
title: "Offer a System choice for the panel's appearance"                # one outcome, no "and"
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
after: ["0410", "0411"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T14:10:05.627Z"

---
# 0412 · Offer a System choice for the panel's appearance

**Status:** 🔨 building

## Problem
Appearance in Settings is a light/dark switch. A panel that hasn't been switched follows the computer's light or dark setting, but once you press the switch there's no way back to following it, so a computer that changes look at sunset leaves the panel behind.

## Outcome
Appearance offers System, Light and Dark, and System follows the computer's setting.

## Acceptance criteria
1. Appearance in Settings offers three choices, System, Light and Dark, in that order, and shows which is chosen. In a browser where no look has been chosen, System is chosen.
2. With System chosen, the panel shows the computer's light or dark setting, and switches when that setting changes while the panel is open, without a reload.
3. Choosing Light or Dark switches the panel at once and keeps that look through a reload whatever the computer's setting, as the switch does today. Choosing System after either switches the panel to the computer's setting at once, and a reload keeps System.
4. The choice is kept in this browser only: Save doesn't send it or count it as a change, as today.
5. The control works from the keyboard, a screen reader hears the three choices and which one is chosen, and the Appearance row fits on one line at 320 px wide.

## Out of scope
- The Auto-build switch beside it, which stays as it is.
- Matching the phone's top bar to the look beyond what the look already sets (`speck/ideas/2026-10-13-match-the-phone-s-top-bar-to-the-panel-s-chosen-look.md`).

## Notes
- Today: `lookSwitch` and `drawLook` in `templates/panel.html` (0396), and the `<head>` script that applies `speck-theme` from localStorage before the page is drawn (0136, 0372). With no stored choice it already follows the computer.
- Asked for by the user on 2026-10-23, alongside the tabs (0410).
- Waits for 0410 and 0411: all three change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

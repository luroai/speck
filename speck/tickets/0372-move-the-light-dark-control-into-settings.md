---
id: "0372"
title: "Move the light/dark control into Settings"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-give-the-header-s-notice-board-more-room.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0371"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T21:53:21.042Z"

---
# 0372 · Move the light/dark control into Settings

**Status:** 🔨 building

## Problem
The header carries a light/dark button beside Settings. On a narrow pane that button takes space the Foreman's notice board needs.

## Outcome
Light and dark are chosen from a row in Settings, and the header no longer has that button.

## Acceptance criteria
1. The header has no light/dark button at any width. Settings and the notice board stay.
2. The Settings view has a row for the look, offering light and dark. Choosing one switches the panel the way the header button does today, in both looks, and the choice is the one the page shows.
3. The choice is remembered in this browser and applied the next time the page loads, as the header button's choice is today. It is not written to `speck/config.yml`, and Save neither commits it nor treats it as an unsaved change.
4. With the button gone, the notice board is wider by the space the button used. The header stays one row, nothing in it overlaps, and under 700 px every header button is still at least 44 px tall.
5. No test that passed before this change fails, except checks that the header has a light/dark button, which are changed to check criteria 1 and 2.

## Out of scope
- The speck word and the base branch in the header: 0373.
- How fast the notice board scrolls: 0374.
- Opening Settings as a pop-up: 0368.

## Notes
- Checked 2026-10-22: the button is `.theme` in the header of `templates/panel.html`. It toggles `data-theme` and stores `speck-theme` in `localStorage`. It is not one of the settings in `scripts/settings.mjs`.
- 0373 waits for this: it changes `templates/panel.html` too, as do 0368 to 0371. 0374 does not: it only changes the notice board's speed.
- Failing before this build: none
- The Look row is a row of its own (like speck run's in the Foreman group), not one of the file's `.setting` rows, so tests that list the file's settings still see only those. One existing check had to change beyond the header-button ones: 0257 AC5 ("the view has no control that changes a setting") now also exempts the look list, as it already exempted 0268's info buttons and 0285's speck run switch, since the look isn't a setting in speck/config.yml.
- AC4: the board takes the button's room wherever it was cut short; where it already shows in full (above 700 px it never shrinks), it has nothing more to show, and the extra room goes to the project's name.
- The build skill's note on taking pictures pointed at the panel's theme button; it now points at the look in Settings.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

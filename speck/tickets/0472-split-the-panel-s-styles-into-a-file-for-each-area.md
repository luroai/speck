---
id: "0472"
title: "Split the panel's styles into a file for each area"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0468"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0472 · Split the panel's styles into a file for each area

**Status:** 📋 ready

## Problem
All of the panel's styles are in one file, `templates/panel.css`, so almost every ticket that changes how any part of the panel looks changes that file. speck chains tickets that change the same files, so they build one after another even when they change unrelated parts.

## Outcome
The panel's styles are in one file for each area of the panel, so a ticket that changes one area's look changes only that area's file.

## Acceptance criteria
1. The styles in `templates/panel.css` are split into these files in `templates/`, and `panel.css` is gone: `panel-base.css` (colours, fonts, the page's layout, and buttons and tags used everywhere), `panel-header.css` (the dark frame, speck's screen and the tabs), `panel-cards.css` (the cards in Plan, Build and Shipped and everything in them, the build log included), `panel-popups.css` (the full ticket, a document's pop-up and the Pipeline log) and `panel-settings.css` (Settings). Each rule is in the file for the area it styles, and in no other (checked by review).
2. `panel.html` loads all five, `panel-base.css` first, and the panel's server answers `GET /<file>` for each with the file, as `text/css` or `text/javascript`, read afresh on each request as the page is, and a page loaded before one of them changed says it's out of date and offers to reload, as it does today for `panel.css` (0430).
3. The panel looks exactly as before: in a real browser at 390 px and 1200 px wide, in both looks, with a mouse and with a touch screen, every element's computed style is the same as before the change.
4. No test that passed before this change fails, except tests that read the moved rules from `panel.css`, which read them from the new files instead.

## Out of scope
- Splitting the page's script (0473, 0474).
- Any change to how the panel looks.

## Notes
- Asked for by the user on 2026-10-24, for release 0.15.0 and to be built next, so that tickets changing different parts of the panel can build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots, because every ticket changed `templates/panel.js` (2,378 lines) or `templates/panel.css` (841 lines). A move with no visible change, as 0430 to 0433 were.
- Same pattern as 0430, which moved the styles out of `panel.html`.
- Waits for 0468, the ticket being built when this was set; the rest of 0.15.0's panel tickets (0469 onwards) wait for 0474, so they build on the split files.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

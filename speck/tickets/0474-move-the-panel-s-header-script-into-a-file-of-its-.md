---
id: "0474"
title: "Move the panel's header script into a file of its own"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0473"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:28:14.801Z"

---
# 0474 · Move the panel's header script into a file of its own

**Status:** 🔨 building

## Problem
After 0473, the panel's header script, speck's screen, its words and the tabs, is still in `templates/panel.js` with the cards' script, so a ticket that changes the header and one that changes the cards build one after the other.

## Outcome
The script for the panel's header is in a file of its own, so a ticket that changes the header doesn't change `panel.js`.

## Acceptance criteria
1. The script that draws and updates speck's screen (its poses, words and time), the dark frame's title row and the Plan, Build and Shipped tabs is in `templates/panel-header.js`, and `panel.js` no longer contains it. `templates/lcd.js`, the screen's renderer, stays as it is.
2. `panel.html` loads `panel-header.js` in its place among the page's scripts, and the panel's server answers `GET /<file>` for each with the file, as `text/css` or `text/javascript`, read afresh on each request as the page is, and a page loaded before one of them changed says it's out of date and offers to reload, as it does today for `panel.css` (0430).
3. A quick test with `fakePage` still runs the page without a browser.
4. No test that passed before this change fails, except tests that read the moved code from `panel.js`, which read it from the new file instead.

## Out of scope
- The pop-ups' script (0473), and the cards' script, which stays in `panel.js`.
- Any change to what the header does.

## Notes
- Asked for by the user on 2026-10-24, for release 0.15.0 and to be built next, so that tickets changing different parts of the panel can build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots, because every ticket changed `templates/panel.js` (2,378 lines) or `templates/panel.css` (841 lines). A move with no visible change, as 0430 to 0433 were.
- Waits for 0473: both change `panel.html`, `panel.js` and the server's list of files.
- Failing before this build: none
- Self-check: no changes. The moved lines are unchanged apart from comments and one new function: the old and new files' lines, sorted, differ only in the new file's header comment, a shorter comment in render() and `drawHeader`, which holds render()'s lines for the screen's word, the frame's edge and the screen button's label, title and aria-expanded, in the same order. panel-header.js loads after panel.js, as it uses its helpers (`$`, `el`, `setText`, `within`, `foremanOf`) as it loads, and before the pop-ups. Nothing in panel.js, the pop-ups or Settings uses what moved as it loads.
- AC1: moved: the title row (the header's height and the project's tooltip), the screen's renderer hookup (`LCD`, `reducedMotion` and its listeners), speck's screen and poses (`SCREEN` to `speckRests`) and the tabs (`LANES` to their listeners, and the first `drawTabs()`). `foremanOf` and `pageStale` stay in panel.js: the pop-ups use them too. Pressing the screen stays in the pop-ups' file (0473).
- AC4: tests that read the moved code or list the page's scripts now include the new file: 0432 AC1, 0433 AC1 (`drawScreen`), 0473 AC2 and AC3, and 0415 AC5's page opened from its file.
- Pictures: none, because nothing anyone sees changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

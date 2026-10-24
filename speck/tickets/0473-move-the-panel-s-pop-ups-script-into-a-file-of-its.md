---
id: "0473"
title: "Move the panel's pop-ups' script into a file of its own"                # one outcome, no "and"
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
after: ["0472"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:13:03.735Z"

---
# 0473 · Move the panel's pop-ups' script into a file of its own

**Status:** 🔨 building

## Problem
Most of the panel's script is in one file, `templates/panel.js`, so almost every ticket that changes how part of the panel behaves changes that file, and speck builds such tickets one after another even when they change unrelated parts.

## Outcome
The script for the panel's pop-ups is in a file of its own, so a ticket that changes a pop-up doesn't change `panel.js`.

## Acceptance criteria
1. The script that opens, draws, updates and closes the full ticket, a document's pop-up and the Pipeline log is in `templates/panel-popups.js`, and `panel.js` no longer contains it.
2. `panel.html` loads `panel-popups.js` in its place among the page's scripts, and the panel's server answers `GET /<file>` for each with the file, as `text/css` or `text/javascript`, read afresh on each request as the page is, and a page loaded before one of them changed says it's out of date and offers to reload, as it does today for `panel.css` (0430).
3. `fakePage` in `test/support/panel.mjs` loads every script the page loads, in the page's order, so a quick test still runs the page without a browser.
4. No test that passed before this change fails, except tests that read the moved code from `panel.js`, which read it from the new file instead.

## Out of scope
- The header's script (0474), and the cards' script, which stays in `panel.js`.
- Any change to what the pop-ups do.

## Notes
- Asked for by the user on 2026-10-24, for release 0.15.0 and to be built next, so that tickets changing different parts of the panel can build side by side. The 0.15.0 panel work (0453 to 0471) was one chain of about 19 tickets, built one at a time for 5 to 6 hours with 4 build slots, because every ticket changed `templates/panel.js` (2,378 lines) or `templates/panel.css` (841 lines). A move with no visible change, as 0430 to 0433 were.
- Same pattern as 0432 (Settings) and 0433 (the rest of the script).
- Today: `fullTicket`, `openFull`, `renderFull`, the document pop-up and `renderForeman` with `drawRunLog` are in `templates/panel.js`.
- Waits for 0472: both change `panel.html` and the server's list of files.
- Failing before this build: none
- Self-check: no changes. The moved lines are unchanged apart from comments (the old and new files' lines, sorted, differ only in the new file's header comment, one comment on `foremanOpen` and one on the page's start). Nothing in `panel.js` that runs as it loads uses what moved, which the fake page would show, as it runs each file as a separate script, as a browser does.
- AC3: `fakePage` now reads the script tags from `panel.html` and runs each file in that order, `lcd.js` included (it puts `SpeckLCD` on the page, unless a test gives its own, which the page then uses as before).
- AC4: tests that read the moved code from `panel.js` now read it from `panel-popups.js`: 0031 AC4 (the one page reload), 0426 AC3, 0427 AC4, 0433 AC1 (`openFull`, `renderForeman`) and 0459 AC4. The script-tag lists in 0432 AC1 and 0433 AC1 include the new tag, and 0415 AC5's page opened from its file puts the pop-ups' script in its tag's place.
- Pictures: none, because nothing anyone sees changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

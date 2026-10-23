---
id: "0432"
title: "Move the Settings view's script into a file of its own"                # one outcome, no "and"
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
after: ["0431"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T22:50:48.520Z"

---
# 0432 · Move the Settings view's script into a file of its own

**Status:** 🔨 building

## Problem
About 1,100 lines of `templates/panel.html` are the Settings view's script, and Settings tickets have been frequent (0396 to 0409). Each one has to work inside the whole page's script, and clashes with any other panel ticket.

## Outcome
The Settings view's script is in a file of its own.

## Acceptance criteria
1. The script that opens, draws, changes and saves Settings, with its switches and the questions it asks, is in `templates/panel-settings.js`, which the page loads from `/panel-settings.js`. `panel.html` no longer contains it.
2. the panel's server answers `GET /panel-settings.js` with the file as `text/javascript`, read afresh on each request as the page is. A page loaded before the file changed says it's out of date and offers to reload, as one does today when `panel.html` changes. A request for any other path, such as `/panel.html` or `/panel-settings.js/../x`, gets the answer an unknown path gets today.
3. No test that passed before this change fails, except tests that read the moved code from `panel.html`, which read it from the new file instead.

## Out of scope
- Changing what Settings does or how it looks.
- The model (0431) and the rest of the script (0433).

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min).
- Part of splitting `templates/panel.html` (4,414 lines, 315 KB on 2026-10-23) into files by area, so panel tickets in different areas can build side by side and agents work with smaller files: 0430 styles, 0431 the model, 0432 Settings, 0433 the rest. No change to what the panel does or how it looks.
- Install and update copy the whole `templates/` folder (`place` in `scripts/`), so a new file there reaches projects with no change.
- The page's stamp (`stampOf` in `scripts/panel.mjs`) is worked out from `panel.html` alone today. `/lcd.js` and `/fonts/Doto.ttf` show how the server names each file it serves.
- Today Settings runs from `openSettings` (about line 2061) to `saveSettings` and its helpers (about line 3200).
- Waits for 0431: both change `templates/panel.html`, `scripts/panel.mjs` and `test/support/panel.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

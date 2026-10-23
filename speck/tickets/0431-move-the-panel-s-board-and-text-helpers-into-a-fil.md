---
id: "0431"
title: "Move the panel's model into a file of its own"                # one outcome, no "and"
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
after: ["0430"] # ticket ids that must be done first
created: 2026-10-23

---
# 0431 · Move the panel's model into a file of its own

**Status:** 📋 ready

## Problem
The page's model, the code that turns the board into what the page shows without touching the page, sits inside `templates/panel.html` between `---- model` and `---- end model`. Tests that run it on its own have to cut it out of the page first.

## Outcome
The page's model is in a file of its own, which tests load directly.

## Acceptance criteria
1. Everything between `---- model` and `---- end model` in `panel.html` today is in `templates/panel-model.js`, which the page loads from `/panel-model.js` before the rest of its script. `panel.html` no longer contains it.
2. the panel's server answers `GET /panel-model.js` with the file as `text/javascript`, read afresh on each request as the page is. A page loaded before the file changed says it's out of date and offers to reload, as one does today when `panel.html` changes. A request for any other path, such as `/panel.html` or `/panel-model.js/../x`, gets the answer an unknown path gets today.
3. `test/panel.test.mjs`, and every other test that runs the model on its own, loads it from `panel-model.js`, without a browser and without reading `panel.html`.
4. No test that passed before this change fails, except tests that read the moved code from `panel.html`, which read it from the new file instead.

## Out of scope
- Changing what the model does.
- The styles (0430), Settings (0432) and the rest of the script (0433).

## Notes
- The user asked for this on 2026-10-23, after noticing builds that change the panel taking much longer (0410 26 min, 0413 41 min).
- Part of splitting `templates/panel.html` (4,414 lines, 315 KB on 2026-10-23) into files by area, so panel tickets in different areas can build side by side and agents work with smaller files: 0430 styles, 0431 the model, 0432 Settings, 0433 the rest. No change to what the panel does or how it looks.
- Install and update copy the whole `templates/` folder (`place` in `scripts/`), so a new file there reaches projects with no change.
- The page's stamp (`stampOf` in `scripts/panel.mjs`) is worked out from `panel.html` alone today. `/lcd.js` and `/fonts/Doto.ttf` show how the server names each file it serves.
- Waits for 0430: both change `templates/panel.html`, `scripts/panel.mjs` and `test/support/panel.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

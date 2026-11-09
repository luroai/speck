---
id: "0580"
title: "Replace the LCD screen with the black bar"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0577","0579"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T19:22:31.098Z"

---
# 0580 · Replace the LCD screen with the black bar

**Status:** 🔨 building

## Problem
The LCD screen at the top of the panel, with its dot-matrix speck, clock and captions, has become decoration: the user finds it pointless now. The redesign keeps only what was liked, its black frame, as a thin dark bar holding speck and the status.

## Outcome
The top of the panel is a thin black bar with speck, the status and the Settings button, instead of the LCD screen.

## Acceptance criteria
1. The top of the panel is a thin dark bar, rounded and inset from the edges, holding speck at about 44 px in its current mood, the status word with the project (for example "Building 4 · speck"), a second line with what's queued, how many need you (in orange) and the base branch, and the Settings button.
2. Pressing the bar's status opens the Pipeline log, as pressing the screen does today.
3. The project menu (0516) stays in the bar, still lists the speck panels running on this machine and still switches between them.
4. The bar looks the same in both looks, keeps its first line on one line on a 320 px wide screen, and stays put while a lane's list scrolls.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Deleting the LCD renderer and its tests (0581).
- The line under the bar for Decided for you (0590).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: the header is `.bezel#bezel` with the title row and `button.glass#run` around `canvas.lcd#screen` in `templates/panel.html`, drawn by `templates/panel-header.js` (`drawScreen`, `screenFrame`, `drawHeader`) with `templates/panel-header.css`; the project menu is `#project-pick` (`drawProjects`, `chooseProject`). The clock, the captions and the one-off animations go with the screen.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: hid the status lines until the first board arrives (they showed their separators alone), added speck-face.js and speck-mood.js to the page's stamp so a change to them makes an open page out of date, and kept the bar drawing when speck's script can't load.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Tests updated to the new look (AC5):
- `test/panel-0413`, `0438`, `0454`, `0478`, `0140`, `0150`, `0372`, `0128`, `0059`, `foreman-0285`, `speck-name-0485`: the header's markup, measurements and names are the bar's.
- `test/panel-0426`, `0440`, `0161`, `0428`: the bar's colours are `--bar`, the same in both looks; the status button has no edge of its own, so 0161's control counts are one lower.
- `test/panel-0432`, `0433`, `0473`, `0474`, `0302`: the page also loads `speck-face.js` and `speck-mood.js`.
- `test/panel-0055`, `0160`, `0416`: speck's face moves, and the page has no canvas.
- `test/panel-0147`: Doto's font list went with the title.
- `test/panel-0543`: under a proxy's path it checks the page's files load, not Doto.
- `test/pipeline-0415`, `0470`, `0479`: they wait for the bar's status, and compare the log's title with the bar's lettering.

Tests removed, because what they checked is gone (AC5):
- `test/panel-0471` (the big "speck" title and its dot), `test/panel-0513` (the title's dot going grey while off: speck's asleep face says that now).
- From `test/panel-0304`: the three about the title in Doto. The test that the panel serves the font stays, for 0581.
- From `test/panel-0438`: AC3 (the screen's dots against its corners) and AC5 (the title's dot).

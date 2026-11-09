---
id: "0581"
title: "Take out the LCD renderer"                # one outcome, no "and"
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
after: ["0580"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T20:00:43.274Z"

---
# 0581 · Take out the LCD renderer

**Status:** 🔨 building

## Problem
Once the black bar replaces the LCD screen (0580), the LCD's renderer, its poses and pastimes, its font and its tests are dead weight that every later change has to step round.

## Outcome
The LCD screen's code, font and tests are gone from the panel.

## Acceptance criteria
1. `templates/lcd.js` and the LCD's code in `templates/panel-header.js` (the screen's frame, speck's poses, pastimes and naps) are removed, the page no longer loads them, and the server no longer serves `lcd.js`.
2. The Doto font and its licence file are removed from `templates/fonts/`, and nothing refers to them.
3. Tests that checked only the LCD screen are removed, and the Delivery log lists each one and why. Tests of anything the bar still does are kept and pass.
4. The design record in `docs/design/lcd/` stays as it is.
5. No test that passed before this change fails.

## Out of scope
- The black bar itself (0580).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- LCD tests to look at include `test/panel-0413`, `panel-0414` (with `test/support/screen-speck.mjs`), `panel-0416`, `panel-0474`, `panel-0513`, `panel-0302` to `panel-0304`, `pipeline-0470`, `pipeline-0458` and `logo-0320`; keep any part that checks behaviour the bar keeps.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: found no further problems; `--lcd-red` became `--speck-red` so that nothing named after the LCD is left in the panel's styles. `docs/brief.md` still mentions the LCD screen: ticket 0597 updates the docs.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests removed because they checked only the LCD screen (AC3):

| Removed | Why |
|---|---|
| `panel-0302.test.mjs` | Serving the renderer and the screen's colour tokens. |
| `panel-0303.test.mjs` | The renderer's tile and mini builder, through a stand-in renderer; with no renderer they could only pass. That the header shows without it is in `panel-0581.test.mjs` AC5. |
| `panel-0304.test.mjs` | Serving Doto and its licence. Its check that no font comes from Google Fonts moved to `panel-0581.test.mjs` AC2. |
| `panel-0308.test.mjs` | The screen's shade and the renderer's hash. |
| `panel-0414.test.mjs` | speck's poses and captions on the screen. |
| `panel-0436.test.mjs` | speck's pastimes and naps. |
| `panel-0502.test.mjs` | The TVs speck watched on the screen. |
| `panel-0503.test.mjs` | speck's habits on the screen. |
| `panel-0504.test.mjs` | speck's comic moments on the screen. |
| `panel-0505.test.mjs` | speck's TV tricks on the screen. |
| `panel-0512.test.mjs` | The rhythm of those beats on the screen. |
| `support/screen.mjs`, `support/screen-speck.mjs`, `support/watch-rhythm.mjs` | Helpers for those tests. The two that the bar's tests still use, `foreman` and `state`, moved to `support/bar.mjs`. |

Tests removed from files that keep the rest:

| File | Removed | Kept |
|---|---|---|
| `panel-0413` | The word in the dot font, a long word scrolling, watch fix's word on the screen, and the screen's resize. | The bar's frame, needs-you edge, Settings, opening the log, Reload page, tooltip and the 320 px browser check. |
| `panel-0416` | The counts of what the renderer drew. | Every card check. |
| `panel-0446` | speck's events while the page was hidden (15 tests). | What the Foreman agent's board says. |
| `panel-0451` | The screen's clock and its blinking colon. | The button not mentioning fixing, and the brief's check. |
| `panel-0495` | speck's captions. | What the Foreman gives for the base branch and a wait. |
| `logo-0320` | The check on `templates/lcd.js` and the check that `panel-0302` and `panel-0308` pin the renderer. | The design record's pin. |
| `panel-0474`, `panel-0473`, `panel-0433`, `panel-0432`, `panel-0426`, `panel-0543`, `panel-0147`, `panel-0364`, `pipeline-0470`, `pipeline-0479` | Only the mentions of `lcd.js`, Doto, `--lcd-red` and the stand-in renderer. | All their tests. |

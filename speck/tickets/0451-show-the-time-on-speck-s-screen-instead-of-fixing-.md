---
id: "0451"
title: "Show the time on speck's screen instead of Fixing on"                # one outcome, no "and"
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
after: ["0446"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:22:50.644Z"

---
# 0451 · Show the time on speck's screen instead of Fixing on

**Status:** 🔨 building

## Problem
The top right of speck's screen shows `FIXING ON` while `foreman_fixing` is `fix`. It's a setting's name rather than anything happening, and it confuses more than it tells.

## Outcome
The top right of speck's screen shows the time, like a handheld's clock.

## Acceptance criteria
1. The top right of speck's screen shows the time on this computer as `HH:MM` in the 24-hour clock, in the screen's dot font, with its colon blinking once a second. `FIXING ON` no longer shows anywhere on the screen.
2. With reduced motion on, the colon doesn't blink.
3. The screen's accessible name no longer mentions fixing. Whether fixing is on still shows in Settings and in the pipeline log's Right now, as today.

## Out of scope
- What speck does on the screen (0414, 0436, 0446).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- The user asked on 2026-10-24 for that space to show something else. The clock follows the design's handheld (`handheld()` in `templates/lcd.js`).
- Today: `drawScreen(word, fixing)` in `templates/panel.js`.
- Waits for 0446: both change speck's screen in `templates/panel.js`.
- Failing before this build: none
- "Blinking once a second": the colon shows for the first half of each second and is off for the second half, so it blinks every second. The design's handheld swaps it every other second instead.
- The top row's word now has room up to 6 dots left of the clock, so a long word is cut and scrolls there rather than at the screen's edge.
- Self-check: a docs test pinned the brief's wording of the clock, which the docs rule (0267) refuses; it now checks only that "Fixing on" is gone from the README and the brief.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

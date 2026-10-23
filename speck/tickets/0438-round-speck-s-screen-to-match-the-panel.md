---
id: "0438"
title: "Round speck's screen to match the panel"                # one outcome, no "and"
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
after: ["0436"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T22:14:37.602Z"

---
# 0438 · Round speck's screen to match the panel

**Status:** 🔨 building

## Problem
Since 0428, the panel's controls and cards have rounded corners, but speck's screen and its dark frame are still square. On a wide window, the frame is also narrower than the tabs and lanes under it (520 px against 720 px), so its edges don't line up with anything.

## Outcome
speck's screen and its frame have rounded corners like the rest of the panel, the frame lines up with the tabs and lanes below it, and a red dot sits before the `speck` title.

## Acceptance criteria
1. The frame has 12 px corners, as the ticket cards do. The screen inside it has rounded corners that follow the frame's: its radius is the frame's less the gap between them, and at least 4 px.
2. At every window width from 320 px up, the frame's left and right edges line up with the tab row's and the ticket cards' edges, to within 1 px. The screen inside it is at most 520 px wide, centred in the frame.
3. The screen's top row, speck and the caption are never cut off by the rounded corners, at 320 px and at the widest.
4. The frame's crimson edge while speck needs you still shows all the way round, following the rounded corners.
5. A round dot in speck's vermilion, the colour of speck's eye on the screen, sits just before the dot-matrix `speck` title, centred on the title's height, as in the design's console. It's decoration, so a screen reader doesn't announce it.

## Out of scope
- What the screen shows (0413, 0414, 0436).

## Notes
- The user asked for this on 2026-10-23, from a phone screenshot: the screen "doesn't have rounded edges. It needs aligning with everything."
- Criterion 5: the user asked on 2026-10-23 for a red dot before the title, as the console mock's frame has (`.print span:first-child::before` in console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z).
- Today: `.bezel` (`max-width: 520px`, square) and `.glass` in `templates/panel.html`. 0428 kept the screen's corners deliberately; this changes that.
- Waits for 0436: both change `templates/panel.html`. 0430 waits for it too, as 0430 moves every style.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

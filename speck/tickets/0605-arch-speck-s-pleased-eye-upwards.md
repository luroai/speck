---
id: "0605"
title: "Arch speck's pleased eye upwards"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T08:07:02.770Z"

---
# 0605 · Arch speck's pleased eye upwards

**Status:** 🔨 building

## Problem
When speck is pleased, its red visor curves down in the middle, like a smiling mouth. But the visor is speck's eye, and a pleased eye is a closed one arched upwards, like ^, as in the mock. As drawn, speck looks like it's grinning at you rather than looking pleased.

## Outcome
speck's pleased visor arches upwards, its middle higher than its ends, like a happy closed eye.

## Acceptance criteria
1. In the pleased mood, the visor is an arch whose middle is higher than its two ends (an upturned curve like ^, not a smile), at every size from 16 px.
2. It keeps the visor's red, its glow and its small lift every 6.5 s, and eases into and out of the other moods as before.
3. The other five moods look as they do today.
4. Tests that checked the pleased visor's old curve are changed to check the new one; no other test that passed before this change fails.

## Out of scope
- The other moods.

## Notes
- Asked for 2026-11-10: "the happy animation is the wrong way. It should be the opposite arch because it's an eye not a mouth." The phone screenshot showed the visor curving down in the middle.
- Today: `VISORS.pleased` in `templates/speck-face.js` is `{ x1: -6, y1: -27, cx: 0, cy: -20, x2: 6, y2: -27 }`, so it bends down towards y -20. Something like `{ x1: -6, y1: -23, cx: 0, cy: -31, x2: 6, y2: -23 }` arches it up instead, keeping it inside the screen.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0578"
title: "Draw speck as the Premium screen"                # one outcome, no "and"
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
after: ["0577"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:34:48.451Z"

---
# 0578 · Draw speck as the Premium screen

**Status:** 🔨 building

## Problem
The redesign replaces the LCD's dot-drawn speck with a new character: the Premium screen, a small dark device whose red visor is its eye. It shows wherever speck acts or speaks, so it has to be one drawing that works at every size, in both looks, and that feels alive without the device ever moving.

## Outcome
The panel has speck's new character as one reusable drawing, in six moods, alive through its red light alone.

## Acceptance criteria
1. A new panel script draws speck as the mock's Premium screen in SVG, at any size from 16 px: a softly rounded dark device with a fine rim, a recessed screen, and a red visor with a soft glow and a faint reflection across the glass, on a light or a dark background.
2. It has six moods, each shown by the visor alone: watching (a wide bar), focused (narrower and lower), pleased (curved up into a smile), sheepish (shorter, lower and tilted), asking (the visor drops to become the dot of a red question mark drawn above it inside the screen) and asleep (a dim short line, with a red z, Z, Z rising to the upper right inside the screen).
3. The device never moves and nothing is drawn outside its screen. Only the red light moves: drifting, scanning, a small lift, glancing away, the dot pulsing twice, the z's appearing one by one, the glow breathing, and a blink every few seconds, each loop lasting at least 5 seconds. With reduced motion set, nothing moves.
4. Below 24 px the question mark and the z's are left out, and the plain visor shows instead.
5. No test that passed before this change fails.

## Out of scope
- Choosing the mood from the pipeline (0579).
- Putting speck in the header (0580) or anywhere else.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- From the mock's component: viewBox -26 -50 52 52; body 44 by 34 with 11 corner radius, centred at (0, -25); screen inset 4 with radius 7; visor 15 by 5. Bezel gradient #45484F to #0D0E11 on light, #5A5C54 to #1D1E1A on dark; screen #06070A; rim #5D6169 (light) or #70726A (dark); glass reflection white at 7%; glow the visor's red at about 28% and 3.6 wide.
- Timings from the mock: watching drift 16 s, focused scan 5.2 s, glow 6.2 s, pleased lift 6.5 s, sheepish glance 9.5 s, asking pulse 5.6 s, asleep fade 9 s and line breathing 11 s, the z's on a 9 s cycle, a blink every 8.5 s, and 0.8 s easing between shapes.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

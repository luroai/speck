---
id: "0502"
title: "Give speck a TV for each build to watch"                # one outcome, no "and"
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
after: ["0452"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T21:37:40.384Z"

---
# 0502 · Give speck a TV for each build to watch

**Status:** 🔨 building

## Problem
While builds run, speck spends most of its time in the watching pose, and today that pose is one 7.2-second loop: glance about, read the clipboard, tick a line. Watched for minutes at a time, it repeats, and nothing on the screen shows what speck is watching.

## Outcome
speck watches a little retro TV for each build, and does something different every few seconds while it does.

## Acceptance criteria
1. While speck watches (the screen's word is `Building <n>` or `Shipping …`), the scene shows a retro TV for each build, up to three, to speck's left, and one while shipping: a box with rounded corners, a curved screen, two dials and a speaker grille on its right, rabbit-ear aerials on top and two short legs, all three fitting beside speck at every width from 320 px. Checked in a real browser at 390 px with 1, 2 and 3 builds.
2. Each TV's screen scrolls a log, its newest line being typed, over a progress bar that fills at its own pace, between about 10 and 18 seconds. When a bar fills, the screen shows a tick, drawn in, for about a second, and starts again. Whenever that happens, speck hops and turns to look at that TV, unless the beat it's in has its own reaction.
3. speck stands to the right of the TVs with its clipboard. Between beats it breathes, blinks and watches one TV at a time, moving on every few seconds. It plays one beat after another, each 3.5 to 7 seconds long, picked at random by weight and never the same twice running, each blending in and out of that resting pose. This ticket's beats: keeping an eye on the builds, ticking a line off the checklist (the ticks add up to four, then a fresh page), and leaning in for a closer look, as the prototype does them (checked by review).
4. No arm reaches beyond its usual length, in any beat. The 2-minute watch and 1-minute pastime rhythm (0436), the captions, the other poses and the blends between them work as before. With reduced motion, the screen holds one still frame of speck watching beside the TVs.
5. No test that passed before this change fails.

## Out of scope
- The other beats (0503, 0504, 0505).
- Showing a build's real progress on its TV: the log and bar are decoration.

## Notes
- Asked for by the user on 2026-10-24 and 2026-10-25: "a new watching animation … this is the one state that you're mainly going to see Speck doing … multiple elements so it gives the impression that it isn't repetitive", the computer to "look more like a retro machine or tv box to go with the dot matrix retro theme", and "nothing with extending arms".
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code.
- Waits for 0452, so the animation goes in 0.16.0 rather than half of it in 0.15.0 (decided with the user on 2026-10-25).
- Today: `watchPose` and `speckPoses` in `templates/panel-header.js` (0414), the rhythm in `speckRests`, and the screen code in `templates/lcd.js`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

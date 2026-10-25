---
id: "0503"
title: "Give speck small habits while it watches"                # one outcome, no "and"
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
after: ["0502"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T21:49:17.209Z"

---
# 0503 · Give speck small habits while it watches

**Status:** 🔨 building

## Problem
After 0502, speck has three things to do while it watches. Over a long build it would still repeat itself often.

## Outcome
speck has eight small habits to mix in while it watches.

## Acceptance criteria
1. While watching, speck also plays these beats, as the prototype does them (checked by review): popcorn from a bucket in its free hand, tossed up into the gap at the top of its head; checking the clock in the top right of its own screen, with a `!`; a yo-yo on a string from its free hand; humming along with notes drifting up; following a speck of dust that lands on its ear; a sneeze, with `ACHOO`, a burst of dust and flapping ears; nodding off, until a build finishing makes it jump; and three hiccups, each with `HIC`, then a sheepish look round.
2. Each is picked at random with 0502's beats, by weight, never the same twice running, and blends in and out of the resting pose as they do. No arm reaches beyond its usual length, and nothing a beat draws goes outside the scene.
3. A step finishing makes speck hop and look, as 0502 has it, except while it's nodding off, sneezing or hiccupping, which have their own reactions. With reduced motion nothing changes from 0502. No test that passed before this change fails.

## Out of scope
- 0504's comic moments and 0505's TV tricks.

## Notes
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code. Its beats here are `popcorn`, `clock`, `yoyo`, `hum`, `mote`, `sneeze`, `doze` and `hiccup`.
- Waits for 0502, which adds the beats these join, in the same code.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

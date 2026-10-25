---
id: "0505"
title: "Let speck's TVs play tricks while it watches"                # one outcome, no "and"
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
after: ["0504"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:38:37.501Z"

---
# 0505 · Let speck's TVs play tricks while it watches

**Status:** 🔨 building

## Problem
After 0504, the TVs only scroll their logs. The user liked the beats where the TVs themselves join in, which make the scene change as well as speck.

## Outcome
speck's TVs play six tricks, and speck reacts to each.

## Acceptance criteria
1. While watching, speck also plays these beats, as the prototype does them (checked by review): the nearest TV goes to snow and speck waggles its own ear while the TV's aerials waggle with it until the picture comes back; a tiny speck on the nearest TV copies speck's every move; the nearest TV flicks over to Pong, with static either side, and speck's eye follows the ball; the nearest TV's picture rolls with a black bar sliding through, and speck tilts to follow it, then wobbles upright; too tense to watch, speck hides behind its clipboard and peeks twice as a bar nears full, then hops when the tick lands; and a drumroll with its feet and `DRRR` as a bar nears full, then `TA-DA`.
2. In the last two, that TV's bar fills and ticks when the beat says, whatever its own pace, and goes back to its own pace afterwards. Each trick happens on one TV only, and the others carry on.
3. Each is picked at random with the other beats, by weight, never the same twice running. No arm reaches beyond its usual length. A step finishing makes speck hop and look, except during these six beats. With reduced motion nothing changes from 0502. No test that passed before this change fails.

## Out of scope
- New beats beyond the prototype's.

## Notes
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code. Its beats here are `tune`, `mirror`, `pong`, `vhold`, `peek` and `drumroll`.
- Waits for 0504, in the same code.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

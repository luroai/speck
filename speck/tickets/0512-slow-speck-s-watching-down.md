---
id: "0512"
title: "Slow speck's watching down"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T10:29:20.829Z"

---
# 0512 · Slow speck's watching down

**Status:** 🔨 building

## Problem
While builds run, speck plays one watching beat straight after another, each 3.5 to 7 seconds long, with no plain watching in between. It hops whenever any TV's bar fills, and each bar fills every 10 to 18 seconds, so with three builds it hops every few seconds. The user, watching 0.16.0: "The cycling of the animations happens too quickly. It makes it look like Speck has ADHD."

## Outcome
speck mostly sits and watches, calmly, and its beats and comic moments come now and then, so each one still surprises.

## Acceptance criteria
1. Between one beat and the next, speck spends a quiet spell of plain watching, picked at random between 15 and 35 seconds: it breathes, blinks and watches one build's TV at a time, moving on to the next about every 6 seconds. Beats keep their own lengths.
2. The comic moments and TV tricks (bubble, spider, balance, dance, tune, mirror, pong, vhold, peek and drumroll) come at most once every 2 minutes, and the other beats fill the rest. No beat comes again until at least 5 others have played.
3. Each TV's bar takes between 20 and 40 seconds to fill. When one fills, speck turns its eye to that TV, and hops only if it hasn't hopped in the last 30 seconds.
4. The 2-minute watch and 1-minute pastime rhythm (0436), what each beat does, and reduced motion are unchanged. No test that passed before this change fails.

## Out of scope
- New beats, or changing what any beat does.

## Notes
- Asked for by the user on 2026-10-26.
- Today: `BEATS` and `beatAt` in `templates/panel-header.js` (0502 to 0505) pick beats back to back, never the same twice running; `period` there sets each TV's bar at 10 to 18 seconds; the step-finished hop is under "a bar filling".
- The numbers are a first setting, to tune by watching it: the prototype `docs/design/lcd/watching.html` shows the beats themselves.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

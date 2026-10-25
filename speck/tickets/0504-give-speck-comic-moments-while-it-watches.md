---
id: "0504"
title: "Give speck comic moments while it watches"                # one outcome, no "and"
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
after: ["0503"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:18:46.825Z"

---
# 0504 · Give speck comic moments while it watches

**Status:** 🔨 building

## Problem
After 0503, speck's beats are habits. The user wants humour in what speck does while it watches, so the screen is worth glancing at.

## Outcome
speck has four comic moments to mix in while it watches.

## Acceptance criteria
1. While watching, speck also plays these beats, as the prototype does them (checked by review): a bubble that grows out of the gap at the top of its head and pops in its face; a spider that lowers itself on a thread between speck and the TVs, while speck leans back wide-eyed and gives it a flat look as it climbs away; balancing the clipboard flat on its head until it slides off onto the floor, then back in its hand; and a little dance, until it notices you, freezes staring out of the screen, and goes back to watching.
2. Each is picked at random with the other beats, by weight, never the same twice running, and blends in and out of the resting pose as they do. No arm reaches beyond its usual length: while the clipboard is on its head or the floor, that arm is folded away.
3. A step finishing makes speck hop and look, except during these four beats. With reduced motion nothing changes from 0502. No test that passed before this change fails.

## Out of scope
- 0505's TV tricks.

## Notes
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code. Its beats here are `bubble`, `spider`, `balance` and `dance`.
- Waits for 0503, in the same code.
- Failing before this build: none
- Self-check: the clipboard lands on the floor to speck's right rather than its left, where three builds' TVs stand and it would sit on the nearest one; the balance's wobble stops once the clipboard slides off rather than starting again as it comes back; the spider fades in and out with the beat like the other props. 0502's hop test samples ten minutes rather than two, as with more beats it often saw no read during a tick (12 in 40 runs failed, 4 in 40 before this change).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

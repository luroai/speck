---
id: "0514"
title: "Keep trackpad lane swipes working after each swipe"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-26-keep-trackpad-lane-swipes-working-after-each-swipe.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T10:45:32.928Z"

---
# 0514 · Keep trackpad lane swipes working after each swipe

**Status:** 🔨 building

## Problem
On a laptop trackpad in Cursor's panel pane, a sideways scroll changes lane once, then further left/right swipes do nothing until you click the panel. After that click, one swipe works again, and you have to click once more for the next. Swiping between Plan, Build and Shipped should not need a click between each change.

## Outcome
A sideways trackpad scroll keeps changing lane on each gesture, without a click in between.

## Acceptance criteria
1. With the panel open (including in a narrow Cursor browser pane), a sideways trackpad scroll that changes lane from Build to Shipped (or Plan) is followed by another sideways scroll the other way that changes lane back, with no click, tap or key press between them. The same holds for a third scroll after that.
2. A pause of any length between two sideways scrolls still lets the second one change lane. Scrolling a lane's list up and down between two sideways scrolls still leaves the next sideways scroll able to change lane.
3. A single continuous trackpad glide still changes lane only once, as 0476 intended, so inertia after the fingers lift does not skip across every lane. Arrow keys and tapping the strip still change lane as they do today.
4. No test that passed before this change fails, except a check that a second trackpad scroll within the old quiet window is ignored, which is changed to check criterion 1.

## Out of scope
- Touch-screen finger swipes, which use a different path.
- Changing how far a scroll must go before the first lane change.

## Notes
- Asked for 2026-10-26 from Cursor on a laptop trackpad: after swapping lanes, left/right swiping stops until a physical click on the panel, then works once.
- Checked 2026-10-26: the wheel handler in `templates/panel-header.js` (0476) sets `wheelDone` after one lane change and only clears it after 150 ms with no `wheel` events. Each further `deltaX` event (including trackpad inertia) resets that quiet timer while `wheelDone` stays true, so a second intentional swipe is ignored for as long as events keep arriving. A click that stops those events would let the timer fire and match the "click then one swipe" symptom.
- Checked 2026-10-26: whether Cursor's pane also drops wheel delivery until a click after a lane change can't be seen on this box (only Cursor's command-line agent is installed, with no editor pane to scroll in). Nothing found says it does; criterion 1 must hold either way.
- Changes `templates/panel-header.js`. No open ticket changes that file (0512 and 0513 do not).
- Failing before this build: none
- Self-check: no changes. Checked: a scroll whose events carry no change sideways is skipped as before; jitter the other way at a glide's end is undone by the next step the same way, so it never adds up to 40 px; a discrete tilt wheel still changes lane once a notch only after a 150 ms pause, as before; nothing is kept between page loads.
- AC4: no existing test checked that a second trackpad scroll within the quiet window is ignored, so none was changed.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0517"
title: "Make lane swipes snappier"                # one outcome, no "and"
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
after: ["0516"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T16:17:47.800Z"

---
# 0517 · Make lane swipes snappier

**Status:** 🔨 building

## Problem
Moving between Plan, Build and Shipped by swiping left or right still feels slow to the user (2026-10-26), after 0514 made each trackpad swipe change lane. A trackpad swipe has to travel 40 px before anything happens, the card then takes 200 ms to slide, and the panel redraws every lane as the slide starts, which can hold up its first frames.

## Outcome
A left or right swipe changes lane as soon as it's clearly meant, and the new lane is in place in about half the time it takes today.

## Acceptance criteria
1. A sideways trackpad scroll changes lane once it has gone 20 px, rather than 40 px. A scroll under 20 px still changes nothing, and everything else 0514 set up stays as it is: one change for each swipe, a swipe's glide changing nothing, and the next swipe changing lane again with no click in between.
2. A lane change, by trackpad, swipe, the arrow keys or a lane's name in the strip, brings the new card to rest within 120 ms of starting to slide, rather than 200 ms. With reduced motion, a lane still changes without sliding.
3. Redrawing the lanes never holds up a slide: a slide starts on the first frame after the lane change, and a redraw that falls during a slide, from the lane change itself or the 2-second refresh, happens once the card has come to rest. Checked in a real browser with 500 tickets in Shipped and 30 in Plan: the slide's first frame comes within 50 ms of the lane change.
4. On a touch screen, a touch is followed sideways once it has gone 6 px more sideways than up or down (rather than 10 px), and a slow drag changes lane past a quarter of the card's width (rather than a third). A quick flick still changes lane however short it is, and up-and-down scrolling still never moves the card.
5. No test that passed before this change fails, apart from the earlier swipe tests that check the old distances and times (40 px, 200 ms, 250 ms, 10 px and a third of the card), which change to these.

## Out of scope
- A trackpad scroll moving the card with the fingers before the lane changes, as a touch does: the lane still changes in one step once the scroll has gone 20 px.
- Wrapping round from the last lane to the first.
- Anything about the project switcher (0516).

## Notes
- Asked for 2026-10-26: "I also need the left/right swipes to be snappier. Still not moving as fast as I need." The user swipes on a laptop trackpad in Cursor's panel pane (0514) and uses the panel's home-screen app on a phone.
- Today, in `templates/panel-header.js`: the wheel handler's 40 px, `SLIDE_MS` (200), the touch handlers' 10 px and `lanesBox.clientWidth / 3`, and `stepLane`, which calls `render()` (in `templates/panel.js`) straight after `openTab` starts the slide. During a slide every lane is laid out (`showRow`), Shipped included.
- 0476 set "at most 250 ms after the finger lifts" and the 10 px and a-third rules. This replaces those numbers, and the tests that pinned them change with them.
- Waits for 0516, which also changes `templates/panel-header.js` and may change how `templates/panel.js` refreshes the page for the project being shown.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

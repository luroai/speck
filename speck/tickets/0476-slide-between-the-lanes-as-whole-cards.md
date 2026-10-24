---
id: "0476"
title: "Slide between the lanes as whole cards"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0471"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0476 · Slide between the lanes as whole cards

**Status:** 📝 draft

## Problem
On a phone, the user moves between Plan, Build and Shipped only by pressing the tabs, and the lane under them swaps at once, with nothing to show the lanes sit side by side. Swiping is what a phone's hand expects, and lanes laid out as a row of cards would make it easy to add more lanes later.

## Outcome
Each lane is a whole card, with its title at its top and its tickets under it, and swiping left or right slides the whole card aside to bring the next lane into view.

## Acceptance criteria
1. Plan, Build and Shipped are three cards in one row, in that order, each as wide as the column under speck's screen, with the lane's name at the card's top and its tickets and lane line (such as `1 in flight · 8 queued`) under it as today. Only one card is in view at a time.
2. A swipe left or right on a touch screen moves the card with the finger and comes to rest on one whole card, never part of two, in at most 250 ms after the finger lifts. A quick flick changes lane however short it is, and a slow drag changes it past a third of the card's width. A sideways scroll on a trackpad, and the ← and → keys while the focus isn't in a text field, change lane in the same time. With reduced motion, a lane changes without sliding.
3. Scrolling a lane up and down and swiping sideways never get in each other's way: the panel tells which way a touch is going within its first 10 px and follows only that way, and a sideways swipe straight after an up-and-down scroll, even while the list is still gliding, slides the card at once. A swipe that starts in something that scrolls sideways itself, such as a wide table, scrolls that instead. Checked in a real browser with a simulated finger. The tabs stay for now, and stay in step: pressing one slides to its lane, and the open tab follows a swipe. The lane open, and each lane's own scroll place, survive the 2-second refresh and a pop-up opening and closing.
4. At every window width the column stays at most as wide as it is today (720 px), centred, with one lane in view under speck's screen: a wider window never shows more lanes. Checked in a real browser at 390 px and 1400 px, swiping with a simulated finger. No test that passed before this change fails.

## Out of scope
- Replacing the tabs with a lane strip (0477).
- More lanes, and showing several lanes side by side on a wide window.

## Notes
- Asked for by the user on 2026-10-24: "swiping left and right would move … the view from plan, build and ship … a sliding card … the whole pane would be a card, and at the top of the card would be the title … it would then be easier to add more lanes."
- Mock-up the user approved on 2026-10-24, with 0476 to 0478 together: https://claude.ai/artifact/3sE9DU2PdnsvR6p1tLNw8j.
- Earlier: 0066 (cancelled: "Changed my mind: keeping the current panel layout") would have swiped between Shaping and Queue, before the tabs. `speck/ideas/done/2026-10-08-speck-board.md` decided the panel isn't a kanban board, as only the two ends of the pipeline are human. This keeps that: one lane in view at a time, a view of the same pipeline, with no dragging cards between lanes.
- Decided by the user on 2026-10-24: the panel stays thin, a phone screen or a side panel beside an agent chat, "a bolt-on thing to the side, not an actual product on its own". A wider window doesn't show more lanes.
- From the user testing the mock-up on a phone on 2026-10-24: sliding should be snappier, and the browser's own sideways scrolling (scroll snap) held on to an up-and-down scroll, so a sideways swipe straight after one didn't move the lanes. So the panel follows sideways swipes itself and leaves up-and-down scrolling to the browser: how is the builder's call.
- Today: `openTab` in `templates/panel.js` (0410, 0425) shows one lane under the tabs; each lane's list scrolls on its own (`.lane-list`). Built for release 0.15.0.
- Waits for 0471 and, through it, the file splits (0472 to 0474): it changes the header's and the lanes' script and styles.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

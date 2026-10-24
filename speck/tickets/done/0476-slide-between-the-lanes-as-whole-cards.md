---
id: "0476"
title: "Slide between the lanes as whole cards"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0469"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T14:55:29.527Z"
approved: "2026-10-24T15:26:40.669Z"
finished: "2026-10-24T15:29:54.651Z"

---
# 0476 · Slide between the lanes as whole cards

**Status:** ✅ done

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
- From the user testing the mock-up on a phone on 2026-10-24: sliding should be snappier, and the browser's own sideways scrolling (scroll snap) held on to an up-and-down scroll, so a sideways swipe straight after one didn't move the lanes. So the panel follows sideways swipes itself and leaves up-and-down scrolling to the browser: how is the builder's call. Version 3 of the mock-up does it with touch events, claiming a touch once it's gone 10 px more sideways than up or down, with `touch-action: pan-y` on each lane's scrolling list; a lane that's wider than the column (padding outside its width) leaves the next lane out of line.
- Today: `openTab` in `templates/panel.js` (0410, 0425) shows one lane under the tabs; each lane's list scrolls on its own (`.lane-list`). Built for release 0.15.0.
- Waits for 0469, and through it the file splits (0472 to 0474): 0469 changes the tabs' and cards' spacing, which this rebuilds. Re-chained by the user on 2026-10-24 so it builds side by side with 0471, which changes only the word in the screen's title row.
- Failing before this build: none
- Self-check: the lanes' box is clipped rather than hidden, so nothing can scroll it sideways, with a test that scrolls a ticket into view partway through a slide; swipes in the tests that only need to change lane now also go past a third of the card, so a busy machine can't make them miss.
- Older tests changed to fit the slide (the behaviour they check is the same): tests that press a tab and measure the lane straight away now bring the slide to its end first (`REST_LANES` in `test/support/panel.mjs`, used by `openLane` and in 0140, 0165, 0417 and 0418); 0134 and 0425 expect each lane's new name at the top of its card; 0060's point outside the pane is lower, in Plan's list, since the name moves the list down.

## In plain words
Plan, Build and Shipped are now three cards side by side, each with its name at the top. On a phone, swiping left or right moves the card with your finger and slides the next one in; a quick flick is enough, or a slower drag past a third of the way. A sideways scroll on a trackpad and the left and right arrow keys do the same. Scrolling up and down a lane still works as before, and a swipe straight after a scroll moves the card at once. The tabs are still there and stay in step with the cards: pressing one slides to it. A wide window still shows one lane at a time in the same narrow column.

To see it, open the panel on a phone and swipe across a lane, or press the arrow keys on a computer. Worth keeping an eye on: the lane's name now appears both in the tabs and at the top of its card, until the tabs are replaced by a lane strip (0477).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 177,919
- Elapsed since build started: 31 min
- Changed lines: 141 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, not inbox ideas):
  - When a lane slides away while the keyboard focus is in it, the focus drops back to the page, as it already did when a tab was pressed.
  - Chrome holds back a touch's moves until it has gone about 15 px, so on Chrome the panel sees which way a touch is going a little later than 10 px; the 10 px rule applies to the moves it gets.
  - Each lane's name shows twice, in the tabs and at the top of its card, until 0477 replaces the tabs.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d3defe2942003b678c7f83d82846c0ca187a08d3",
    "session": "fresh",
    "thread_id": "01a16e84-aeb0-7de1-a574-17acc5a62bd8",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0476.test.mjs test/panel-0060.test.mjs test/panel-0134.test.mjs test/panel-0140.test.mjs test/panel-0165.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0425.test.mjs (304 files, as test/support/panel.mjs changed; 2697 pass, 0 fail).\n- Design: at rest only the open lane shows, exactly as before (closed lanes `hidden`, `display: none`), so the panel's layout at rest is unchanged. While the row moves (`data-slide` on `main`), all three cards show in one row, each 100% of the column wide, translated so the open card is in view. A finger drag sets `--drag`; a slide to rest is a 200 ms Web Animation on the three cards; with reduced motion there is no drag offset and no animation. Touches are claimed sideways or left to the browser by the way they've gone more at 10 px; the cards have `touch-action: pan-y pinch-zoom`, so the browser never pans sideways itself and a pinch still zooms (0161).\n- Older tests changed to fit the slide, checking the same behaviour: tests that press a tab and measure straight away now end the slide first (`REST_LANES` in test/support/panel.mjs, used by `openLane()` and inline in 0140, 0165, 0417, 0418); 0134's static text list and 0425's \"count opens its lane\" regex now expect each card's new name at its top (AC1 asks for it); 0060's fixed point outside the pane moved from y 450 to 600, as the name pushes Plan's list down 37 px and 450 now lands on Plan's toggle row.\n- Browser touch tests send each touch event with its own timestamp, and \"comes to rest within 250 ms\" reads the slide's remaining time from its animations before waiting for it to end, so the tests don't depend on how loaded the machine is (run three at once under full CPU load: all pass). Chrome holds back a touch's moves until it has gone about 15 px, so the direction tests move a little past 10 px before turning.\n- Pictures: 7 in the review pack (Build and Plan in both looks, partway through a swipe in both looks, 1400 px window).\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 176999,
      "cached_input_tokens": 125952,
      "cache_write_input_tokens": 0,
      "output_tokens": 920,
      "reasoning_output_tokens": 369
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T15:26:27.087Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html adds each lane’s heading; panel-base.css lays cards out at full column width. Passing 0476 AC1 and browser layout tests verify order, headings, counts and one visible card at rest."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-header.js implements finger tracking, flick and distance thresholds, 200 ms settling, trackpad and keyboard navigation, and reduced motion. Both passing 0476 AC2 browser tests exercise these behaviours."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0476 AC3 browser tests exercise direction locking, a swipe during vertical momentum, nested horizontal scrolling, tab synchronisation, refresh persistence and scroll positions after a pop-up closes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0476 AC4 browser tests verify centred columns capped at 720 px and simulated swipes at 390 px and 1400 px. The recorded related-test run has 2697 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The lanes slide as whole cards, with tabs, keyboard controls and trackpad navigation kept in step. Browser tests cover gesture conflicts, saved scroll positions, reduced motion and narrow and wide windows. I found no blocking issues; the related tests pass."
  }
}
```

</details>

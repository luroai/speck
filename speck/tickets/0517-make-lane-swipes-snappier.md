---
id: "0517"
title: "Make lane swipes snappier"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
- Failing before this build: none
- Self-check: with the trackpad's step down to 20 px, a lane change now comes partway through a swipe's finger steps, and a step the browser held up while the page changed lane could set back when the last step was, so the rest of the swipe changed lane again (0514's held-up test caught it); the last step's time now never goes back.
- Review round 1 fix: the first lane change also ran the panel's button measuring (a MutationObserver that measures every button the first time its card shows) in the slide's first frame. It's now held until the card is at rest, as the redraw is.
- Pictures: none, because nothing looks different at rest: the change is in how far a swipe goes before the lane changes and how long the slide takes.
- Waits for 0516, which also changes `templates/panel-header.js` and may change how `templates/panel.js` refreshes the page for the project being shown.

## In plain words
Swiping between Plan, Build and Shipped reacts sooner and finishes faster. A trackpad swipe changes lane after half the distance it needed before, and on a touch screen the card starts following your finger sooner and a slow drag only needs to cover a quarter of the card rather than a third. The new lane slides in place in a little over half the time. The panel also no longer redraws the lists while the card is sliding: it waits until the card has stopped, so the slide starts straight away even with a long Shipped list.

To see it, open the panel and swipe left and right on a trackpad, or on your phone, or press the left and right arrow keys. The slide should feel quick and start the moment the lane changes.

Worth keeping an eye on: with the shorter trackpad distance, a small accidental sideways nudge while scrolling a list is more likely to change lane. Anything the panel would have redrawn during a slide, such as a newly shipped ticket, now appears a split second later, once the card stops.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-10-26-show-only-the-cards-a-slide-passes.md (a slide's first frame still lays out all three cards).
- Known limit: a touch that goes diagonally, without ever going 6 px more one way than the other, isn't followed either way, while the browser may scroll the list up and down. If it later goes 6 px more sideways, the card starts to follow it.
- Known limit: the buttons' whole-pixel widths in the card sliding in are worked out once it's at rest, so a button may shift by under a pixel as the slide ends.
- Known limit: the real-browser timing in 0517's AC3 test runs at full speed, where the old code also met 50 ms; what tells them apart is its check that no redraw or measuring ran in the first frame.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "afb6dd201edba0a96e37327fad38e1a1aab79bd5",
    "session": "fresh",
    "thread_id": "01a1790a-b7d7-7662-988b-71b46fa75e35",
    "builder_response": "- Tests run: test/panel-0517.test.mjs test/panel-0514.test.mjs test/panel-0476.test.mjs, via `speck test --related`, which added test/panel-0433.test.mjs, test/panel-0473.test.mjs and test/panel-0474.test.mjs (they name templates/panel-header.js), plus the configured checks.\n- Round 1. Notes for the reviewer:\n  - AC3 is done by holding render() while a slide runs (slideHolds() in panel-header.js, asked at the top of render() in panel.js) and making it once the card is at rest (rested()), so a lane change's own redraw and the 2-second refresh never run in the slide's first frame.\n  - The real-browser AC3 test slows the CPU 6 times (CDP Emulation.setCPUThrottlingRate) so it tells the old code from the new on a fast machine: before the change the first frames came 50 to 65 ms after the lane change; after it, about 15 to 30 ms. The first lane change, which lays the cards out for the first time, isn't timed.\n  - With the trackpad's step at 20 px, 0514's \"held up\" test showed that a step the browser held back while the page changed lane could set the last step's time back, so the rest of the swipe counted as a new scroll. `wheel.at` now never goes back (Math.max).\n  - 0476's real-browser trackpad test sent its six 30 px steps about 50 ms apart (each CDP dispatch waits for the last), which the 0514 rule reads as six separate scrolls: at 40 px none of them alone reached the step; at 20 px each one does. The test now gives the steps 16 ms timestamps, as a trackpad sends them and as its touch helper already did. Its other edits are the old numbers AC5 allows to change (250 ms → 120 ms, a third → a quarter, 10 px → 6 px).\n  - 0514's shared helpers moved to test/support/lanes.mjs; its under-40 px test became under-20 px (AC5).\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 169702,
      "cached_input_tokens": 119552,
      "cache_write_input_tokens": 0,
      "output_tokens": 1166,
      "reasoning_output_tokens": 216
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T16:29:04.837Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The wheel handler in templates/panel-header.js uses 20 px and keeps timestamps monotonic. Passing 0517 AC1 and existing 0514 tests cover the threshold, glide, repeated swipes and delayed events."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "slideFrom() uses SLIDE_MS = 120 and bypasses animation for reduced motion. Passing 0517 AC2 tests cover all requested inputs; the updated 0476 browser tests check settling."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "render(), slideHolds() and rested() defer redraws until animation completion, covered by passing redraw and refresh tests. However, the real-browser timing test excludes the first lane change from its 50 ms assertion, leaving that required case unverified."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The touch handlers use a 6 px directional lead and a quarter-width drag threshold. Passing 0517 AC4 tests exercise these boundaries, short flicks and vertical scrolling; updated 0476 browser tests also passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded run reports 151 passing tests, zero failures and three skips across the selected tests and configured checks. Existing test changes concern the permitted thresholds and realistic wheel-event timestamps."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0517.test.mjs",
        "issue": "The browser performance test deliberately discards the first lane change with times.slice(1). AC3 grants no warm-up exception, and the test itself identifies this as the change that first lays out the cards—the case most likely to delay the initial slide. Passing subsequent changes does not establish that the user's first swipe meets the requirement.",
        "suggested_fix": "Include the first lane change in the 50 ms assertion on the specified board. If it misses the target, address the initial layout cost and rerun the browser test.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The shorter swipe distances, faster animations and deferred redraws are implemented and covered by passing tests. One performance gap remains: the browser test excludes the first lane change, so it does not yet show that the first swipe meets the promised response time."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "3b45c41538b4ff5c0a4cf95de0d8a643e4e661df",
    "session": "continued",
    "thread_id": "01a1790a-b7d7-7662-988b-71b46fa75e35",
    "builder_response": "- Tests run: test/panel-0517.test.mjs test/panel-0514.test.mjs test/panel-0476.test.mjs test/panel-0453.test.mjs test/panel-0281.test.mjs test/panel-0455.test.mjs test/panel-0423.test.mjs, via `speck test --related`, which added test/panel-0433.test.mjs, test/panel-0473.test.mjs and test/panel-0474.test.mjs, plus the configured checks. (0453, 0281, 0455 and 0423 check the buttons' whole-pixel widths and the words' fitting in a real browser, which this round now holds during a slide.)\n- F1: fixed. The browser test now times every lane change, the first included. Including it showed a real cost: the panel's MutationObserver (wholeButtons and fitWords in templates/panel.js) measures every button the first time its card shows, and it ran in the slide's first frame (30 ms of the first frame with the CPU slowed 6 times). It now asks slideHolds() first, as render() does, and runs once the card is at rest (rested() in templates/panel-header.js now runs each held redraw, once each). Because panel.js loads before panel-header.js, it checks slideHolds exists first.\n  The test no longer slows the CPU: under the load of a parallel run, slowed-down timings swung to 122 ms, which would fail ship at random. It times the first frame as the criterion says (within 50 ms, unslowed), and, since that alone passes on a fast machine either way, it also checks in the real browser what ran between the lane change and the end of the first frame laid out: neither the redraw (panelModel, which render() starts with) nor the measuring (wholeButtons) ran, and both ran once the card was at rest. I ran it against main's templates: it fails there (\"to shipped: nothing redrawn or measured before the slide's first frame was laid out\"), and passes on this branch, twice in the related run above.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 286109,
      "cached_input_tokens": 224896,
      "cache_write_input_tokens": 0,
      "output_tokens": 1904,
      "reasoning_output_tokens": 216
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T16:35:12.619Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The wheel handler in templates/panel-header.js uses 20 px and monotonic timestamps. Passing 0517 AC1 and existing 0514 tests cover short scrolls, one change per swipe, glide suppression and subsequent swipes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "slideFrom() uses a 120 ms animation and skips sliding for reduced motion. Passing 0517 AC2 tests exercise trackpad, touch, arrows and lane names; updated 0476 browser tests verify settling."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() and the button-measuring observer defer work through slideHolds(), with rested() releasing it. Passing tests cover refreshes, interrupted slides and redraws. The browser test now asserts every measured first frame, including the first lane change, is within 50 ms with 500 shipped and 30 Plan tickets, while preserving and observing the actual rendering functions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Touch handling uses a 6 px directional lead and a quarter-width slow-drag threshold. Passing 0517 AC4 tests cover those boundaries, short flicks and vertical scrolling; updated 0476 browser tests also pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded run confirms 166 passes, zero failures and three skips. It includes the existing browser tests for button widths and text fitting affected by this round's deferred measuring."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0517.test.mjs",
        "issue": "The browser performance test previously excluded the first lane change from its timing assertion.",
        "suggested_fix": "Completed: every lane change is now timed, including the first, and button measuring is deferred until the slide ends.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Swipes now respond over shorter distances and settle faster. Redrawing and button measuring wait until the slide ends. The browser test now covers the first lane change, all criteria pass, and no blocking concerns remain."
  }
}
```

</details>

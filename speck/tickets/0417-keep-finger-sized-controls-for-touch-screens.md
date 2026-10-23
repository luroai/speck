---
id: "0417"
title: "Keep finger-sized controls for touch screens"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0416"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T15:53:47.802Z"
approved: "2026-10-23T16:00:04.696Z"

---
# 0417 · Keep finger-sized controls for touch screens

**Status:** 👍 approved

## Problem
Below 700 px wide, every tag, toggle and button on the panel is at least 44 × 44 px (0140), a size meant for fingers. The panel is used mostly in a narrow side pane with a mouse, where those sizes make every card much taller than it needs to be.

## Outcome
Controls are finger-sized on touch screens only, so a narrow pane used with a mouse gets compact controls.

## Acceptance criteria
1. Where the main pointer is fine (a mouse or trackpad), no control on the panel has a 44 px minimum width or height at any window width. Each is sized to its text with the panel's normal padding.
2. Where the main pointer is coarse (a touch screen), every control that has a 44 px minimum below 700 px today keeps it, at any window width.
3. The panel's other rules for narrow windows, the ones not about a control's size, still apply below 700 px as today.

## Out of scope
- Laying the panel out in one column (0418) and making the cards shorter (0419, 0420).

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there.
- The 44 px rules are in the `@media (max-width: 699.98px)` block in `templates/panel.html` (0140, 0161).
- Checked 2026-10-23: turning on touch emulation over DevTools (`Emulation.setTouchEmulationEnabled`, which Playwright's `hasTouch` uses) makes `(pointer: coarse)` match in the installed headless Chromium. Without it, headless Chromium matches neither `(pointer: fine)` nor `(pointer: coarse)`, and `Emulation.setEmulatedMedia` can't emulate `pointer`. Playwright itself isn't installed here: the tests use the DevTools call directly.
- Waits for 0416: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: no changes. Headless Chromium matches neither `(pointer: fine)` nor `(pointer: coarse)`, so the browser test for AC1 runs with no touch screen (pointer none), and the stylesheet test checks no 44 px size sits outside the touch screen rules at any width. The phone tests of 0140, 0151, 0154, 0162, 0164 and 0165 now turn on touch emulation below 700 px, as a phone has a touch screen.

## In plain words
In a narrow window used with a mouse or trackpad, such as the panel in a thin side pane, the buttons, tabs and tags are back to their compact size, so the cards are shorter. On a touch screen, such as a phone or tablet, they stay finger-sized, now at any width. Everything else about the narrow layout is as it was.

To see it, make the panel's window narrower than 700 px with a mouse: the tabs, toggles and Settings button stay small. Open it on a phone and they're as big as before. Worth keeping an eye on: a laptop with a touch screen counts as a mouse when its main pointer is the trackpad, so it gets the compact sizes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 107,610
- Elapsed since build started: 6 min
- Changed lines: 71 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. Known limit: headless Chromium can't emulate a fine pointer, so the browser test for a mouse runs with no pointer at all, and the stylesheet test covers the fine-pointer case.

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
    "reviewed_sha": "2c7225a67c781799bdbaa24503c62784314be1ea",
    "session": "fresh",
    "thread_id": "01a1697d-2478-7af1-8f3c-a34cdec360f6",
    "builder_response": "- Tests run: test/panel-0417.test.mjs test/panel-0140.test.mjs test/panel-0151.test.mjs test/panel-0154.test.mjs test/panel-0162.test.mjs test/panel-0164.test.mjs test/panel-0165.test.mjs\n- Approach: every 44 px rule from the `(max-width: 699.98px)` block in `templates/panel.html` moved, unchanged, into a new `@media (pointer: coarse)` block with no width in its query (AC2: any width on a touch screen). Rules that exist only to serve those tap areas moved with them: the tags' invisible 44 px boxes and the 18 px gaps that keep them apart (0165), the priority tag's tap box (0151, 0162), the ids' tap areas and their stacking (0164, 0190, 0224), and the summary's `padding-top` that goes with its 44 px height. Everything else stays in the narrow block (AC3), including the Settings info buttons' `inset: -6px`, which is a 30 px target, not a 44 px one.\n- Headless Chromium matches neither `(pointer: fine)` nor `(pointer: coarse)` and can't emulate `pointer` through `setEmulatedMedia`, so the AC1 browser test runs with no touch screen (pointer none); the stylesheet test checks that no 44 px size is outside the coarse block at any width. Touch is emulated with `Emulation.setTouchEmulationEnabled` (what Playwright's `hasTouch` uses), checked in the ticket's Notes.\n- The existing phone tests of 0140, 0151, 0154, 0162, 0164 and 0165 each gain one line turning on touch emulation below 700 px, as they describe a phone. No assertion in them changed.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 107049,
      "cached_input_tokens": 64128,
      "cache_write_input_tokens": 0,
      "output_tokens": 561,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T15:59:54.668Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html confines every 44px control size to @media (pointer: coarse). Passing panel-0417 tests check the stylesheet at all widths and computed control minimums in a narrow non-touch browser. The browser uses pointer:none; stylesheet inspection verifies the fine-pointer case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The coarse-pointer block preserves the previous 44px rules without a width restriction. Passing panel-0417 tests check the former selectors and actual control sizes with touch emulation at 375px and 1280px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html retains the other narrow-window declarations, including padding, wrapping and table layouts, under max-width:699.98px. Passing panel-0417 tests check their presence and computed narrow layout; the changed existing phone tests also pass."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Touch controls retain their finger-sized targets at any window width, while mouse users get compact controls in narrow panes. Other narrow-window layouts remain intact. The tests exercise the change without weakening existing assertions, and the recorded run has no failures."
  }
}
```

</details>

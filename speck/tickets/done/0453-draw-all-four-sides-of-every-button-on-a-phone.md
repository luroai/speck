---
id: "0453"
title: "Draw all four sides of every button on a phone"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-keep-the-settings-buttons-borders-whole-on-a-phone.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0449"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:08:45.305Z"
approved: "2026-10-24T09:29:09.939Z"
finished: "2026-10-24T09:33:59.056Z"

---
# 0453 · Draw all four sides of every button on a phone

**Status:** ✅ done

## Problem
On a phone, some buttons lose a side of their border: the Shipped list's Details button and the full ticket's Close button show no left edge. Their borders are half a CSS pixel and their edges can fall between device pixels, so the phone doesn't draw that side. 0281 fixed the same thing for Settings' info buttons and boxes.

## Outcome
Every button on the panel shows all four sides of its border on a phone.

## Acceptance criteria
1. Every button on the panel, including the Shipped list's Details, the full ticket's, a document's and Settings' Close, Save and Review pack, has a border at least one device pixel wide on all four sides and its edges on whole CSS pixels, as 0281 gave Settings' info buttons.
2. On a phone-sized page at a device pixel ratio of 3, each of those buttons shows all four sides of its border, checked in a real browser.
3. The buttons keep their 8 px corners (0428) and the contrast 0161 sets for a control's edge.

## Out of scope
- Cards and boxes that aren't buttons.

## Notes
- For release 0.15.0 (0452). From the user's phone screenshots on 2026-10-24: the Details and Close buttons have no left edge.
- From the builder's note on 0281 (this note was dropped in the 0.15.0 triage, then picked up again for this).
- Waits for 0449: both change `templates/panel.css`. 0452 waits for this one.
- Failing before this build: none
- How: the panel's script makes each button with a border a whole number of pixels wide as soon as the page changes (CSS can't round a width that comes from the words), and again on a resize or a font loading. The tabs are laid out in whole pixels in CSS, and the tab before another draws the edge they share, rather than the two overlapping by half a pixel; the side shared with the open tab takes its text colour. The main column, a document's and the Foreman's are centred on a whole pixel. Below a pixel ratio of 2, every button's border is 1 px. "Edges" means the left and right ones, as in 0281; the top and bottom aren't rounded.
- Changed older tests: 0281 AC3 now allows rules marked 0453 to use its rounding outside Settings; 0428's shared-edge check reads the new way the tabs share it (the left tab draws it), still once.
- Self-check: moved the rounding from the next frame to straight after each change, as More stats → Fewer stats wrapped for a frame in its old width (0420's test caught it); the tabs' width rounds to the nearest pixel, as a third of 288 px came out a hair under 96 and rounded down to 95 (0425's test caught it).

## In plain words
On a phone, every button in the panel now shows its full outline, all four sides. Before, buttons such as Details in the Shipped list and Close on a full ticket lost their left edge. To see it, open the panel on your phone and look at the Shipped list's Details buttons, a full ticket's Close and Settings' Save: each has a complete box round it. On a screen that isn't high-resolution, button outlines are now a full pixel thick so they don't fade. The three tabs look the same as before. Worth a look: buttons can be up to a pixel wider than before, which shouldn't be noticeable.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The unsaved Settings dialog still centres its 360px box on half a CSS pixel at odd phone widths above 392px.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 672,790
- Elapsed since build started: 20 min
- Changed lines: 45 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes):
  - Only the left and right edges are rounded to whole pixels, as in 0281. The tops and bottoms can still fall between pixels, though none was reported missing.
  - A button stretched to fill a container that isn't a whole number of pixels wide gets rounded up, so it can reach up to a pixel past it. No such button was found in the views checked.
  - In a browser without `:has()`, the side the open tab shares with the tab before it is drawn in the line colour rather than the text colour.

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
    "reviewed_sha": "940e13f9e10a5c6bcdb3fb4ff8c77f6a551872f4",
    "session": "fresh",
    "thread_id": "01a16d3a-a169-7e53-8717-2268d7c59752",
    "builder_response": "- Tests run: test/panel-0453.test.mjs test/panel-0281.test.mjs test/panel-0428.test.mjs test/panel-0420.test.mjs test/panel-0425.test.mjs test/panel-0161.test.mjs, plus the related files speck test --related chose (panel-0416, panel-0430, panel-0433). Separately, before this round, every other test file that uses a real browser (60 files) passed, as did 0135, 0060, 0140, 0162, 0410, 0418, 0417, 0165, 0438, 0449, 0134, 0423, 0421.\n- Approach: CSS can't round a width that comes from a button's words, so the page script (templates/panel.js, wholeButtons) makes each visible button with a border a whole number of pixels wide, straight after each change to the page (a MutationObserver that doesn't watch `style`, so its own writes don't trigger it again), and again for every button on resize or a font loading. The tabs get whole widths in CSS; the edge two tabs share is now drawn by the left tab (`.tab + .tab { border-left-width: 0 }`) rather than an overlap of half a pixel, which can't keep both edges whole, and the side shared with the open tab takes the text colour (`:has`). The main column, a document's and the Foreman's are centred on a whole pixel, as 0281 did for Settings. Below 2dppx every button's border is 1px, as 0281 did for the info buttons.\n- \"Edges on whole CSS pixels\" is read as the left and right edges, as 0281's test reads it; tops and bottoms aren't rounded.\n- Older tests changed: 0281 AC3 (rounding limited to Settings) now also allows rules marked `0453:`, which bring the same rounding to every button. 0428's check that two tabs share one edge now reads the new way they share it.\n",
    "seconds": 66,
    "usage": {
      "input_tokens": 275284,
      "cached_input_tokens": 219520,
      "cache_write_input_tokens": 0,
      "output_tokens": 1201,
      "reasoning_output_tokens": 336
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:26:26.826Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.js wholeButtons rounds button widths but does not round their positions. templates/panel.css centres #settings-unsaved .box at width 360px: on a 393px phone its left edge is 16.5px, leaving its action buttons on fractional coordinates. This dialog is absent from test/panel-0453.test.mjs VIEWS."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "The reported passing screenshot test checks the named Details, Close, Save and Review pack buttons at DPR 3, but omits other button views, including the Settings unsaved-changes dialog and Foreman controls."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0453 geometry test checks corner radii, and its selected-tab test checks the shared edge colour. Existing panel-0428 and panel-0161 tests also passed; the change retains the established contrast tokens."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.css",
        "issue": "The unsaved Settings dialog still centres its 360px box on half a CSS pixel at odd phone widths above 392px. For example, at 393px its left edge is 16.5px. Rounding its buttons' widths cannot make their left and right positions whole pixels. The new tests never open this dialog, so they miss this failure of the every-button requirement.",
        "suggested_fix": "Place the dialog's button row on whole CSS pixels, and extend the real-browser geometry and border checks to the unsaved-changes dialog at an odd phone width such as 393px and DPR 3. Include the other omitted button views in coverage of the every-button requirement.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The tested Details, Close, Save and Review pack buttons pass the browser checks, and corners and contrast are preserved. However, the Settings unsaved-changes dialog still puts its buttons between whole pixels on some phones. Fix that layout and cover the omitted button views before approval."
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
    "reviewed_sha": "59b2aeec4d5fdb2e120825c9f61924cd1157bc88",
    "session": "continued",
    "thread_id": "01a16d3a-a169-7e53-8717-2268d7c59752",
    "builder_response": "- Tests run: test/panel-0453.test.mjs test/panel-0281.test.mjs test/panel-0428.test.mjs test/panel-0420.test.mjs test/panel-0425.test.mjs test/panel-0161.test.mjs, plus the related files speck test --related chose.\n- F1: fixed. templates/panel.css: `#settings-unsaved .box` is now placed from the left at `max(0px, round(down, calc((100% - 360px) / 2), 1px))` (start-aligned, with `margin: 0 auto` before it for a browser without round()), so the box and its buttons sit on whole pixels. test/panel-0453.test.mjs now opens Settings' unsaved-changes question and the Foreman's view in every size, adds an odd 393 px phone width at 3x to SIZES, and the AC2 picture check covers the question's Save and the Foreman's Close. Without the CSS fix the AC1 test fails at \"393 px at 3x, Settings' question about unsaved changes: save-all \"Save\"'s right edge at 175.5 px\"; with it, it passes. The Foreman's view in the test repo shows only Close (no Answer or Reload), as speck run isn't running; those buttons get the same rounding from the page script and the same 1 px rule below 2dppx.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 394672,
      "cached_input_tokens": 333568,
      "cache_write_input_tokens": 0,
      "output_tokens": 1633,
      "reasoning_output_tokens": 336
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:28:58.924Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js wholeButtons rounds bordered button widths; templates/panel.css rounds column and tab positions, supplies shared tab edges and increases borders below DPR 2. The passing 0453 AC1 AC3 browser test now includes the unsaved Settings dialog at 393px and DPR 3."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0453 AC2 real-browser screenshot test checks all four border sides at 390px and DPR 3 for Details, Close, Save, Review pack and document buttons, now including the unsaved Settings dialog and Foreman's Close."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0453 geometry and selected-tab tests check existing corner radii and edge colours. Existing panel-0428 and panel-0161 tests also passed, covering corners and contrast."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.css",
        "issue": "The unsaved Settings dialog previously placed its buttons on fractional CSS pixels at odd phone widths.",
        "suggested_fix": "Round the dialog's horizontal placement and add browser coverage at an odd phone width, including its buttons and the Foreman view.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The dialog alignment issue is fixed and covered at the phone width that exposed it. Browser checks pass for border visibility, corners and contrast. No blocking findings remain."
  }
}
```

</details>

---
id: "0454"
title: "Keep the Settings button clear of speck's screen"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0453"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:34:10.913Z"
approved: "2026-10-24T09:41:25.029Z"

---
# 0454 · Keep the Settings button clear of speck's screen

**Status:** 👍 approved

## Problem
On a phone, the Settings button in the screen frame's title row touches the top of speck's screen. On a touch screen the button grows to 44 px and is pulled out of the row with negative margins, so its bottom edge sits on the screen.

## Outcome
The Settings button sits inside the frame's title row with a clear gap above speck's screen, on a phone as well as with a mouse.

## Acceptance criteria
1. At every window width, on a touch screen as well as with a mouse, there's a gap of at least 4 px between the bottom of the Settings button and the top of speck's screen, and the button doesn't overlap the screen.
2. On a touch screen the button is still at least 44 × 44 px, with the title row tall enough to hold it. With a mouse it stays its current size.
3. Pressing anywhere on the screen still opens the pipeline log, and pressing the button still opens Settings.

## Out of scope
- The frame's corners and alignment (0438).

## Notes
- From the user's phone screenshot on 2026-10-24.
- Today: `.bezel .settings-open` in `templates/panel.css`, with `width: 44px; height: 44px; margin: -4px -2px -4px 0` on a touch screen.
- Waits for 0453: both change `templates/panel.css`.
- Failing before this build: none
- Self-check: no changes

## In plain words
On a phone, the Settings button at the top right of speck's screen frame no longer sits on the screen itself: there's now a small gap between them, as there already was with a mouse. The button keeps its finger-sized tap area, and the title row is a little taller to hold it. To see it, open the panel on a phone and look at the top of the frame. Tapping the screen still opens the pipeline, and tapping the button still opens Settings.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 126,064
- Elapsed since build started: 7 min
- Changed lines: 3 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. On a touch screen the button still reaches 2 px past the screen's right edge (its -2px right margin, kept as the frame's alignment is 0438's): only a note on a known limit.

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
    "reviewed_sha": "ecbbc04d1390ef8f67effdbb3968e36c20e7feac",
    "session": "fresh",
    "thread_id": "01a16d48-b910-77b0-91d6-658e2b505ed8",
    "builder_response": "- Tests run: test/panel-0454.test.mjs, with --related (test/panel-0281.test.mjs, test/panel-0416.test.mjs, test/panel-0430.test.mjs, test/panel-0444.test.mjs) and the commands.checks files.\n- The change: the touch-screen rule for `.bezel .settings-open` in templates/panel.css drops its -4px top and bottom margins (keeping the -2px right margin, as the frame's alignment is 0438's and out of scope), so the title row grows to 48 px and its 4 px bottom padding stays between the button and the screen.\n- The tests use a real browser, as the criteria are about layout and real presses: with touch emulation (pointer: coarse) and with a mouse, at 8 widths. AC1 failed before the fix (a gap of 0 px at 320 px).\n- Pictures of the title row on a phone, light and dark, are kept with the review pack.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 125503,
      "cached_input_tokens": 87296,
      "cache_write_input_tokens": 0,
      "output_tokens": 561,
      "reasoning_output_tokens": 17
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T09:41:15.877Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css removes vertical negative margins from the touch Settings button; .bezel .print retains 4 px bottom padding. Both AC1 browser tests passed, measuring separation and overlap at eight widths from 320 to 1600 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The touch rule retains 44 × 44 px dimensions, and the mouse rule remains 30 × 30 px. Both AC2 browser tests passed, checking dimensions and containment within the title row at all eight widths."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both AC3 browser tests passed with real taps or mouse clicks at phone and desktop widths. They check hit targets across the screen and button, then verify that pressing them opens the pipeline log and Settings respectively."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Settings button now leaves a clear 4 px gap above the screen on touch devices while keeping its full tap target. Mouse sizing and both controls’ behaviour are preserved. All six ticket tests passed; no blocking concerns found."
  }
}
```

</details>

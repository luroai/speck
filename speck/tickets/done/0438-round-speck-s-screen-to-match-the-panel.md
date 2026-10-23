---
id: "0438"
title: "Round speck's screen to match the panel"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0436"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T22:14:37.602Z"
approved: "2026-10-23T22:21:40.659Z"
finished: "2026-10-23T22:24:42.837Z"

---
# 0438 · Round speck's screen to match the panel

**Status:** ✅ done

## Problem
Since 0428, the panel's controls and cards have rounded corners, but speck's screen and its dark frame are still square. On a wide window, the frame is also narrower than the tabs and lanes under it (520 px against 720 px), so its edges don't line up with anything.

## Outcome
speck's screen and its frame have rounded corners like the rest of the panel, the frame lines up with the tabs and lanes below it, and a red dot sits before the `speck` title.

## Acceptance criteria
1. The frame has 12 px corners, as the ticket cards do. The screen inside it has rounded corners that follow the frame's: its radius is the frame's less the gap between them, and at least 4 px.
2. At every window width from 320 px up, the frame's left and right edges line up with the tab row's and the ticket cards' edges, to within 1 px. The screen inside it is at most 520 px wide, centred in the frame.
3. The screen's top row, speck and the caption are never cut off by the rounded corners, at 320 px and at the widest.
4. The frame's crimson edge while speck needs you still shows all the way round, following the rounded corners.
5. A round dot in speck's vermilion, the colour of speck's eye on the screen, sits just before the dot-matrix `speck` title, centred on the title's height, as in the design's console. It's decoration, so a screen reader doesn't announce it.

## Out of scope
- What the screen shows (0413, 0414, 0436).

## Notes
- The user asked for this on 2026-10-23, from a phone screenshot: the screen "doesn't have rounded edges. It needs aligning with everything."
- Criterion 5: the user asked on 2026-10-23 for a red dot before the title, as the console mock's frame has (`.print span:first-child::before` in console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z).
- Today: `.bezel` (`max-width: 520px`, square) and `.glass` in `templates/panel.html`. 0428 kept the screen's corners deliberately; this changes that.
- Waits for 0436: both change `templates/panel.html`. 0430 waits for it too, as 0430 moves every style.
- Failing before this build: none
- Self-check: no changes. The dot holds no text, so it joins the no-text fills in 0161's contrast check; 0428 AC4's square-corner test now checks only the header, as this ticket rounds the screen and frame.

## In plain words
speck's screen at the top of the panel now has rounded corners, like the cards and buttons under it, and its dark frame does too. The frame is now as wide as the tabs and tickets below, so their edges line up on any window, while the screen itself stays no wider than before and sits in the middle of the frame. A small red dot, the colour of speck's eye, sits before the speck title.

To see it, open the panel on a phone and on a wide window: the frame's edges should run straight down into the tabs and the ticket cards. When speck needs you, the red edge round the frame follows the rounded corners all the way round.

On a wide window the frame is wider than before, with dark space either side of the screen.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 99,893
- Elapsed since build started: 7 min
- Changed lines: 18 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "bc2d0944548d9ca07acde0a4e1171c0e59bb397c",
    "session": "fresh",
    "thread_id": "01a16ada-a0b0-71c2-97c3-4b71f5e1407b",
    "builder_response": "- Tests run: `speck test --related test/panel-0438.test.mjs test/panel-0428.test.mjs test/panel-0161.test.mjs` (the ticket's own file, the two existing test files it changed, and every test file that names templates/panel.html): 2479 pass, 0 fail, 3 skipped.\n- Changed existing tests, both because this ticket deliberately reverses what they guarded:\n  - test/panel-0428.test.mjs: 0428 AC4 asserted the screen and frame stay square. 0438 rounds them (ticket Notes: \"0428 kept the screen's corners deliberately; this changes that\"), so that test now checks only that the header round them stays square; the rounded corners are checked in panel-0438.test.mjs AC1.\n  - test/panel-0161.test.mjs: the new `.bezel .name::before` dot fills with --lcd-red and holds no text (content \"\"), so it joins NO_TEXT beside the lights' dots.\n- Pictures: four, phone and wide window, light and dark, in the review pack.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 99278,
      "cached_input_tokens": 59904,
      "cache_write_input_tokens": 0,
      "output_tokens": 615,
      "reasoning_output_tokens": 17
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T22:21:32.875Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html gives .bezel 12px corners and .glass 4px corners with clipping. Passing panel-0438.test.mjs AC1 checks the radius against the measured gap at eight widths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The frame fills the shared panel width; .glass is centred with max-width: 520px. Passing AC2 measures alignment with tabs and cards at widths from 320px to 1600px. The shared width and padding rules preserve alignment between those samples."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 checks illuminated screen pixels from multiple words, speck states and captions against the rounded clipping boundary at 320px and maximum screen width."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": ".bezel.needs retains the solid crimson border. Passing AC4 verifies all four border sides, rounded corners and absence of parent clipping at narrow and wide widths."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": ".bezel .name::before creates an empty circular decoration using --lcd-red; inline-flex centres it before the title. Passing AC5 verifies colour in both themes, dimensions, placement and empty generated content."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The frame and screen now have rounded corners, the frame aligns with the tabs and cards, and a decorative vermilion dot precedes the title. All five targeted tests passed. The existing test updates match the requested design change, and I found no blocking issues or unrelated changes."
  }
}
```

</details>

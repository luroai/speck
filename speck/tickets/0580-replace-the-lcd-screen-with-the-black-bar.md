---
id: "0580"
title: "Replace the LCD screen with the black bar"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0577","0579"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T19:22:31.098Z"
approved: "2026-11-09T19:54:13.245Z"

---
# 0580 · Replace the LCD screen with the black bar

**Status:** 👍 approved

## Problem
The LCD screen at the top of the panel, with its dot-matrix speck, clock and captions, has become decoration: the user finds it pointless now. The redesign keeps only what was liked, its black frame, as a thin dark bar holding speck and the status.

## Outcome
The top of the panel is a thin black bar with speck, the status and the Settings button, instead of the LCD screen.

## Acceptance criteria
1. The top of the panel is a thin dark bar, rounded and inset from the edges, holding speck at about 44 px in its current mood, the status word with the project (for example "Building 4 · speck"), a second line with what's queued, how many need you (in orange) and the base branch, and the Settings button.
2. Pressing the bar's status opens the Pipeline log, as pressing the screen does today.
3. The project menu (0516) stays in the bar, still lists the speck panels running on this machine and still switches between them.
4. The bar looks the same in both looks, keeps its first line on one line on a 320 px wide screen, and stays put while a lane's list scrolls.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Deleting the LCD renderer and its tests (0581).
- The line under the bar for Decided for you (0590).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: the header is `.bezel#bezel` with the title row and `button.glass#run` around `canvas.lcd#screen` in `templates/panel.html`, drawn by `templates/panel-header.js` (`drawScreen`, `screenFrame`, `drawHeader`) with `templates/panel-header.css`; the project menu is `#project-pick` (`drawProjects`, `chooseProject`). The clock, the captions and the one-off animations go with the screen.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: hid the status lines until the first board arrives (they showed their separators alone), added speck-face.js and speck-mood.js to the page's stamp so a change to them makes an open page out of date, and kept the bar drawing when speck's script can't load.

## In plain words
The dot-matrix screen at the top of the panel is gone. In its place is a thin black bar with speck's face, showing its mood, what speck is doing and which project this is. Under that it says what's queued, how many things need you, in orange, and the base branch.

To see it, open the panel in the light and the dark look: the bar is the same in both. Press the status to open the Pipeline log, and use the arrow beside it to switch project when more than one panel is running.

The clock and speck's little animations went with the screen. The old screen's code is still in the product, unused, until the next ticket removes it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 476,079
- Elapsed since build started: 32 min
- Changed lines: 109 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups: none.

Tests updated to the new look (AC5):
- `test/panel-0413`, `0438`, `0454`, `0478`, `0140`, `0150`, `0372`, `0128`, `0059`, `foreman-0285`, `speck-name-0485`: the header's markup, measurements and names are the bar's.
- `test/panel-0426`, `0440`, `0161`, `0428`: the bar's colours are `--bar`, the same in both looks; the status button has no edge of its own, so 0161's control counts are one lower.
- `test/panel-0432`, `0433`, `0473`, `0474`, `0302`: the page also loads `speck-face.js` and `speck-mood.js`.
- `test/panel-0055`, `0160`, `0416`: speck's face moves, and the page has no canvas.
- `test/panel-0147`: Doto's font list went with the title.
- `test/panel-0543`: under a proxy's path it checks the page's files load, not Doto.
- `test/pipeline-0415`, `0470`, `0479`: they wait for the bar's status, and compare the log's title with the bar's lettering.
- `test/panel-0041`, `0134`, `0451`, `panel.test.mjs`: the old title's name and text, the status button's label and the project with its base branch on one line are the bar's now.
- `test/panel-0476`: the thin bar leaves the Shipped list room for all its rows, so the test holds that list short enough to scroll, and still checks its place survives.

Tests removed, because what they checked is gone (AC5):
- `test/panel-0471` (the big "speck" title and its dot), `test/panel-0513` (the title's dot going grey while off: speck's asleep face says that now).
- From `test/panel-0304`: the three about the title in Doto. The test that the panel serves the font stays, for 0581.
- From `test/panel-0438`: AC3 (the screen's dots against its corners) and AC5 (the title's dot).

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
    "reviewed_sha": "a29feccacf1fd94cd623e1803bf7056076524d3b",
    "session": "fresh",
    "thread_id": "01a1c1d2-c084-7c52-bf0e-490336b84d56",
    "builder_response": "- Tests run: test/foreman-0285.test.mjs test/panel-0054.test.mjs test/panel-0055.test.mjs test/panel-0059.test.mjs test/panel-0061.test.mjs test/panel-0063.test.mjs test/panel-0128.test.mjs test/panel-0133.test.mjs test/panel-0140.test.mjs test/panel-0143.test.mjs test/panel-0147.test.mjs test/panel-0150.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0165.test.mjs test/panel-0213.test.mjs test/panel-0302.test.mjs test/panel-0304.test.mjs test/panel-0372.test.mjs test/panel-0413.test.mjs test/panel-0416.test.mjs test/panel-0423.test.mjs test/panel-0424.test.mjs test/panel-0426.test.mjs test/panel-0428.test.mjs test/panel-0432.test.mjs test/panel-0433.test.mjs test/panel-0438.test.mjs test/panel-0440.test.mjs test/panel-0453.test.mjs test/panel-0454.test.mjs test/panel-0465.test.mjs test/panel-0466.test.mjs test/panel-0473.test.mjs test/panel-0474.test.mjs test/panel-0478.test.mjs test/panel-0543.test.mjs test/panel-0580.test.mjs test/panel-focus-0326.test.mjs test/pipeline-0415.test.mjs test/pipeline-0470.test.mjs test/pipeline-0479.test.mjs test/speck-name-0485.test.mjs (with --related, which also ran every test file naming a changed file)\n- Scope note: the LCD renderer and speck's poses stay in panel-header.js and lcd.js until 0581, per the ticket's Out of scope. The real page has no #screen, so drawHeader skips them; the fake page's getElementById always makes a node, so the LCD's own tests keep running until 0581 removes them.\n- AC5: the Delivery log lists each test updated and each removed. Removed tests checked elements this ticket takes out (the Doto title and its dot, the screen's dots).\n- The bar uses 0577's --bar tokens. --bar-needs is new and set once, because --bad differs between the looks.\n- Face script: drawBar copes with SpeckFace missing, which is what pipeline-0415/0470/0479 exercise (their file:// copy of the page can't load it).\n",
    "seconds": 53,
    "usage": {
      "input_tokens": 253980,
      "cached_input_tokens": 196352,
      "cache_write_input_tokens": 0,
      "output_tokens": 757,
      "reasoning_output_tokens": 50
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 57628,
      "cached": 196352,
      "write": 0,
      "output": 757
    },
    "cost_usd": 0.1424612,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T19:40:29.836Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html and drawBar in templates/panel-header.js provide the face, status, project, queue, orange needs-you count, base branch and Settings. panel-0580 tests exercise content and mood changes; its browser test verifies a 44 px face and bar height at most 56 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passed panel-0580 AC2 test presses the status and verifies that the Pipeline log opens and aria-expanded becomes true. Updated panel-0454 browser tests cover pressing the status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawProjects and chooseProject remain in templates/panel-header.js. Passed panel-0580 AC3 test verifies the menu lists running projects, posts the chosen project's port and reloads."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passed panel-0580 AC4 browser test verifies a single first line at 320 px, matching bar colours in both looks, and an unchanged bar position while the lane list scrolls."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The ticket's Delivery log lists updated and removed tests. Changes replace assertions about removed header elements while retaining LCD renderer coverage. The recorded run passed 735 tests, skipped three and failed none."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The LCD screen is replaced by a compact dark bar showing speck, pipeline status and queue details. The Pipeline log, project switcher and Settings remain available. Tests cover the narrow layout, both looks and scrolling, with no failures in the recorded run. No blocking concerns found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "1c10b36be5ae1e2099bc4e8a39a3959123f70b03",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c1d2-c084-7c52-bf0e-490336b84d56",
    "builder_response": "- Tests run: test/docs-0267.test.mjs test/panel-0041.test.mjs test/panel-0134.test.mjs test/panel-0451.test.mjs test/panel-0476.test.mjs test/panel.test.mjs test/panel-0161.test.mjs test/panel-0580.test.mjs\n- Merge: test/panel-0161.test.mjs conflicted (class logic): both sides lowered the full ticket's control count to 7, 0583 for its Close and 0580 for the bar's status. Both changes hold, so it is 6, with both reasons in the comment.\n- Why ship failed: seven tests the whole suite runs, and this ticket's related run did not.\n- 0031, 0033 (test/panel.test.mjs), 0041, 0134, 0451: they read the old header: the project and base branch on one line, the speck title, its static text, and the \"speck's screen\" label. Updated to the bar, as AC5 asks; each still checks what it did (the project and base branch are shown, hover ends away from the chain, no text beyond the bar's separators, no mention of fixing).\n- 0267: not changed. It runs the tests that read documents, and passes now that those pass.\n- 0476 AC3: Shipped's list shows ten rows and, under the 69 px header, they fit, so scrollTop stayed 0 (measured: scrollHeight 546, clientHeight 546). The test now sets that list's max-height to 300 px before scrolling it to 90. The check that the place survives is unchanged. No code change: nothing is wrong with the scrolling.\n- No code outside tests changed in this merge. The Delivery log lists these tests.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 474827,
      "cached_input_tokens": 375296,
      "cache_write_input_tokens": 0,
      "output_tokens": 1252,
      "reasoning_output_tokens": 58
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 41903,
      "cached": 178944,
      "write": 0,
      "output": 495
    },
    "cost_usd": 0.1066504,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T19:54:09.029Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html, panel-header.css and drawBar in panel-header.js retain the thin, rounded, inset bar with the 44 px mood face, status, project, queue details, orange needs-you count, base branch and Settings. All corresponding panel-0580 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The panel-0580 AC2 test passed: pressing the status opens the Pipeline log and updates aria-expanded."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The panel-0580 AC3 test passed: the menu lists running projects, posts the selected project's port and reloads. The merge preserves drawProjects and chooseProject."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The panel-0580 AC4 browser test passed, checking the first line at 320 px, matching colours in both looks and a stationary bar while the lane list scrolls."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the additional test updates. The panel-0161 conflict resolution preserves both changes by lowering the full-ticket control count to six. panel-0476 still verifies actual scroll positions survive navigation, refresh and a pop-up; its height constraint makes the shorter-header fixture scrollable. The recorded run passed 218 tests, skipped three and failed none."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change preserves the compact bar and the newer ticket view. The additional test updates retain their behavioural checks, including scroll-position preservation. All acceptance criteria pass, with no blocking concerns."
  }
}
```

</details>

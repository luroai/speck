---
id: "0413"
title: "Make speck's LCD screen the panel's header"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0410", "0411", "0412"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T14:25:17.773Z"

---
# 0413 · Make speck's LCD screen the panel's header

**Status:** 🔍 reviewing

## Problem
The panel's header is a row of speck's name, the base branch and the Foreman's scrolling notice board. The board is hard to read as it scrolls, and speck, the one thing watching the whole pipeline, has no place of its own on the page.

## Outcome
The top of the panel is speck's LCD screen in its frame, with speck on it, in place of the header row and the notice board.

## Acceptance criteria
1. The top of the panel is speck's screen in its dark frame. The frame's title row shows `speck` in the dot-matrix font on the left, and the project and base branch in small plain text on the right, cut short with an ellipsis when there isn't room. The old header row and the notice board are gone, and the screen stays at the top while a lane's list scrolls.
2. The screen's top row shows the Foreman's status word, the one the notice board starts with today (such as `Off`, `Idle`, `Building 2` or `Needs you 1`), in the screen's dot font, and speck is on the screen below it. While the word is `Needs you <n>`, the frame's edge is in the panel's needs-you colour. There's no text under the screen and no A, B or C button.
3. A Settings button at the right end of the frame's title row opens Settings, as the header's Settings button does today.
4. Pressing the screen, or Enter or Space while it has the focus, opens the Foreman's detail, as pressing the notice board does today. While the panel is running newer code than the page shows, the screen's top row reads `Reload page`, and the Foreman's detail offers its Reload page button as today.
5. At 320 px wide, the screen and its title row fit without the page scrolling sideways. The screen has an accessible name that includes the Foreman's status word.

## Out of scope
- What speck does on the screen as the pipeline changes (0414). Here it stays in its idle animation, with nothing under it.
- Replacing the Foreman's detail with the pipeline log (0415).
- The A, B and C buttons, and the lines of text under the screen in the mock.

## Notes
- Design: console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z, without its keys and the text under the screen. The user asked for this on 2026-10-23.
- The screen is drawn with `templates/lcd.js` (`SpeckLCD.Screen` and `render`), which the panel already loads.
- Removes the notice board (`boardText`, `drawBoard`: 0365, 0374) and the header row (0364, 0373). The Settings button moves from the header (0372, 0396).
- Waits for 0410, 0411 and 0412: all change `templates/panel.html`.
- Failing before this build: none
- Self-check: added tests for a Foreman word too wide for the screen's top row (it scrolls after a pause, or stays cut short with reduced motion) and for "FIXING ON" at the row's right (0317's "Fixing on", which sat beside the old board); raised the frame's small grey text to 7:1 contrast and gave the screen a visible edge in the dark look; dropped a red dot before "speck" so the speck red stays the speck's own (0167).
- Old tests: the notice board's (0365, 0374) and the header row's (0309, 0373) test files are removed, and tests elsewhere that measured the header row, its mark or the board are retired or pointed at the screen. The 0161 contrast checks now check what sits in the frame against the frame's colour.

## In plain words
The top of the panel is now speck's own little LCD screen in a dark frame, in place of the old row with speck's name and the scrolling notice board. The frame's top edge says "speck" on the left, then the project and base branch, with the Settings button at the right. On the screen, the Foreman's status (such as Idle, Building 2 or Needs you 1) sits along the top row, and speck idles underneath. When something needs you, the frame's edge turns the needs-you red. Press the screen, or tab to it and press Enter or Space, to open the Foreman's detail, as the notice board did.

To see it, open the panel: the screen is at the top, in light and dark, and stays there as you scroll a lane. On a phone it fits at 320 px wide.

Worth keeping an eye on: the screen is much taller than the old row, so lists start lower down. A long status, such as "Waiting: the base branch is failing its tests", scrolls across the top row after a short pause, or stays cut short if your computer asks for less motion. With foreman_fixing set to fix, "Fixing on" now shows at the right of the screen's top row.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Skipped as a duplicate: while Settings is open, the keyboard focus can jump from a control to the Settings dialog when the agents' lists arrive and the view is redrawn. This matches 0407's recorded known limit. It made 0150's keyboard test fail on a busy machine, so that test now waits for the lists before focusing the switch.
  - Known limit: speck's screen draws its idle animation on every frame while the page is open, as the cards' badges do, but over a larger screen. Worth watching for CPU use on slow machines. 0414 changes what speck does on the screen.
  - Known limit: under heavy machine load, 0257 AC4-AC5 (a real panel's full settings read within 15 s) timed out once in this build. That read starts the agent tools to list their models. This ticket didn't change it.

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
    "reviewed_sha": "361000d73c2a9b243e8e920384b0788d01b62b68",
    "session": "fresh",
    "thread_id": "01a1693a-b949-7492-b5f4-1ffc48637172",
    "builder_response": "- Tests run: test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/logo-0320.test.mjs test/panel-0041.test.mjs test/panel-0059.test.mjs test/panel-0127.test.mjs test/panel-0128.test.mjs test/panel-0140.test.mjs test/panel-0144.test.mjs test/panel-0150.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0163.test.mjs test/panel-0167.test.mjs test/panel-0170.test.mjs test/panel-0187.test.mjs test/panel-0257.test.mjs test/panel-0303.test.mjs test/panel-0304.test.mjs test/panel-0364.test.mjs test/panel-0372.test.mjs test/panel-0413.test.mjs test/panel.test.mjs \n- Note for the reviewer: this ticket removes the notice board (0365, 0374) and the one-row header (0364, 0373), as its Notes say. Their test files (panel-0365, panel-0374, panel-0309, panel-0373, support/board.mjs) are removed, and tests elsewhere that measured the old header row, its mark or the board are retired or pointed at the screen; each change carries a 0413 comment. The 0161 contrast checks now treat rules under .bezel as sitting on --bezel (the frame's colour) rather than the page's surfaces.\n- \"Fixing on\" (0317), which sat beside the board, is now drawn at the right of the screen's top row and in the screen's accessible name.\n- I wrote the code before the tests here; I checked that the new tests fail against the old page (9 of 10 failed; the \"no text under the screen\" one held before too).\n- In one wider run of 93 test files at once, two browser tests (0150's Settings switch keyboard test and 0257 AC4-AC5) failed on timing; each passed three times out of three when run on its own, and both pass in the run above.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 246687,
      "cached_input_tokens": 158720,
      "cache_write_input_tokens": 0,
      "output_tokens": 841,
      "reasoning_output_tokens": 67
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T14:47:29.080Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html replaces the header with .bezel, .print and .glass. Passing panel-0413 tests check the title, font, ellipsis, removal of the old board and stationary header while the lane scrolls."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawScreen and screenFrame use the LCD renderer and idle Cast. Passing panel-0413 tests verify status pixels, needs-you border transitions, idle drawing and absence of extra text or buttons."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Settings button ends .print and retains its existing handler. The passing '0413 AC3' test presses it and verifies the settings request and open view."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The screen remains a native button with the existing Foreman click handler. Passing fake-page tests cover detail and stale-page behaviour; the passing browser test exercises Enter and Space."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing 320 px browser test measures the frame and title parts within the viewport and checks no sideways overflow. Passing accessible-name tests verify each status word in aria-label."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "templates/panel.html",
        "issue": "The zoomed() resolution-change handler resizes builder badges but omits the new header LCD. Moving the page between displays with different pixel densities can leave its canvas at the old resolution until its layout width changes.",
        "suggested_fix": "Call screen.lcd.size() when present in the resolution-change handler.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The LCD header meets all five criteria, including phone layout, keyboard access, Settings and reload behaviour. The reported run passed 374 tests with three skipped. The replacement tests exercise the new behaviour honestly. One minor display-density resizing omission remains."
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
    "reviewed_sha": "8dc9b30bdee2f8bf012b594dd4d12894077f16e5",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1693a-b949-7492-b5f4-1ffc48637172",
    "builder_response": "- Tests run: test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/logo-0320.test.mjs test/panel-0041.test.mjs test/panel-0059.test.mjs test/panel-0127.test.mjs test/panel-0128.test.mjs test/panel-0140.test.mjs test/panel-0144.test.mjs test/panel-0150.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0163.test.mjs test/panel-0167.test.mjs test/panel-0170.test.mjs test/panel-0187.test.mjs test/panel-0257.test.mjs test/panel-0303.test.mjs test/panel-0304.test.mjs test/panel-0364.test.mjs test/panel-0372.test.mjs test/panel-0413.test.mjs test/panel.test.mjs \n- F1: fixed. The resolution-change handler (zoomed) now calls screen.lcd.size() as well as each badge's, in templates/panel.html; test/panel-0413.test.mjs has a test that a change of resolution resizes speck's screen.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 522441,
      "cached_input_tokens": 428416,
      "cache_write_input_tokens": 0,
      "output_tokens": 1539,
      "reasoning_output_tokens": 135
    },
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-23T14:48:49.383Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains the framed LCD, dot-matrix title and ellipsised project/base text. Passing panel-0413 tests cover removal of the old header and stationary positioning during lane scrolling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawScreen and screenFrame retain the Foreman's word, idle animation and needs-you border. Corresponding panel-0413 drawing, border-transition and absent-controls tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The title-row Settings button retains openSettings. The passing 0413 AC3 test verifies its placement, settings request and opened view."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0413 tests cover pressing the screen, Enter and Space in a browser, and Reload page text and detail button when stale."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing 320 px browser test verifies viewport fit without sideways scrolling. Accessible-name tests verify inclusion of each Foreman status."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "templates/panel.html",
        "issue": "The resolution-change handler previously omitted resizing the header LCD.",
        "suggested_fix": "Completed: zoomed() now calls screen.lcd.size() when present, and the new passing test invokes the resolution listener and verifies that call.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The LCD header meets all five criteria, and the display-density resizing omission is fixed. All ticket-specific tests pass. The latest run has one Settings focus-test failure, matching the intermittent failure reported in round one; the resize change does not affect that path."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "141987a8998e41a5020f7780a9e4fcab386ffb1e",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1693a-b949-7492-b5f4-1ffc48637172",
    "builder_response": "- Tests run: test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/logo-0320.test.mjs test/panel-0041.test.mjs test/panel-0059.test.mjs test/panel-0127.test.mjs test/panel-0128.test.mjs test/panel-0140.test.mjs test/panel-0144.test.mjs test/panel-0150.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0163.test.mjs test/panel-0167.test.mjs test/panel-0170.test.mjs test/panel-0187.test.mjs test/panel-0257.test.mjs test/panel-0303.test.mjs test/panel-0304.test.mjs test/panel-0364.test.mjs test/panel-0372.test.mjs test/panel-0413.test.mjs test/panel.test.mjs \n- Round 2's test output had one failure, 0150's Settings switch keyboard test, and I started that round without stopping on it, which I shouldn't have. Since then:\n  - Cause: with focus put on the switch, a page refresh later found the focus on the Settings dialog itself. The test waited only for Settings' quick first draw (0407). When the agents' lists arrive a moment later, the redraw moves the focus to the dialog. A slow lists read on a busy machine (load 7 to 8.5 here, with other builds running) lets that happen after the test focused the switch. It isn't from this ticket's code: holding speck's screen still made no difference.\n  - Change: test/panel-0150.test.mjs now also waits for \"Loading your agents\" to go before it focuses the switch, with a comment saying why. What it checks is unchanged: the switch keeps focus through refreshes, and Enter and Space work it. It has passed in every run since (4 runs of these files).\n  - In one of those runs, 0257 AC4-AC5 (a real panel's GET /api/settings within 15 s) timed out. That's server code this ticket doesn't change, and the read starts the agent CLIs to list their models. The run above passed in full.\n- Nothing else changed since round 2.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 717895,
      "cached_input_tokens": 618496,
      "cache_write_input_tokens": 0,
      "output_tokens": 2137,
      "reasoning_output_tokens": 135
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T14:59:24.062Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains the dark LCD frame, dot-matrix title, ellipsised project/base text and removal of the old board. Passing panel-0413 tests cover these and stationary positioning while the lane scrolls."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawScreen and screenFrame show the Foreman's status above the idle animation. Passing panel-0413 tests verify rendered dots, needs-you border transitions and absence of extra text or buttons."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Settings button ends the frame's title row and retains openSettings. The passing 0413 AC3 test verifies its placement, request and opened view."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0413 tests exercise screen activation, Enter and Space in a browser, and stale-page status with the Reload page button in the detail."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing 320 px browser test checks viewport fit without sideways scrolling. Accessible-name tests verify that the screen's name includes each status word."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "templates/panel.html",
        "issue": "The resolution-change handler previously omitted resizing the header LCD.",
        "suggested_fix": "Completed: zoomed() calls screen.lcd.size() when present, with a passing test exercising the resolution listener.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The LCD header meets all five criteria. The Settings test now waits for initial loading to finish and retains its focus and keyboard assertions. The latest run passed 375 tests, with three skipped and no failures. No open findings remain."
  }
}
```

</details>

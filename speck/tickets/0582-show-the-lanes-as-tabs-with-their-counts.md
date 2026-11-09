---
id: "0582"
title: "Show the lanes as tabs with their counts"                # one outcome, no "and"
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
after: ["0580"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T20:00:43.162Z"

---
# 0582 · Show the lanes as tabs with their counts

**Status:** 🔍 reviewing

## Problem
The lane strip is a row of small marks that the user has found hard to read (an inbox note asked to mark the lane in view more clearly). The redesign shows the four lanes as clear tabs with their counts.

## Outcome
The lanes are shown as four tabs with their counts, and the open one is plain to see.

## Acceptance criteria
1. Under the bar, four tabs, Capture, Plan, Build and Shipped, each show their lane's name and how many it holds; the open lane's tab is underlined in the accent colour and its name is in the text colour, the others muted. Each tab is at least 44 px tall.
2. Pressing a tab opens its lane, and swiping, the trackpad and the arrow keys still change lane as they do today, moving the underline with them.
3. The tabs are a tab list to a screen reader, with the open one marked as selected.
4. The counts change as the board does.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What each lane's rows look like (0585, 0586, 0587).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `nav.tabs#tabs` in `templates/panel.html`, drawn by `openTab` and `drawTabs` in `templates/panel-header.js`, with the swipe code beside them (`placeLanes`, `slideFrom`, `stepLane`), styled in `templates/panel-header.css`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: at 320 px the names were cut short with real counts, so the row's padding and the count's size came down, with a real-browser test at that width; tabs that touched took a press meant for a neighbour, so they keep a 2 px gap.
- Build's red needs-you number stays after its count: the ticket doesn't ask to remove it and its tests still hold. The bar has said the same since 0580, so it may be worth dropping.

## In plain words
The small row of lane names under the bar is now four clear tabs: Capture, Plan, Build and Shipped, each with how many it holds. The open tab has a coloured underline and its name stands out, and the counts keep up as work moves through. Press a tab, swipe or use the arrow keys, and the underline moves with you.

To see it, open the panel and change lanes. Worth a look: Build can show two numbers, its count and the red number of tickets that need you. There's a note in the inbox suggesting the red one goes, since the bar already says it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Tests updated for the new look (AC5): `test/panel-0410.test.mjs` (Plan's tab now has a count), `test/panel-0425.test.mjs` (tab contents, Build's accessible name), `test/panel-0477.test.mjs` (strip height, open tab's border, accessible name, real-browser height), `test/panel-0481.test.mjs` (the bar is under the whole tab in the accent), `test/panel-0135.test.mjs` (each tab's children).

Follow-ups: `speck/ideas/2026-11-09-drop-build-s-needs-you-number-from-its-tab.md`. Skipped as a duplicate: the 0517 AC3 timing test failing under load, already in `speck/ideas/2026-11-08-steady-the-0517-ac3-frame-time-test-under-load.md`.

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
    "reviewed_sha": "ad7673f32dd3786036a5fbc4a58b66238c8fc54b",
    "session": "fresh",
    "thread_id": "01a1c1f8-ed38-7fe0-96d5-eee62dfde850",
    "builder_response": "- Tests run: test/panel-0582.test.mjs test/panel-0054.test.mjs test/panel-0067.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0140.test.mjs test/panel-0161.test.mjs test/panel-0162.test.mjs test/panel-0165.test.mjs test/panel-0213.test.mjs test/panel-0410.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0425.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0440.test.mjs test/panel-0449.test.mjs test/panel-0453.test.mjs test/panel-0465.test.mjs test/panel-0467.test.mjs test/panel-0469.test.mjs test/panel-0474.test.mjs test/panel-0476.test.mjs test/panel-0477.test.mjs test/panel-0478.test.mjs test/panel-0480.test.mjs test/panel-0481.test.mjs test/panel-0514.test.mjs test/panel-0517.test.mjs test/panel-0520.test.mjs test/panel-0537.test.mjs test/panel-0582.test.mjs test/panel.test.mjs test/speck-name-0485.test.mjs  (with --related, which also ran the existing test files naming the changed templates).\n- Result: 571 pass, 1 fail. The failure is test/panel-0517.test.mjs \"0517 AC3\" (a slide's first frame within 50 ms), a real-browser timing test, run here alongside the other files on a machine at load average 28-35 with other builds going. It is not listed as failing before this build. It passed 6 of 6 alternating with the same 6 runs on the code from before this change, each alone. Those runs show it passes on both when run alone, not that the two are equally slow under load. The change adds four text writes and four attribute writes to drawTabs and doesn't touch the slide code.\n- Existing tests changed because they checked the old look (AC5, listed in the Delivery log): panel-0410, 0425, 0477, 0481, 0135. The one assertion loosened in meaning: 0477's \"at most 32 px\" strip, now at most 45 px (44 px tabs plus the strip's edge), and its no-border check on the open tab, now no background only, as AC1 asks for an underline.\n- Decision to check: Build's red needs-you number stays after the new count. AC1 doesn't ask to remove it and 0425/0474 still cover it.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 113548,
      "cached_input_tokens": 82688,
      "cache_write_input_tokens": 0,
      "output_tokens": 767,
      "reasoning_output_tokens": 80
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 30860,
      "cached": 82688,
      "write": 0,
      "output": 767
    },
    "cost_usd": 0.0776588,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-09T20:21:46.476Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.css defines 44 px minimum-height tabs, muted inactive names and an accent underline. panel-0582 AC1 tests passed, including the real-browser check at 320 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "openTab and drawTabs in templates/panel-header.js keep selection synchronised with lane changes. Passing panel-0582 AC2 tests exercise clicks, swipe, trackpad and arrow keys."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html retains tablist/tab roles; drawTabs sets aria-selected and descriptive accessible names. Passing panel-0582 AC3 tests exercise these."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render passes the current board model to drawTabs, which updates all four counts. Passing panel-0582 AC4 tests exercise board refreshes and preservation across lane changes."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The Delivery log lists all five updated test files, and their changes reflect the requested appearance. However, the submitted run failed panel-0517 AC3, which was not listed as failing before this build. Separate successful runs do not resolve that submitted regression result."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0517.test.mjs",
        "issue": "The submitted verification run fails the existing slide responsiveness test: its first frame took 111 ms against a 50 ms limit. Machine load is a plausible explanation, but the evidence does not establish that this failure is independent of the change.",
        "suggested_fix": "Rerun the required review files, including panel-0517, under suitable conditions and submit the fresh result. If the failure persists, investigate its cause without weakening the existing responsiveness assertion.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The four tabs show live counts, clearly mark the open lane and preserve navigation and screen-reader support. Their tests cover the requested behaviour. Approval is held pending a clean verification run because an existing slide responsiveness test failed."
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
    "reviewed_sha": "8ad3751bdee3391798c470f52e6da281e1394385",
    "session": "continued",
    "thread_id": "01a1c1f8-ed38-7fe0-96d5-eee62dfde850",
    "builder_response": "- Tests run: test/panel-0582.test.mjs test/panel-0054.test.mjs test/panel-0067.test.mjs test/panel-0134.test.mjs test/panel-0135.test.mjs test/panel-0140.test.mjs test/panel-0161.test.mjs test/panel-0162.test.mjs test/panel-0165.test.mjs test/panel-0213.test.mjs test/panel-0410.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0425.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0440.test.mjs test/panel-0449.test.mjs test/panel-0453.test.mjs test/panel-0465.test.mjs test/panel-0467.test.mjs test/panel-0469.test.mjs test/panel-0474.test.mjs test/panel-0476.test.mjs test/panel-0477.test.mjs test/panel-0478.test.mjs test/panel-0480.test.mjs test/panel-0481.test.mjs test/panel-0514.test.mjs test/panel-0520.test.mjs test/panel-0537.test.mjs test/panel-0582.test.mjs test/panel.test.mjs test/speck-name-0485.test.mjs , then test/panel-0517.test.mjs in a run of its own. The attached output is the first run and that one, joined. Both passed: 425 pass and 0 fail, then panel-0517 with 0 fail, its first and only attempt after the first run (load average about 12).\n- F1: no code changed. The 0517 AC3 timing test is the only one that failed, and it passes when it isn't competing with 33 other files on a loaded machine. The code it measures, the slide, is unchanged; this ticket adds only eight writes to drawTabs, which the slide doesn't wait on. I haven't shown it can't ever be slower under load, but a clean run of it is attached as asked.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 205890,
      "cached_input_tokens": 170880,
      "cache_write_input_tokens": 0,
      "output_tokens": 1339,
      "reasoning_output_tokens": 80
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4150,
      "cached": 88192,
      "write": 0,
      "output": 572
    },
    "cost_usd": 0.0228392,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T20:22:59.574Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.html provides the four named tabs and count elements. panel-header.css sets the accent underline, selected text colour, muted inactive colour and 44 px minimum height. Passing panel-0582 AC1 tests include a real-browser check at 320 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "openTab and drawTabs synchronise lane selection with the underline. Passing panel-0582 AC2 tests exercise tab presses, swiping, trackpad scrolling and arrow keys."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel.html supplies tablist/tab roles; drawTabs updates aria-selected and accessible names. The panel-0582 AC3 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render calls drawTabs(m) with the current board model. Passing panel-0582 AC4 tests verify updated counts after a board refresh and preserved counts when changing lanes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the five existing test files updated for the new appearance. Verified /tmp/speck-0582-tests.txt contains 425 passes and zero failures in the first run, followed by all 11 panel-0517 tests passing, including the previously failing responsiveness test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0517.test.mjs",
        "issue": "The previous verification run failed the existing slide responsiveness test.",
        "suggested_fix": "Provide fresh passing verification, including the existing responsiveness assertion without weakening it.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The four tabs show live lane counts and clearly underline the open lane. Navigation and screen-reader support remain covered. Fresh verification passes, including the previously failing responsiveness test; no blocking concerns remain."
  }
}
```

</details>

---
id: "0477"
title: "Show the lanes in a strip instead of tabs"                # one outcome, no "and"
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
after: ["0476"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T15:30:02.992Z"
approved: "2026-10-24T15:51:23.285Z"
finished: "2026-10-24T15:54:10.971Z"

---
# 0477 · Show the lanes in a strip instead of tabs

**Status:** ✅ done

## Problem
Once the lanes slide as cards (0476), each card names its own lane at its top, so the row of three tabs above them repeats the names and takes room. But you still need to see at a glance which lane you're on, which others there are, and whether Build needs you.

## Outcome
A thin strip under speck's screen shows every lane and which is in view, in place of the tabs.

## Acceptance criteria
1. The Plan, Build and Shipped tabs are gone. In their place, a strip at most 32 px tall under speck's screen shows each lane in order, as its name or a dot for each, with the lane in view marked in the text colour and the others muted.
2. Build's place in the strip shows how many tickets need you, in the colour the tab's number has today, whichever lane is in view, and hides it at none.
3. Pressing a lane in the strip slides to it, as a swipe does. Each is reachable with Tab and pressed with Enter or Space, at least 44 × 44 px to tap, and a screen reader hears it as a tab of the lanes, with the one in view selected.
4. The strip keeps to one row at every width from 320 px, and adding a fourth lane to the row needs no change to the strip's styles, checked in a real browser. No test that passed before this change fails.

## Out of scope
- How the lanes slide (0476).
- More lanes.

## Notes
- Asked for by the user on 2026-10-24: "that also means that the tabs at the top need to be different … the whole pane would be a card, and at the top of the card would be the title."
- Mock-up the user approved on 2026-10-24, with 0476 to 0478 together: https://claude.ai/artifact/3sE9DU2PdnsvR6p1tLNw8j.
- Earlier: 0066 (cancelled: "Changed my mind: keeping the current panel layout") would have swiped between Shaping and Queue, before the tabs. `speck/ideas/done/2026-10-08-speck-board.md` decided the panel isn't a kanban board, as only the two ends of the pipeline are human. This keeps that: one lane in view at a time, a view of the same pipeline, with no dragging cards between lanes.
- Decided by the user on 2026-10-24: the panel stays thin, a phone screen or a side panel beside an agent chat, "a bolt-on thing to the side, not an actual product on its own". A wider window doesn't show more lanes.
- 0457 joined the open tab to the lane under it like a folder's tab; this replaces the tabs, so that look goes too.
- Waits for 0476: both change the header's and the lanes' script and styles. Built for release 0.15.0.
- Failing before this build: none
- Self-check: each lane's 44 px button reaches 6 px past the strip's top and bottom, so the strip is drawn over what's there (z-index 8, under every pop-up and backdrop); checked that only padding and plain text sit in those bands. Squared the buttons' corners, as the shared 8 px button corners made a tap in a corner miss.
- Older tests changed: 0457's file is removed and 0425 AC1 and 0428's open-tab corners test dropped, as they checked the folder-tab look and thirds this replaces; 0410 AC4, 0425 AC2, 0426, 0428 and 0438 now check the strip (the number shows with Build in view, no boxed tabs, the frame lines up with the strip's row).

## In plain words
The three boxed tabs above the lanes are gone. In their place, a thin strip under speck's screen lists Plan, Build and Shipped, with the lane you're looking at in the normal text colour and the others greyed. Tapping a name slides to that lane, as a swipe does. Build's count of things that need you now shows beside its name all the time, not only when you're on another lane.

To see it, open the panel: the strip sits just under speck's screen. Keep an eye on whether the lane you're on stands out enough at a glance, as only its colour marks it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 474,831
- Elapsed since build started: 21 min
- Changed lines: 41 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Mark the lane in view with more than its colour: `speck/ideas/2026-10-24-mark-the-lane-in-view-more-clearly-in-the-strip.md`.
  - Tidy-up: the strip still uses the old `tabs`, `tab` and `tab-name` class names and `tab-*` ids, kept to avoid churn in the many tests that name them.

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
    "reviewed_sha": "9bcfb1cc7e3a6d7b06fc0d4df9867ab2682ab801",
    "session": "fresh",
    "thread_id": "01a16e95-2ba6-7953-bba4-1a1a5bd51bd7",
    "builder_response": "- Tests run: test/panel-0477.test.mjs test/panel-0410.test.mjs test/panel-0425.test.mjs test/panel-0426.test.mjs test/panel-0428.test.mjs test/panel-0438.test.mjs test/panel-0140.test.mjs test/panel-0417.test.mjs test/panel-0469.test.mjs test/panel-0135.test.mjs test/panel-0134.test.mjs test/panel-0418.test.mjs test/panel-0427.test.mjs test/panel-0476.test.mjs test/panel-0162.test.mjs test/panel.test.mjs, with `--related` (which added 0433, 0472, 0473, 0474) and the repo checks.\n- Design: the tabs' markup, ids and roles stay (still a tablist of buttons, so keyboard and screen reader behaviour is unchanged); only their look changes to a 32 px strip of names. Each name is a 44 px tall button, centred in the 32 px strip so it reaches 6 px past each edge; the strip is drawn over those bands (z-index 8, below every backdrop and pop-up). Corners are squared because the shared 8 px button radius made taps in a corner miss.\n- Older tests changed because they checked the look this ticket replaces: test/panel-0457.test.mjs removed (the folder-tab join, which the ticket's Notes say goes); 0425 AC1 (tabs each a third of the row) and 0428's \"open tab's top corners\" test dropped; 0428's boxed-button lists no longer include the tabs; 0410 AC4 and 0425 AC2 now expect Build's number with Build in view (AC2); 0426 no longer expects the open tab on --panel; 0438 lines the frame up with the strip's row rather than its first and last tab.\n- Pictures: four, Build and Plan in view, light and dark looks.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 176285,
      "cached_input_tokens": 123136,
      "cache_write_input_tokens": 0,
      "output_tokens": 735,
      "reasoning_output_tokens": 60
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T15:44:23.829Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.css replaces boxed tabs with a 32 px strip and selected/muted text colours. Passing panel-0477 AC1 and real-browser tests check lane order, appearance and measured height."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-header.js drawTabs() updates Build's count regardless of the open lane; panel-header.css retains --bad. Passing panel-0477 AC2 exercises lane changes, count refreshes and hiding the count when nobody needs attention."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel.html retains native buttons with tab roles and panel associations; drawTabs() maintains aria-selected and openTab() invokes the existing slide. Passing panel-0477 tests check native keyboard-accessible markup, selection, sliding and actual pointer hits across each 44 × 44 px target."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0477 real-browser test measures one-row layouts from 320 px, including an appended fourth lane without style changes. Verified /tmp/speck-0477-tests.txt: 314 passed, zero failed, three skipped; the new browser test ran successfully. Removed assertions cover the explicitly superseded tab appearance."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The compact lane strip works as requested, keeps Build's attention count visible and preserves accessible lane switching. Browser tests confirm the tap targets and narrow layouts, including a fourth lane. No blocking concerns found."
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
    "reviewed_sha": "3a1ce301569b9894f59847b156d0652e0ba74de9",
    "merge": true,
    "session": "continued",
    "thread_id": "01a16e95-2ba6-7953-bba4-1a1a5bd51bd7",
    "builder_response": "- Tests fail together: main was already merged in (`git merge main`: already up to date), so the failures came from this ticket's own change, in tests my first run missed because they don't name the tabs.\n- 0160 AC1 (375 and 1280 px): each lane's 44 px button reached 6 px up past the strip into the header's bottom padding, so a point in the header hit the button. Fixed in templates/panel-header.css: the strip aligns its lanes to its top, and each button keeps its name in the strip's 32 px (12 px bottom padding, border-box) and reaches all 12 extra px downward, over the top of the lane title's 10 px padding, never into the header.\n- 0161 AC1–AC3 (light and dark): the edge-contrast sweep counted the strip's names as boxed controls with no edge. The names are words, as a card's tags are (0419), so the sweep leaves out `.tab`; their text contrast is still checked by the same test's text sweep, which passes. Its default minimum control count drops by the three lanes, 11 to 8.\n- 0453 AC1 AC3: the border sweep leaves out `.tab` (the names have no border by AC1), and no longer expects Plan and Build among the bordered buttons. 0453 AC3 \"the open tab is edged in the text colour\" is removed: it checked the tab look this ticket replaces, as 0457 did.\n- Tests run: test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0453.test.mjs test/panel-0477.test.mjs test/panel-0410.test.mjs test/panel-0425.test.mjs test/panel-0426.test.mjs test/panel-0428.test.mjs test/panel-0438.test.mjs test/panel-0140.test.mjs test/panel-0417.test.mjs test/panel-0469.test.mjs test/panel-0418.test.mjs test/panel-0476.test.mjs, with --related and the repo checks: 255 pass, 0 fail. As an extra check I also ran every other test that sweeps all buttons or probes points on the page (0060, 0063, 0134, 0135, 0137, 0151, 0162, 0165, 0190, 0224, 0277, 0371, 0379, 0427, 0454, panel.test): 170 pass.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 296546,
      "cached_input_tokens": 233856,
      "cache_write_input_tokens": 0,
      "output_tokens": 1265,
      "reasoning_output_tokens": 60
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T15:51:21.038Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-header.css keeps the strip at 32 px with ordered lane names and selected/muted colours. Passing panel-0477 AC1 and browser tests verify appearance and dimensions."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-header.js drawTabs() retains the count on every lane, using --bad and clearing it when no attention is needed. Passing panel-0477 AC2 exercises these behaviours."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Native tab-role buttons retain keyboard activation, panel associations and aria-selected. Passing panel-0477 tests verify switching, sliding and pointer hits across 44 × 44 px targets. The revised CSS extends targets downwards; unchanged panel-0160 header hit tests now pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0477 browser test checks one row from 320 px and a fourth lane without style changes. Verified current test output: 255 passed, zero failed, three skipped. Changes to 0161 and 0453 remove superseded border expectations while retaining text contrast checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The strip meets all four criteria. Its large tap targets now extend below the strip without intercepting presses in the header. The updated tests appropriately remove expectations for the old boxed tabs, and all tests in the review run pass."
  }
}
```

</details>

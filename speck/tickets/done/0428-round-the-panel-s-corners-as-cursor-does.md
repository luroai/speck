---
id: "0428"
title: "Round the panel's corners as Cursor does"                # one outcome, no "and"
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
after: ["0427"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T19:24:44.728Z"
approved: "2026-10-23T19:46:07.618Z"
blocked_at: ""
waited_seconds: 76
finished: "2026-10-23T19:48:37.581Z"

---
# 0428 · Round the panel's corners as Cursor does

**Status:** ✅ done

## Problem
Every corner in the panel is square: `* { border-radius: 0 !important; }` in `templates/panel.html`. Beside Cursor's rounded controls and panels, it looks like a different product.

## Outcome
The panel's controls, cards and pop-ups have rounded corners like Cursor's.

## Acceptance criteria
1. Buttons, inputs, selects, tags, toggles, the priority menu and the open tab's top corners have an 8 px corner radius.
2. Ticket cards, the build log, the stats, Settings' groups and pop-ups (the full ticket, a document, the pipeline log and the questions Settings asks) have a 12 px corner radius.
3. Every button has a visible border on all four sides, at the contrast 0161 sets for a control's edge, including the small Full ticket, Review pack and Stop build buttons on an open ticket, which have only a line under them today, and Plan's Tickets toggle, whose left edge is cut off today. The focus ring follows each control's rounded corners.
4. speck's screen and its frame keep the corners they have.
5. Nothing forces square corners on the whole page any more. The switches' round track and knob stay round.

## Out of scope
- Colours (0426) and fonts (0427).

## Notes
- The user asked for this on 2026-10-23: the panel is used mostly beside Cursor, at work and at home, and should look like part of it.
- Checked 2026-10-23: Cursor publishes no source or docs giving its corner radii, so nothing contradicts the estimate below. 8 px and 12 px are estimated from the user's screenshot of Cursor on 2026-10-23 (its buttons about 8 px, its message bubble and input box about 10–12 px), and the user agreed to them.
- Criterion 3: 0421 left the open card's buttons with only an underline, which the user noticed on 2026-10-23. Plan's first toggle loses its left edge to `margin-left: -.5px` on `.toggle` since the lane's own border went (0418).
- Waits for 0427: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: rounded the tag tip and Settings' explanations 8 px too, as small pop-ups, so none stays square beside the rest. In review, the tabs, Appearance's three choices and the priority menu's numbers were boxed too; only speck's screen, the switches and the linked ids have no box of their own.
- Went with the recommendation: A, keep the window-filling pop-ups square (chosen by the user in the panel, 2026-10-23 19:43 UTC).

## In plain words
The panel's corners are rounded now, to sit better beside Cursor: buttons, boxes, menus and tags are slightly rounded, and ticket cards, the build log, the stats, Settings' groups and Settings' question about unsaved changes more so. The full ticket, a document and the pipeline log fill the window, so they stay square, as you chose. Every button now has a thin outline all round, including the small Full ticket, Review pack and Stop build buttons on an open ticket, and Plan's first toggle no longer loses its left edge. speck's screen and its dark frame stay square.

To see it, open the panel: the Plan, Build and Shipped tabs are now outlined side by side, sharing the line between them, the open one with a darker outline, and Settings' System, Light and Dark are three separate rounded buttons.

Worth a look: the tabs no longer open into the list under them, which the reviewer asked for so every button has an outline on all four sides. On a very narrow phone, Settings' System, Light and Dark buttons sit close together to fit on one line.

## Blocked question
The full ticket, a document and the pipeline log each cover the whole window, edge to edge. This ticket asks for their corners to be rounded 12 px. An earlier ticket (0160) asks that, on a phone's home-screen app, nothing but the full ticket's own empty margin or top line shows behind the status bar. Rounding the full ticket's corners leaves a small sliver of the dimmed page behind showing at each corner of the window, top corners included, so both can't hold. Should these three window-filling pop-ups (A) stay square, with the rest of the rounding as built (Settings' question and the tips stay rounded, as they float over the panel), or (B) be rounded anyway, dropping that part of 0160? I recommend A: their edges are the window's own edges, so rounding them only shows slivers of the page behind and doesn't make them look more like Cursor.

Recommended: A, keep the window-filling pop-ups square
Changes what you'd notice: yes
Clear winner: yes

## Review log
Round 1 (codex): changes requested: F1 The implementation narrows 'every button' to a hand-picked inventory without authorisation in the acceptance criteria.
Round 2 (codex): changes requested.
Round 3 (codex): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,140,082
- Elapsed since build started: 21 min
- Changed lines: 48 (limit 5000)
Follow-ups (Delivery log only, none to the inbox):
- Known limit: at 320 px wide, Appearance's three choices have 1 px side padding to stay on one line with their own borders.
- Beyond the listed pop-ups, the tag tip and Settings' explanations are rounded 8 px, as small pop-ups.

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
    "reviewed_sha": "2405f185c3d7459ec760ed390c089a1376616201",
    "session": "fresh",
    "thread_id": "01a16a3e-50df-7e71-bd5d-9c1118385dc4",
    "builder_response": "- Tests run: test/panel-0428.test.mjs test/panel.test.mjs test/panel-0421.test.mjs test/panel-0161.test.mjs test/panel-0420.test.mjs test/panel-0417.test.mjs test/panel-0140.test.mjs test/panel-0155.test.mjs test/panel-0167.test.mjs test/panel-0427.test.mjs test/panel-0162.test.mjs (plus the commands.checks files)\n- Changed existing tests: test/panel.test.mjs (0031 asserted the forced square corners, which AC5 removes) and test/panel-0421.test.mjs (its browser test asserted the open card's buttons had no box, which AC3 reverses).\n- AC3 scope: \"every button\" is read as every button drawn as a button. Left without a box of their own, as each sits inside a box or isn't drawn as a button: the tabs (the open one has its edge on three sides, as a tab), speck's screen (AC4), the switches (their track is the control), Appearance's three choices and the priority menu's numbers (each inside a bordered box) and the linked ids (words). The Settings button in the screen's frame is a button, so it is rounded and boxed; the frame and the screen themselves stay square.\n- Beyond the listed pop-ups, the tag tip and Settings' explanations are rounded 8 px (small pop-ups), so none stays square.\n- Pictures of Plan, Build, Shipped and Settings in both looks are kept for the review pack.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 106571,
      "cached_input_tokens": 71168,
      "cache_write_input_tokens": 0,
      "output_tokens": 865,
      "reasoning_output_tokens": 106
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:31:05.579Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html rounds ordinary controls to 8px, but #settings .looks [role=\"radio\"] explicitly sets button corners to 0 or 7.5px. The AC1 test excludes these buttons from its button inventory and checks only their container."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html assigns 12px to cards, logs, stats, Settings groups and the specified pop-ups. The passing 0428 AC2 test checks these selectors and stats clipping."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The named open-ticket buttons are boxed and .toggle no longer has a negative margin. However, .prio-menu button and Settings' Appearance buttons remain borderless, and .tab retains transparent edges. The passing AC3 test explicitly omits these controls."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html explicitly preserves square corners on .bezel, .bezel .glass and its shade; the passing 0428 AC4 test covers these rules."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The universal forced radius is removed. Existing switch track and knob radii remain 9px and 50%; the passing 0428 AC5 test checks all three facts."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html; test/panel-0428.test.mjs",
        "issue": "The implementation narrows 'every button' to a hand-picked inventory without authorisation in the acceptance criteria. Appearance choices and priority-menu buttons remain borderless, tabs lack four visible edges, and Appearance buttons also lack the required 8px corners. The tests exclude these cases, so their passing results do not establish AC1 or AC3. The screen has an explicit exception in AC4; the other exclusions do not.",
        "suggested_fix": "Apply the required rounding and visible borders to the remaining buttons, preserving AC4's screen exception and AC1's specified tab corners. Extend the tests to cover those controls. If the grouped controls and tabs should instead be exceptions, obtain an explicit ticket clarification from the owner.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main controls, cards and pop-ups are rounded, and the small ticket buttons and Plan toggle borders are fixed. However, several buttons were excluded from the agreed requirements and from the tests. Those gaps need fixing or explicit owner agreement before approval."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "bcac2d61d0425e07afdf2764dfd042d4f1795f96",
    "session": "continued",
    "thread_id": "01a16a3e-50df-7e71-bd5d-9c1118385dc4",
    "builder_response": "- Tests run: test/panel-0428.test.mjs test/panel.test.mjs test/panel-0421.test.mjs test/panel-0161.test.mjs test/panel-0420.test.mjs test/panel-0417.test.mjs test/panel-0140.test.mjs test/panel-0155.test.mjs test/panel-0167.test.mjs test/panel-0427.test.mjs test/panel-0162.test.mjs test/settings-0412.test.mjs test/panel-0426.test.mjs test/panel-0273.test.mjs test/panel-0385.test.mjs (plus the commands.checks files)\n- F1: fixed in part, disputed in part.\n  - Appearance's choices: fixed. Each of System, Light and Dark is now its own button with a .5px --line border on all four sides (1px below 2 dppx, as before) and the 8px radius from the generic button rule; the chosen one's border is --text, its fill. The shared box and the separators are gone, with a 4px gap between them (2px under 700px, and 1px side padding there so the row still fits at 320px: settings-0412's 320px browser test passes). The 0/7.5px overrides are removed.\n  - The priority menu's numbers: fixed. Each is boxed (.5px --line border, --text when hovered or chosen) with the 8px radius, the menu padded 2px with 2px gaps.\n  - Both are added to the test's button inventory (AC1 radius and AC3 four sides), so test/panel-0428.test.mjs now covers them.\n  - The tabs: disputed. AC1 gives the tabs their own shape, \"the open tab's top corners have an 8 px corner radius\": a tab whose bottom corners stay square because its bottom joins the lane under it. A border on all four sides would cut the open tab off from its lane, which is what makes it read as the open tab, and contradict AC1's own wording. The open tab has its --line edge on top, left and right and a --panel bottom joining the lane; the AC1 tab test now checks exactly that. The closed tabs are the tab row's labels over the lane's line, as they were. The other exclusions left are speck's screen (AC4), the switches (their round track is the control, AC5) and the linked ids (inline words in a sentence).\n- Pictures retaken, with Settings at 320px added.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 214736,
      "cached_input_tokens": 170368,
      "cache_write_input_tokens": 0,
      "output_tokens": 1453,
      "reasoning_output_tokens": 106
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:34:20.492Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html now gives Appearance and priority-menu buttons the generic 8px radius without overrides. The passing AC1 tests cover both inventories and the tabs' 8px top corners."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The 12px rules for cards, build log, stats, Settings groups and specified pop-ups remain intact; the passing AC2 test covers these selectors."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Appearance and priority-menu buttons now have four visible borders and are tested. However, .tab still sets transparent edges, and the selected tab hides its bottom edge with --panel. The AC3 test excludes tabs; its new AC1 assertions explicitly preserve the missing bottom edge."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Explicit zero radii preserve .bezel, .bezel .glass and its shade. The AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The universal radius override remains removed, with switch tracks at 9px and knobs at 50%. The AC5 test passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html; test/panel-0428.test.mjs",
        "issue": "The Appearance and priority-menu portions are fixed, but the tab exception remains unsupported. AC1 specifies corner radii; square bottom corners do not prevent a visible bottom border. It therefore does not contradict AC3's requirement for four visible edges. Closed tabs also retain transparent edges. The test still excludes tabs from AC3.",
        "suggested_fix": "Give tabs the four visible edges required by AC3 while retaining AC1's top corner radii, and test their selected and unselected states. Alternatively, obtain an explicit owner clarification exempting tabs from AC3.",
        "state": "dispute_rejected"
      }
    ],
    "escalation_question": "",
    "summary": "Appearance choices and priority buttons now meet the rounding and border requirements. The remaining issue is the tabs: their borders still do not meet the requirement for four visible edges. The reported tests pass, but explicitly exclude tabs from that check."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b48c3206d5aa8c954e39a7c4d8e5394d14bc6e7e",
    "session": "continued",
    "thread_id": "01a16a3e-50df-7e71-bd5d-9c1118385dc4",
    "builder_response": "- Tests run: test/panel-0428.test.mjs test/panel.test.mjs test/panel-0421.test.mjs test/panel-0161.test.mjs test/panel-0420.test.mjs test/panel-0417.test.mjs test/panel-0140.test.mjs test/panel-0155.test.mjs test/panel-0167.test.mjs test/panel-0427.test.mjs test/panel-0162.test.mjs test/settings-0412.test.mjs test/panel-0426.test.mjs test/panel-0273.test.mjs test/panel-0385.test.mjs test/panel-0418.test.mjs test/panel-0135.test.mjs test/panel-0134.test.mjs (plus the commands.checks files)\n- F1: fixed. Every tab now has a .5px --line border on all four sides (no transparent edges, no --panel bottom), with 8px 8px 0 0 corners and a 4px gap between tabs so each shows its own edges. The open tab keeps its --panel fill and text colour, and its border is --text, as Plan's chosen toggle's is, so it still stands out once it no longer joins the lane (in the dark look the fill alone was too close to the page). Both tab states are in the test's button inventory: AC1 checks their radius (8px 8px 0 0) and AC3 their four borders and colours, and a test checks the gap. The remaining exclusions are speck's screen (AC4), the switches (their round track, AC5) and the linked ids.\n- Pictures retaken.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 337438,
      "cached_input_tokens": 285824,
      "cache_write_input_tokens": 0,
      "output_tokens": 1949,
      "reasoning_output_tokens": 106
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:37:32.837Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html gives controls 8px radii and tabs 8px top corners. Passing AC1 tests cover Appearance choices, priority buttons and both tab states."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The specified cards, logs, stats, Settings groups and pop-ups have 12px radii in templates/panel.html. The passing AC2 test checks each selector and stats clipping."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Tabs now have four visible borders, with --line for closed tabs and --text for the selected tab. Both states join the passing AC3 border inventory. Tests also cover boxed ticket buttons, separated Plan toggles and the rounded focus outline."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Explicit zero radii preserve the screen, frame and screen shade. The AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The universal forced square corners are removed; switch tracks retain 9px radii and knobs retain 50%. The AC5 test passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html; test/panel-0428.test.mjs",
        "issue": "Previously excluded Appearance choices, priority buttons and tabs now have the required corners and visible borders, with test coverage.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel now has the requested rounded controls, cards and pop-ups, with visible button borders. The screen and frame keep their square corners, and switches stay round. All five criteria pass; the reported tests have no failures. Ready for owner review."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "498127b1c605872da24d0a3cfb401864bd21328d",
    "merge": true,
    "session": "continued",
    "thread_id": "01a16a3e-50df-7e71-bd5d-9c1118385dc4",
    "builder_response": "- Tests run: test/panel-0428.test.mjs test/pack-0362.test.mjs test/panel-0160.test.mjs test/panel-0425.test.mjs test/panel-0423.test.mjs test/panel.test.mjs test/panel-0421.test.mjs test/panel-0161.test.mjs test/panel-0417.test.mjs test/panel-0140.test.mjs test/panel-0426.test.mjs test/panel-0418.test.mjs test/panel-0135.test.mjs test/settings-0412.test.mjs (plus the commands.checks files)\n- Why: speck ship ran the whole suite on the approved branch (main had no newer commits; merging main was already up to date) and three tests failed because of this ticket's change:\n  - 0425 AC1 (each tab a third of the row): the 4px gap between the boxed tabs made each tab 2.67px narrower than a third. Fixed: no gap; `.tab + .tab { margin-left: -.5px }` so two tabs share the edge between them, and the open tab is `position: relative; z-index: 1` so its --text edge shows over its neighbours'. Every tab still has a border on all four sides (AC3). The 0428 test now checks no gap, the shared edge and the z-index instead of the gap.\n  - 0362 AC1 (one rule names #doc-view): the 12px rule listed #doc-view as a second rule.\n  - 0160 AC2 (nothing but the full ticket's margin or top line behind the status bar): the full ticket fills the window, so its rounded corners showed the backdrop at the window's corners. This contradicted AC2's \"pop-ups (the full ticket, a document, the pipeline log …)\". The ticket was blocked and the user chose A: keep the window-filling pop-ups square (recorded in the ticket's Notes). So #full-ticket, #doc-view and #foreman have no radius (which also resolves 0362); Settings' question box keeps 12px. The 0428 AC2 test now checks those three stay square instead of 12px.\n- Pictures retaken.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 474491,
      "cached_input_tokens": 353024,
      "cache_write_input_tokens": 0,
      "output_tokens": 2579,
      "reasoning_output_tokens": 106
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T19:45:58.616Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html retains 8px control radii and 8px tab top corners. Both passing AC1 tests cover these rules; tab widths are also covered by the reported passing 0425 tests."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Cards, logs, stats, Settings groups and the question box retain 12px radii. Window-filling pop-ups stay square under the owner's decision recorded in the ticket Notes. Both AC2 tests pass and cover that clarified requirement."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Tabs retain four coloured borders, sharing adjacent edges; the selected tab's z-index preserves its contrasting edge. Passing AC3 tests cover borders, open-ticket buttons, Plan toggles and focus outlines."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The screen, frame and shade retain explicit zero radii in templates/panel.html; the AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "No universal corner-radius override remains. Switch tracks retain 9px radii and knobs 50%; the AC5 test passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html; test/panel-0428.test.mjs",
        "issue": "The previously missing button borders and radius coverage remain fixed, including both tab states.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "speck/tickets/0428-round-the-panel-s-corners-as-cursor-does.md",
        "issue": "The owner-facing summary still says the big pop-ups are rounded, and the Self-check still lists buttons as unboxed that are now boxed. These passages describe an earlier implementation.",
        "suggested_fix": "Update the summary and Self-check to reflect the final button borders and the owner's decision to keep window-filling pop-ups square.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change meets the requirements as clarified by the owner: controls and cards are rounded, while window-filling pop-ups remain square. Shared tab borders preserve equal tab widths. The reported tests pass. Only stale wording in the ticket summary needs tidying."
  }
}
```

</details>

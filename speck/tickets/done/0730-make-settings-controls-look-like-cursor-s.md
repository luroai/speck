---
id: "0730"
title: "Make Settings' controls look like Cursor's"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0729"]                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T18:50:03.869Z"
approved: "2026-11-24T19:20:37.608Z"
finished: "2026-11-24T21:42:59.534Z"

---
# 0730 · Make Settings' controls look like Cursor's

**Status:** ✅ done

## Problem
Settings uses the browser's plain select boxes and text fields and a black-and-white switch, which look unlike the controls beside them in Cursor: green switches, compact borderless menus reading "Default ⌄", and small rounded buttons.

## Outcome
Settings' switches, menus, boxes and buttons look like Cursor's settings controls.

## Acceptance criteria
1. Every on/off setting in Settings, `auto_ship` and the Auto-build switch included, is a switch whose track is green when on and grey when off, with a white knob, as in Cursor's settings.
2. Every list is a compact menu showing its current value and a small chevron ("Default ⌄"), with no box border until it's hovered or focused, and opens the same choices as today.
3. Text and number boxes, Remove and the other small buttons are small rounded controls in the interface font, with a light border, as Cursor's Open button is.
4. Every control keeps a 44 px target, a visible focus ring for the keyboard, and the same values, refusals and saving as today, in both the light and dark looks.
5. No test that passed before this change fails, except tests that pin the old controls' look, which are changed to check the new one.

## Out of scope
- The layout of rows and groups: the ticket before this one.
- The Save button's place and saving model.

## Notes
- Failing before this build: none (recorded full suite passed). Note: test/tmp-cleanup.test.mjs AC1 AC2 fails on this Node (v24) because the runner prints `ℹ fail 2` rather than TAP `# fail 2`; it fails the same way without this ticket's changes, so it isn't fixed here.
- Self-check: drawToggle reuses the track and knob so flipping a switch doesn't detach row nodes (0370); on/off switches keep class "switch" (not "edit") so they stay borderless with Auto-build's track; value still true/false for Save; select menus stay native for phone pickers with a gradient chevron (no font-file load); --switch kept apart from --green with 3:1 vs --raise in both looks.
- Raised by the user on 2026-11-24 with a screenshot of Cursor's General settings.
- Switches are `[role="switch"]` in `templates/panel-settings.css`; lists are `select` elements built in `templates/panel-settings.js`. Keeping them as native `select` elements, styled, keeps phones' own pickers.
- Green: pick one that meets 3:1 against the track's surroundings in both looks, kept apart from the panel's status green if they would be confused.
- speck (2026-11-24 16:02 UTC) made draft fix ticket 0737: Wait to start dependent builds when approved work conflicts with main. Why: 0730 was launched because 0729 is approved, but its approved branch conflicts with main, so the scheduler needs to wait for that conflict to clear rather than launch a build that cannot start.
- 2026-11-24: its first build stopped before starting, as it began on 0729's approved work while that conflicted with main and the main checkout had been made bare. Set ready again once 0729 shipped.

## In plain words
Settings' on/off controls are now green-and-grey switches with a white knob, including Auto-build and Auto-ship, matching Cursor's own settings. Drop-down lists sit as compact menus with a small chevron and no box until you hover or focus them; text boxes, Remove and the other small buttons are rounded in the same interface font. Values, saving and the 44 px tap targets are unchanged. Open Settings in the panel to see it in both the light and dark looks.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Menus inside settings and agent rows remain bordered and lose their chevron until hovered or focused.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 334,593
- Elapsed since build started: 31 min
- Changed lines: 57 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "09385642e533331d47ef54ea30273a708fe68d89",
    "session": "fresh",
    "thread_id": "01a20efc-aecb-75c1-b31b-b4e2e30ee7ac",
    "builder_response": "- Tests run: test/settings-controls-0730.test.mjs test/panel-0161.test.mjs test/panel-0259.test.mjs test/panel-0273.test.mjs test/panel-0147.test.mjs test/panel-0453.test.mjs test/settings-levels-0666.test.mjs test/settings-same-model-0511.test.mjs (and related checks those files pull in). Only fail is test/tmp-cleanup.test.mjs AC1 AC2, listed as failing before this build on Node 24 (`ℹ fail 2` vs TAP `# fail 2`); left unchanged.\n- Pictures: Appearance/Auto-build/Auto-ship/Same-model switches and the full Settings view, light and dark, in the review pack.\n- On/off settings (true/false choices) are `[role=switch]` with class `switch`, green/grey track and white knob via `--switch` / `--switch-off` / `--switch-knob`, kept apart from status `--green`.\n- Lists stay native `select.edit`, borderless until hover/focus, interface font, gradient chevron (no font-file url).\n- Text/number boxes and small buttons (Remove, Save) are rounded UI-font controls with a light border; 44 px targets and focus rings kept.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 192940,
      "cached_input_tokens": 134912,
      "cache_write_input_tokens": 0,
      "output_tokens": 930,
      "reasoning_output_tokens": 95
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58028,
      "cached": 134912,
      "write": 0,
      "output": 930
    },
    "cost_usd": 0.1388472,
    "saved_at": "2026-11-24T19:16:39.952Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "settingEditor() creates switches for boolean choices; drawToggle() maintains their state. The reported 0730 AC1 tests cover switches, colours in both themes and saving."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "templates/panel-settings.css: #settings .setting .edit and #settings .arow .edit outrank #settings select.edit. Their border and background shorthands override the transparent border and gradient chevron at rest. Native choices remain unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-settings.css gives fields and Remove rounded borders and the interface font. Reported 0730 AC3 and updated 0666 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel-cards.css retains 44 px targets; panel-base.css supplies the focus ring. Reported browser tests and 0259/0511 tests cover both themes, saving, confirmation and refusals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported changed and related tests pass apart from the documented pre-existing Node 24 tmp-cleanup failure. Changes to existing assertions reflect the requested appearance."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.css:120",
        "issue": "Menus inside settings and agent rows remain bordered and lose their chevron until hovered or focused. The more specific general .edit rules override the resting select rule's border colour and background image. The AC2 test checks isolated declarations, so it misses the actual cascade.",
        "suggested_fix": "Give the resting select styles sufficient specificity to override the general field styles. Add a computed-style test for a real settings-row select, checking transparent borders and a visible chevron before hover or focus in both themes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The switches and rounded fields are implemented, and the reported checks preserve saving and confirmation behaviour. One styling conflict prevents menus from getting the requested borderless appearance and chevron at rest. Fix that conflict and test the rendered result before approval."
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
    "reviewed_sha": "bfe27b13b4b52ff69f55ce8e045a13b71ee2cf8d",
    "session": "continued",
    "thread_id": "01a20efc-aecb-75c1-b31b-b4e2e30ee7ac",
    "builder_response": "- Tests run: test/settings-controls-0730.test.mjs test/panel-0161.test.mjs test/panel-0259.test.mjs test/panel-0273.test.mjs test/panel-0147.test.mjs test/panel-0453.test.mjs test/settings-levels-0666.test.mjs test/settings-same-model-0511.test.mjs. Only fail is the documented pre-existing tmp-cleanup Node 24 TAP mismatch.\n- F1: fixed. `#settings .setting select.edit` (and `.arow` / `.levels`) now outranks the general `.edit` fill; longhands keep the gradient chevron. Added a browser computed-style test that checks a real settings-row select for a non-line border colour and a linear-gradient chevron at rest in both looks. Updated 0273 to allow a transparent resting border on menus, as it already allows a transparent background.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 333110,
      "cached_input_tokens": 261376,
      "cache_write_input_tokens": 0,
      "output_tokens": 1483,
      "reasoning_output_tokens": 95
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 13706,
      "cached": 126464,
      "write": 0,
      "output": 553
    },
    "cost_usd": 0.0455884,
    "saved_at": "2026-11-24T19:20:23.862Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "settingEditor() converts boolean choices into switches; panel-settings.css supplies green/grey tracks and white knobs. Reported 0730 AC1 tests pass, including browser checks in both themes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-settings.css now uses sufficiently specific select selectors to preserve transparent resting borders and gradient chevrons, with borders on hover/focus. Native choices remain unchanged. The new computed-style browser test passes in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-settings.css styles fields, Remove and Save with rounded light borders and the interface font. Reported 0730 AC3 and updated 0666 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css retains 44 px targets and panel-base.css retains keyboard focus rings. Reported browser checks and 0259/0511 tests pass for saving, confirmation and refusals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported changed and related tests pass except the documented pre-existing tmp-cleanup Node 24 output mismatch. No new regression is evident in the reviewed changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.css:122",
        "issue": "The resting menu styles previously lost to the general field styles. The revised selectors now override those rules, and a passing browser test checks the resulting border and chevron in both themes.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The menu styling conflict is fixed. Settings now has green switches, borderless menus with chevrons, and rounded fields and buttons while preserving saving and confirmation behaviour. All criteria pass; the only reported test failure is the documented pre-existing Node 24 issue."
  }
}
```

</details>

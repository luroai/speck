---
id: "0396"
title: "Put Appearance and Auto-build at the top of Settings as toggles"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-rehash-the-settings-screen.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0395"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:06:50.742Z"

---
# 0396 · Put Appearance and Auto-build at the top of Settings as toggles

**Status:** 🔍 reviewing

## Problem
Appearance sits at the bottom of Settings as a list with a description, and the Auto-build switch is labelled "speck run" with a description under it. Neither name says plainly what it does, and the descriptions add clutter.

## Outcome
Appearance and Auto-build are toggles at the top of Settings.

## Acceptance criteria
1. Settings opens with Appearance first, then Auto-build, above every other group. Each is a single row with its name and a toggle switch, and no description under it.
2. Appearance's toggle switches between light and dark as it's pressed, shows which look is on, and is kept in this browser as today (0372).
3. Auto-build's toggle turns speck run on and off as today's button does, shows whether it's on, and shows a refusal beside it as today (0368). The label is Auto-build, and "speck run" no longer appears as it. What on and off do is in its info button.
4. Both toggles work from the keyboard and with a screen reader, as switches that say whether they're on, and each fits on one row at 320 px wide.
5. No test that passed before this change fails, except checks of the light/dark list, the Auto-build button's wording and place, and their descriptions, which are changed to check these criteria.

## Out of scope
- The other groups, apart from moving below these two.

## Notes
- Checked 2026-10-23: Settings in `templates/panel.html` shows the Foreman group's "speck run" row with an "Auto-build on" button and a description, and a "Look" group at the end with a light/dark list and "For the panel in this browser…" (0150, 0372).
- The user chose the name Auto-build on 2026-10-23.
- Waits for 0395: both change Settings in `templates/panel.html`.
- Failing before this build: none
- Self-check: kept both switches showing while the settings load (loading asks Codex and Cursor for their models, which can take seconds), giving their rows their own class so the file's settings rows and their checks are unchanged; renamed the rows' classes away from the panel's existing `.toggle` style.

## In plain words
Settings now opens with two switches at the top: Appearance, which flips the panel between light and dark, and Auto-build, which turns automatic building on and off. Each is one line with its name and a switch that says Light or Dark, On or Off, and the longer explanations have moved into the small "i" buttons beside them. To see it, open Settings and press either switch; your light or dark choice is still remembered in this browser. Worth knowing: the Foreman group now appears only once the rest of the settings have loaded, while the two switches are there straight away.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "0e020fba97439cd92cca251dc4e653f0463d8220",
    "session": "fresh",
    "thread_id": "01a16847-0a19-7310-b414-c10b8533eada",
    "builder_response": "- Tests run: test/settings-0396.test.mjs test/foreman-0285.test.mjs test/foreman-fix-0286.test.mjs test/panel-0127.test.mjs test/panel-0128.test.mjs test/panel-0136.test.mjs test/panel-0144.test.mjs test/panel-0150.test.mjs test/panel-0163.test.mjs test/panel-0199.test.mjs test/panel-0372.test.mjs test/panel-0161.test.mjs test/panel-0257.test.mjs test/panel-0268.test.mjs test/panel-0277.test.mjs test/panel-0371.test.mjs test/panel-0385.test.mjs test/panel-0368.test.mjs\n- I also ran every other test file that opens Settings or reads its stylesheet (51 + 15 files); all pass.\n- Existing tests changed under AC5's exception: the Auto-build button's wording ('Auto-build on/off' → the switch's 'On'/'Off', and aria-pressed → aria-checked, which a switch uses instead) in 0127, 0128, 0144, 0150, 0163, 0199 and 0285; Auto-build's place (above the Foreman group, in its own box, which shows once settings load) in 0285 and 0286; the light/dark list (now a switch) in 0136 and 0372. The 0372 \"neither light nor dark\" test now starts from a page whose look is '__proto__' and checks the switch shows light and a press stores only 'dark'.\n- Design notes: both switches are native <button role=\"switch\" aria-checked> kept between redraws (keyboard and focus as before). Appearance's aria-label is \"Dark appearance\" (on = dark), Auto-build's is \"Auto-build\". Each row has an info button like every setting row; Auto-build's holds what On and Off do. The rows use their own class (switch-row) sharing the setting rows' CSS, so the file's settings rows and the checks over them are unchanged. The switches show while the settings are loading too, as the old look list and speck run switch did.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 188163,
      "cached_input_tokens": 135936,
      "cache_write_input_tokens": 0,
      "output_tokens": 745,
      "reasoning_output_tokens": 57
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T10:21:15.651Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html renderSettings() and toggleGroup() place Appearance then Auto-build above all groups, without visible descriptions. Both AC1 tests in test/settings-0396.test.mjs passed, including loading and error states."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chooseLook(), drawLook() and the theme-start script switch and persist the look. AC2 tests passed for both directions, browser storage, reload restoration and refused storage."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "toggleGroup(), drawRunSwitch() and switchRun() preserve start/stop requests and refusal messages, with Auto-build as the label and explanations in its info button. All three AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both controls are native buttons with role=switch, accessible names and aria-checked. Passed browser tests in settings-0396 verify 320 px layout and Appearance keyboard activation; panel-0150 verifies Auto-build activation using Enter and Space."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified recorded test output: 301 passed, zero failed, three unrelated skips. Changed existing assertions cover the permitted switch wording, semantics, placement and replacement of the look list. No unrelated implementation changes in the ticket commit."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Appearance and Auto-build now sit at the top of Settings as accessible switches. Theme choices remain saved in the browser, and Auto-build retains its start, stop and refusal behaviour. The relevant tests passed, including keyboard operation and layout at 320 px. No blocking concerns found."
  }
}
```

</details>

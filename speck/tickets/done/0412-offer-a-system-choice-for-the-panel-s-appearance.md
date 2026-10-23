---
id: "0412"
title: "Offer a System choice for the panel's appearance"                # one outcome, no "and"
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
after: ["0410", "0411"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T14:10:05.627Z"
approved: "2026-10-23T14:22:13.308Z"
finished: "2026-10-23T14:25:08.254Z"

---
# 0412 · Offer a System choice for the panel's appearance

**Status:** ✅ done

## Problem
Appearance in Settings is a light/dark switch. A panel that hasn't been switched follows the computer's light or dark setting, but once you press the switch there's no way back to following it, so a computer that changes look at sunset leaves the panel behind.

## Outcome
Appearance offers System, Light and Dark, and System follows the computer's setting.

## Acceptance criteria
1. Appearance in Settings offers three choices, System, Light and Dark, in that order, and shows which is chosen. In a browser where no look has been chosen, System is chosen.
2. With System chosen, the panel shows the computer's light or dark setting, and switches when that setting changes while the panel is open, without a reload.
3. Choosing Light or Dark switches the panel at once and keeps that look through a reload whatever the computer's setting, as the switch does today. Choosing System after either switches the panel to the computer's setting at once, and a reload keeps System.
4. The choice is kept in this browser only: Save doesn't send it or count it as a change, as today.
5. The control works from the keyboard, a screen reader hears the three choices and which one is chosen, and the Appearance row fits on one line at 320 px wide.

## Out of scope
- The Auto-build switch beside it, which stays as it is.
- Matching the phone's top bar to the look beyond what the look already sets (`speck/ideas/2026-10-13-match-the-phone-s-top-bar-to-the-panel-s-chosen-look.md`).

## Notes
- Today: `lookSwitch` and `drawLook` in `templates/panel.html` (0396), and the `<head>` script that applies `speck-theme` from localStorage before the page is drawn (0136, 0372). With no stored choice it already follows the computer.
- Asked for by the user on 2026-10-23, alongside the tabs (0410).
- Waits for 0410 and 0411: all three change `templates/panel.html`.
- Failing before this build: none
- Self-check: narrowed the three choices' padding and type under 400 px so they fit the control's half of the row at 320 px; moved 0396's Space check from Auto-build to Appearance's Dark so the test doesn't start speck run on the shared panel.
- Superseded tests updated for the three choices: settings-0396 (AC2, AC4), panel-0372, panel-0136 (browser helpers), panel-0257 (the controls it ignores).

## In plain words
Appearance in Settings now has three choices side by side: System, Light and Dark. System is chosen until you pick another, and it makes the panel follow your computer's light or dark setting, switching by itself when the computer changes, for example at sunset. Light and Dark stay put whatever the computer does, and picking System again goes back to following it straight away.

To see it, open Settings and pick each choice in turn; with System chosen, change your computer's light or dark setting and watch the panel follow without reloading. The choice is remembered in this browser only, as before. On a narrow phone screen the three words sit a little closer together so they fit on one line.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 445,122
- Elapsed since build started: 12 min
- Changed lines: 83 (limit 5000)
- Known limit: a choice made in another tab of the same browser applies to this tab on its next reload, not at once (as before).
- Follow-ups: none sent to the inbox.

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
    "reviewed_sha": "69c43f99930a42cc6565af9f4706b3f56bfb3009",
    "session": "fresh",
    "thread_id": "01a1691f-0af5-7552-b179-0ba9d4497766",
    "builder_response": "- Tests run: test/settings-0412.test.mjs test/settings-0396.test.mjs test/panel-0372.test.mjs test/panel-0136.test.mjs test/panel-0257.test.mjs\n- The four existing test files tested the old light/dark switch, which this ticket replaces; their switch-specific assertions are updated to the three choices (see the ticket's Notes). 0412's own tests are in test/settings-0412.test.mjs, two of them in a real browser (live following of the computer's setting, and AC5's 320 px fit and keyboard).\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 159564,
      "cached_input_tokens": 113536,
      "cache_write_input_tokens": 0,
      "output_tokens": 690,
      "reasoning_output_tokens": 13
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T14:17:14.507Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: LOOKS, lookChoice and drawLook provide ordered choices and selected state. Passing 0412 AC1 tests cover default System and existing saved choices."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: theme-start listens for system colour-scheme changes when System is selected. Both the simulated and real-browser 0412 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: chooseLook stores Light/Dark and removes the stored override for System; pickLook applies each immediately. Passing 0412 AC3 tests exercise both overrides, reloads and returning to System."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "chooseLook uses browser localStorage independently of configuration changes. Passing 0412 AC4 tests verify no requests, disabled Save and closing without an unsaved-change prompt."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "lookGroup and drawLook supply named radio semantics, checked states and keyboard navigation. Passing 0412 AC5 tests cover accessibility attributes and real-browser Tab, arrows, Home and Space, plus single-line fit at 320 px."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Appearance now offers System, Light and Dark. System follows the computer immediately, while explicit choices persist in this browser. Tests cover persistence, keyboard access and the narrow layout; the reviewed run passed with no failures. No blocking concerns found."
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
    "reviewed_sha": "c427f9888317a63bd60920bbe84687e1ba3ddfb3",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1691f-0af5-7552-b179-0ba9d4497766",
    "builder_response": "- Tests run: test/panel-0140.test.mjs test/panel-0161.test.mjs test/panel-0273.test.mjs test/settings-0412.test.mjs test/settings-0396.test.mjs test/panel-0372.test.mjs test/panel-0136.test.mjs test/panel-0257.test.mjs\n- Ship's run on the branch merged with main failed three tests: 0140 AC2 (the only width-based media query is under 700 px), 0161 AC3 (no text under 12 px) and 0273 AC4/AC5 (the view keeps to the panel's sizes). Cause: this ticket's own `@media (max-width: 400px)` rule, which set Appearance's choices to 11 px with 3 px padding so they fit at 320 px. Not caused by main's newer changes.\n- Fix: merged main (clean, no conflicts), removed that rule, and instead set the choices' padding to 0 2px inside the existing `max-width: 699.98px` query, keeping 12 px type. The three words take about 122 px of the 128 px control column at 320 px; 0412 AC5's real-browser test still checks they sit inside the control's half of the row on one line.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 283600,
      "cached_input_tokens": 220416,
      "cache_write_input_tokens": 0,
      "output_tokens": 1268,
      "reasoning_output_tokens": 36
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T14:22:09.179Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: LOOKS defines System, Light and Dark in order; lookChoice defaults to System and drawLook marks the selected choice. Both 0412 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: theme-start applies and listens for the computer's colour scheme while System is chosen. Simulated and real-browser 0412 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "chooseLook persists explicit choices and removes the override for System; pickLook applies the choice immediately. Passing 0412 AC3 tests exercise both explicit choices, reloads and returning to System."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "chooseLook keeps appearance in localStorage, outside configuration changes. Passing 0412 AC4 tests verify no server requests, disabled Save and no unsaved-change prompt."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "lookGroup provides named radio semantics and keyboard navigation. The real-browser 0412 AC5 test passed at 320 px with the revised padding and 12 px type. Previously failing 0140, 0161 and 0273 checks also passed without test changes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change meets all five criteria. The narrow-screen fix preserves readable text and the panel's existing layout rules while keeping all three choices on one line. The reviewed test run has no failures, including the checks that previously blocked shipping. No blocking concerns remain."
  }
}
```

</details>

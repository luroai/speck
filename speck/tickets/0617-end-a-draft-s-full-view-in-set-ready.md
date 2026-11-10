---
id: "0617"
title: "End a draft's full view in Set ready"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-end-a-draft-s-full-view-in-set-ready.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0613","0616"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T17:23:49.145Z"
approved: "2026-11-10T17:31:32.450Z"

---
# 0617 · End a draft's full view in Set ready

**Status:** 👍 approved

## Problem
An approved ticket's full view ends in a bar with Ask for changes and Ship, the action it's waiting for. A draft's ends with nothing to do: its Set ready sits at the top with its readiness list, so someone who reads to the end finds no action there.

## Outcome
A draft's full view ends in a bar with Set ready, as an approved ticket's ends in Ship.

## Acceptance criteria
1. A draft's full view has a bar fixed to the bottom with Set ready in the accent colour, which does what the Set ready button does today.
2. When the draft isn't ready to be set ready, the bar's button is disabled and says why in one line, as the readiness list does.
3. The readiness list stays in the view, above the bar.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What Set ready checks.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: the same kind of fixed bar as an approved ticket's.
- From 0583's build. Today: `fullTicket` in `templates/panel-popups.js` and `setReadyButton`, `readiness` in `templates/panel.js`. Waits for 0613 and 0616, which change the same files.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a ticket with a ready check error count but no error messages said "Fix the 1 ready check error above first." with nothing listed above; it now says to fix the ready check without pointing at a list, and a test covers it.

## In plain words
When you open a draft ticket's full view, it now ends in a bar at the bottom of the window with Set ready in the accent colour, just as an approved ticket's view ends in Ship. The ready check list is still near the top, but its button has moved down to the bar. If the draft fails the ready check, the button is greyed out and a short line beside it says why. If the server turns it down, its reason shows there instead. To see it, open any draft from Plan and press Full ticket. Worth a look: a long reason gets cut off on one line, and you can hover over it to read all of it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 AC4 explicitly requires the Delivery log to list the tests changed for the new behaviour, but that section is empty.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 277,797
- Elapsed since build started: 8 min
- Changed lines: 48 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed to check the new behaviour (AC4):
  - `test/panel-0061.test.mjs`: its section helper finds the view's body as its third part, not its last, as a draft's view now ends in the bar.
  - `test/panel-0062.test.mjs`: the body helper likewise; AC2 now finds the pane's Set ready in its bar and none in its readiness list; AC3 finds a refusal in the bar rather than under a button in the list.
  - `test/panel-0063.test.mjs`: its sections helper reads the body as the view's third part.
  - `test/panel-0465.test.mjs`: a draft's view has four parts, the bar after its body.
  - `test/panel-0142.test.mjs` and `test/panel-0424.test.mjs` (found when ship's full run failed): they read the view's body as its third part, not its last.

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
    "reviewed_sha": "a5eb76bde433456eee18922be95ea1ead33f1659",
    "session": "fresh",
    "thread_id": "01a1c682-c6ee-75a3-80fc-4e62b151a72b",
    "builder_response": "- Tests run: test/go-with-0284.test.mjs test/pack-0363.test.mjs test/panel-0051.test.mjs test/panel-0054.test.mjs test/panel-0061.test.mjs test/panel-0062.test.mjs test/panel-0063.test.mjs test/panel-0073.test.mjs test/panel-0077.test.mjs test/panel-0133.test.mjs test/panel-0138.test.mjs test/panel-0140.test.mjs test/panel-0146.test.mjs test/panel-0151.test.mjs test/panel-0161.test.mjs test/panel-0366.test.mjs test/panel-0368.test.mjs test/panel-0417.test.mjs test/panel-0419.test.mjs test/panel-0421.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0453.test.mjs test/panel-0463.test.mjs test/panel-0465.test.mjs test/panel-0467.test.mjs test/panel-0583.test.mjs test/panel-0584.test.mjs test/panel-0612.test.mjs test/panel-0617.test.mjs test/panel.test.mjs test/pull-request-0295.test.mjs test/speck-name-0485.test.mjs  and, via --related, every test file naming a changed file.\n- Tests changed for the new layout (AC4): panel-0061 (section helper: the body is children[2], not last), panel-0062 (paneBody; AC2 Set ready is in the pane's bar, its readiness list has no buttons; AC3 refusal shows in the bar), panel-0063 (sections helper: children[2]), panel-0465 (a draft's view has 4 children: the bar).\n- Pictures: four, light and dark, with and without a ready check error (the error injected into the page's state for the picture).\n- docs/brief.md: one sentence on the draft's bar beside the approved ticket's.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 128368,
      "cached_input_tokens": 81408,
      "cache_write_input_tokens": 0,
      "output_tokens": 730,
      "reasoning_output_tokens": 21
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46960,
      "cached": 81408,
      "write": 0,
      "output": 730
    },
    "cost_usd": 0.1093608,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:30:52.137Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.js fullTicket/readyBar place Set ready last and reuse setReadyButton. panel-popups.css applies the existing sticky bottom-bar layout and accent colour. Passing 0617 AC1 tests cover placement, styling, POST and transition to the queue."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readyBar explains lint errors beside the disabled button; CSS keeps the explanation to one line. Passing 0617 AC2 tests cover one error, multiple errors, missing messages, refusals and refreshed state."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fullTicket retains paneReadiness at the start of the body, before readyBar. Passing '0617 AC3: the readiness list stays in the view, above the bar' exercises this."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The four existing layout test files were appropriately updated. /tmp/speck-0617-tests.txt confirms 1619 passed, zero failed and three skipped. However, the ticket's Delivery log contains only its placeholder and does not list the updated tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0617-end-a-draft-s-full-view-in-set-ready.md",
        "issue": "AC4 explicitly requires the Delivery log to list the tests changed for the new behaviour, but that section is empty. Listing them in the builder response does not fulfil this requirement.",
        "suggested_fix": "Add a Delivery log entry naming panel-0061, panel-0062, panel-0063 and panel-0465 and briefly describing their layout assertion updates.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The draft’s bottom action bar works as requested, with the readiness list retained and passing tests for disabled states and setting ready. Approval is held only because the required list of updated tests is missing from the Delivery log."
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
    "reviewed_sha": "897ebfb3467e9ce5ff39b527d943467ec59ebc34",
    "session": "continued",
    "thread_id": "01a1c682-c6ee-75a3-80fc-4e62b151a72b",
    "builder_response": "- Tests run: none: only the ticket's Delivery log changed since round 1, so round 1's output (/tmp/speck-0617-tests.txt) still stands for this code.\n- F1: fixed. The Delivery log now lists panel-0061, panel-0062, panel-0063 and panel-0465 and what changed in each.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 276506,
      "cached_input_tokens": 226176,
      "cache_write_input_tokens": 0,
      "output_tokens": 1291,
      "reasoning_output_tokens": 21
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 3370,
      "cached": 144768,
      "write": 0,
      "output": 561
    },
    "cost_usd": 0.0268268,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T17:31:25.717Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "fullTicket and readyBar in templates/panel-popups.js retain the bottom Set ready bar and reuse setReadyButton. templates/panel-popups.css supplies sticky bottom positioning and the accent colour. Passing 0617 AC1 tests cover layout rules, posting and transition to the queue."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readyBar supplies the disabled-state explanation; setReadyButton disables on lint errors. Passing 0617 AC2 tests cover single and multiple errors, missing messages, server refusals and refreshed state. CSS keeps readiness explanations on one line."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fullTicket retains paneReadiness in the body above readyBar. The passing 0617 AC3 test verifies the readiness lines remain above the bar."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log now lists panel-0061, panel-0062, panel-0063 and panel-0465 with their assertion updates. The unchanged implementation retains round 1's test result: 1619 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0617-end-a-draft-s-full-view-in-set-ready.md",
        "issue": "The required list of updated tests was missing from the Delivery log.",
        "suggested_fix": "Add a Delivery log entry naming the four updated test files and describing their changes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The draft’s full view now ends with Set ready, explains why it is disabled, and keeps the readiness list above it. The missing Delivery log entry is fixed. All criteria pass, with no remaining blocking findings."
  }
}
```

</details>

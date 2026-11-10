---
id: "0609"
title: "Drop Build's needs-you number from its tab"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-09-drop-build-s-needs-you-number-from-its-tab.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0607"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:01:51.169Z"
approved: "2026-11-10T10:13:12.175Z"

---
# 0609 · Drop Build's needs-you number from its tab

**Status:** 👍 approved

## Problem
The Build tab can read "Build 11 3": the lane's count and, beside it, a red needs-you number, two numbers side by side with only one labelled by its colour. The black bar already says how many need you whichever lane is open, so the second number repeats it and costs width at 320 px.

## Outcome
The Build tab shows only the lane's count, like the other tabs.

## Acceptance criteria
1. The Build tab shows its name and the lane's count only, with no separate needs-you number, whatever needs you.
2. The black bar still says how many need you.
3. A screen reader reads the Build tab as it reads the others: its name and its count.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The bar's own needs-you line.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0582's build, which kept the number as its criteria didn't ask to remove it. Today: `drawTabs` in `templates/panel-header.js`, styled in `templates/panel-header.css`. Waits for 0607, which changes the same stylesheet.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
The Build tab now shows just its name and how many tickets are in the lane, like the other tabs. The red number beside it that said how many things need you is gone: the black bar at the top still says that, whichever lane is open. To see it, open the panel while something needs you: the bar says "N need you", and the Build tab shows only its count. A screen reader now reads Build as "Build, N tickets", without the needs-you part, so anyone using one hears how many need them from the bar.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 AC4 explicitly requires the Delivery log to list the updated tests.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 227,990
- Elapsed since build started: 11 min
- Changed lines: 13 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed to check the new behaviour (AC4):
  - `test/panel-0477.test.mjs`: 0477 AC2 (no number, Build's name and count only) and its real-browser strip test (no longer pins a number on Build).
  - `test/panel-0410.test.mjs`: 0410 AC4 and 0410 AC4 (review F1) now check the bar's needs-you line instead of Build's tab.
  - `test/panel-0474.test.mjs`: 0474 AC1 checks the bar's needs-you line while Build is closed.
  - `test/panel-0425.test.mjs`: both 0425 AC2 tests (Build's tab holds its name and count; its accessible name has no needs-you part).
  - `test/panel-0481.test.mjs`: the real-browser bar test no longer pins or measures a number on Build.
  - `test/panel-0582.test.mjs`: the 320 px real-browser test no longer pins a number on Build; 0582 AC3's Build name is "Build, 4 tickets".
  - `test/panel-0440.test.mjs` (0440 AC1) and `test/panel-0426.test.mjs` (0426 AC3): no longer check the removed `.tab .needs` colour rule.

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
    "reviewed_sha": "245fc378b06d440b49cc2375d8cc8c827102296a",
    "session": "fresh",
    "thread_id": "01a1c4f1-65ef-71a2-801e-95e4e84a5df6",
    "builder_response": "- Tests run: test/panel-0609.test.mjs test/panel-0477.test.mjs test/panel-0410.test.mjs test/panel-0474.test.mjs test/panel-0425.test.mjs test/panel-0481.test.mjs test/panel-0582.test.mjs test/panel-0440.test.mjs test/panel-0426.test.mjs, with --related (27 more files brought in by the changed templates; 351 pass, 3 skipped by 0078 as before).\n- Changed tests (AC4), each now checking the new behaviour: 0477 AC2 and its browser test, 0410 AC4 and AC4 (review F1) (now check the bar's needs-you line), 0474 AC1, 0425 AC2 (both), 0481 browser test, 0582 AC1 browser test and AC3 Build name, 0440 AC1 and 0426 AC3 (the removed `.tab .needs` colour rule).\n- Note: the fake page makes any element asked for by id, so \"no number\" is checked as the HTML having no `build-needs` and the page writing nothing to it.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 141723,
      "cached_input_tokens": 101248,
      "cache_write_input_tokens": 0,
      "output_tokens": 654,
      "reasoning_output_tokens": 12
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 40475,
      "cached": 101248,
      "write": 0,
      "output": 654
    },
    "cost_usd": 0.0976148,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:12:29.676Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.html removes build-needs; drawTabs in templates/panel-header.js retains only lane counts. Both 0609 AC1 tests passed, checking markup and updates across needs-you states and lanes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawBar remains unchanged. The passing 0609 AC2 test checks plural and singular needs-you counts and hiding the line when building."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawTabs now gives every tab the same name-and-count aria-label. Passing 0609 AC3 and revised 0582 AC3 tests exercise this behaviour."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The old tests were updated appropriately, and /tmp/speck-0609-tests.txt records 351 passed, zero failed and three skipped. However, the ticket's Delivery log contains only its placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0609-drop-build-s-needs-you-number-from-its-tab.md",
        "issue": "AC4 explicitly requires the Delivery log to list the updated tests. That list appears in the builder response but is absent from the ticket.",
        "suggested_fix": "Add the changed test files and affected tests from the builder response to the ticket's Delivery log.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The Build tab now shows only its name and lane count, including for screen readers. The black bar still reports what needs attention, and the reported tests pass. Before approval, add the required list of updated tests to the ticket's Delivery log."
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
    "reviewed_sha": "d5fec2ea7048579019e40cb42b4423d471a19f62",
    "session": "continued",
    "thread_id": "01a1c4f1-65ef-71a2-801e-95e4e84a5df6",
    "builder_response": "- Tests run: none re-run this round; only the ticket file changed (Delivery log). /tmp/speck-0609-tests.txt is round 1's run of the same files (351 pass, 0 fail).\n- F1: fixed. The Delivery log now lists each changed test file and the tests in it.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 226864,
      "cached_input_tokens": 183296,
      "cache_write_input_tokens": 0,
      "output_tokens": 1126,
      "reasoning_output_tokens": 12
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 3093,
      "cached": 82048,
      "write": 0,
      "output": 472
    },
    "cost_usd": 0.0191108,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:13:04.100Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html gives Build only its name and lane-count spans; drawTabs in templates/panel-header.js writes only lane counts. Both passing 0609 AC1 tests cover markup and updates across needs-you states and open lanes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawBar remains unchanged. The passing 0609 AC2 test checks singular and plural needs-you counts and hides the line when building."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawTabs sets Build's accessible label using the same name-and-count format as other tabs. Passing 0609 AC3 and revised 0582 AC3 tests exercise this."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log now lists all changed existing test files and affected tests. Implementation and tests are unchanged since round 1, whose output records 351 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0609-drop-build-s-needs-you-number-from-its-tab.md",
        "issue": "The required list of changed tests was missing from the Delivery log; it is now present.",
        "suggested_fix": "No further action required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The Build tab shows only its name and lane count, including for screen readers. The black bar still reports how many need attention. The required test record is now complete, and all reviewed tests passed. Ready for the owner's merge decision."
  }
}
```

</details>

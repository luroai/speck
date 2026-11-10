---
id: "0599"
title: "Keep every closed row to one title line"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T07:42:07.828Z"
approved: "2026-11-10T07:54:03.017Z"
finished: "2026-11-10T07:58:01.936Z"

---
# 0599 · Keep every closed row to one title line

**Status:** ✅ done

## Problem
Since the redesign's compact rows (0585 to 0587), a closed row's title wraps, so rows in the same lane are one or two lines tall depending on how long their titles are. The lanes look uneven, and the user wants every collapsed ticket to look the same.

## Outcome
Every closed row in a lane is the same height: one line of title and one line of details.

## Acceptance criteria
1. In Capture, Plan, Build and Shipped, a closed row's title stays on one line, cut off with an ellipsis when it doesn't fit, and its details line stays on one line, so every closed row in a lane is the same height, at 320 px wide and at 1280 px wide.
2. A cut-off title is shown whole in its tooltip, and a screen reader reads the whole title.
3. An open row, and the ticket's full view, show the whole title, wrapping as needed, as today.
4. The ticket's id stays on the title's line, and each row is still at least 44 px tall.
5. Tests that checked a closed row's title wrapping are changed to check it's cut off on one line instead, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The bridge's cards and project rows (0596).
- Shortening titles themselves.

## Notes
- Asked for 2026-11-10: "I need the tickets to look more uniform when they're collapsed. Some titles are 1 line and some are 2."
- Decided: one line with an ellipsis, as 0434 first did, rather than keeping room for two lines on every row, which would make short titles leave a gap.
- Today the redesign made closed titles wrap in `templates/panel-cards.css`: `.q.row .top .line .title` (0585) and `.item.row .line .title` (0586), with Shipped's rows from 0587; 0434's rule for closed titles sits just above them.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: clipping Plan's details line sideways cut the left edge off the priority's 44 px tap box, so its clip box now takes in the row's padding (checked in 0599's browser test); the open-row title rule now applies only to closed rows, so an open title has no ellipsis left in its style.

## In plain words
Every collapsed row in Capture, Plan, Build and Shipped is now the same height: one line of title and one line of details. A title too long for the row ends in "…", and hovering over it shows the whole title; a screen reader still reads it in full. Opening a row in Capture or Plan, or opening a ticket's full view, still shows the whole title over as many lines as it needs.

To see it, open the panel on a phone or in a narrow window and look at any lane with a long title in it: the rows line up evenly. Worth keeping an eye on: a long details line, such as a queued ticket waiting on many others, is now cut off too, so the end of it shows only once you open the ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 AC5 explicitly requires the Delivery log to list the updated wrapping tests.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 219,333
- Elapsed since build started: 12 min
- Changed lines: 20 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Tests changed from checking a closed row's title wrapping to checking it's cut off on one line (AC5):
- test/panel-0585.test.mjs: 0585 AC4 (Build row at 320 px)
- test/panel-0586.test.mjs: 0586 AC4 (Plan and Capture rows at 320 px)
- test/panel-0587.test.mjs: 0587 AC4 (Shipped rows at 320 px)
- test/panel-0434.test.mjs: 0434 AC4 (the title rules) and both 0434 AC5 tests (Build rows at 390 px)
- test/panel-0468.test.mjs: the four 0468 AC3 tests (a Plan row's title beside its chip)
- test/panel-0155.test.mjs: 0155 AC3, both sets (a Build row's title on one line, and the longest title)
- test/panel-0419.test.mjs: 0419 AC1, AC2 and AC5 (0702's long title, and 0707's details line now one line too)
- test/panel-0420.test.mjs: 0420 AC1, AC2, AC3 and AC5 (0407's long Shipped title)
- test/panel-0435.test.mjs: both 0435 AC5 tests (a long Capture title)
- test/panel-0441.test.mjs: 0441 AC2, which read 0155's test for its old line limits on Build titles

Follow-ups:
- A cut-off details line in Build or Plan has no tooltip with its whole text (inbox: speck/ideas/2026-11-10-show-a-cut-off-details-line-whole-in-its-tooltip.md).

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
    "reviewed_sha": "7926a9ecece719b4d7a5db2e25439d2aca418329",
    "session": "fresh",
    "thread_id": "01a1c471-b6d9-73d3-8138-0d8f3fb9a0fd",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0599.test.mjs and the existing test files this ticket changed (panel-0585, 0586, 0587, 0434, 0468, 0155, 0419, 0420, 0435, 0441), plus panel-0151, 0214, 0164 and 0234, which measure or read the same titles. --related added the files naming a changed file. Before that I ran every test file that uses a real browser or reads the styles (145 files), and all passed after the updates.\n- AC5: tests changed from \"a closed title wraps\" to \"cut off on one line\": 0585 AC4, 0586 AC4, 0587 AC4, 0434 AC4 and AC5, 0468 AC3, 0155 AC3 (both), 0419 AC1/AC2/AC5 (0702's title and 0707's details), 0420 AC1–AC5 (0407), 0435 AC5, and 0441 AC2 (which reads 0155's source for the old line limits). I'll list them in the Delivery log at close.\n- Pictures: the four lanes at 390 px in both looks are in the review pack.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 117615,
      "cached_input_tokens": 71680,
      "cache_write_input_tokens": 0,
      "output_tokens": 877,
      "reasoning_output_tokens": 109
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45935,
      "cached": 71680,
      "write": 0,
      "output": 877
    },
    "cost_usd": 0.107808,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T07:53:07.763Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css applies single-line truncation to closed titles and details. Passing test '0599 AC1, AC3, AC4' measures all four lanes at 320 and 1280 px, including equal row heights."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.js uses titled() for titles in every lane, including queueRow(). Passing '0599 AC2' checks full title text and tooltip; CSS clipping preserves the accessible text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing '0599 AC1, AC3, AC4' opens Capture and Plan rows and a Build ticket's full view, verifying that long titles wrap without clipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing '0599 AC1, AC3, AC4' checks id alignment and minimum 44 px height in both viewport sizes, plus the Plan priority control's tap area."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "Existing wrapping assertions were updated, and /tmp/speck-0599-tests.txt records 339 passes, zero failures and three skips. However, the ticket's Delivery log contains only its placeholder, with no list of changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0599-keep-every-closed-row-to-one-title-line.md",
        "issue": "AC5 explicitly requires the Delivery log to list the updated wrapping tests. That list exists only in the builder response; the Delivery log is empty.",
        "suggested_fix": "Add the changed test files and affected tests to the Delivery log before requesting approval.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The row changes work in all four lanes at narrow and wide widths, and full titles remain available. The reviewed tests pass. Approval is held only because the required list of updated tests is missing from the ticket's Delivery log."
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
    "reviewed_sha": "7c72650e2c7061521a17d443264f26d0dcf32e57",
    "session": "continued",
    "thread_id": "01a1c471-b6d9-73d3-8138-0d8f3fb9a0fd",
    "builder_response": "- Tests run: no code or test changed this round, so the round 1 test output stands (the same `speck test --related` run).\n- F1: fixed. The ticket's Delivery log now lists each changed test file and the tests in it.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 217828,
      "cached_input_tokens": 165504,
      "cache_write_input_tokens": 0,
      "output_tokens": 1505,
      "reasoning_output_tokens": 109
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6389,
      "cached": 93824,
      "write": 0,
      "output": 628
    },
    "cost_usd": 0.0284404,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T07:53:42.100Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css keeps closed titles and details on one line. Passing test '0599 AC1, AC3, AC4' verifies ellipsis and equal row heights in all four lanes at 320 and 1280 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.js preserves complete title text and uses titled() for tooltips in every lane. Passing '0599 AC2' checks both; CSS clipping preserves the accessible text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing '0599 AC1, AC3, AC4' verifies that open Capture and Plan titles and the ticket's full-view title wrap without clipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing '0599 AC1, AC3, AC4' checks id alignment and minimum 44 px row height at both widths, plus the Plan priority control's tap area."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The ticket's Delivery log now lists all ten updated test files and affected tests. The unchanged code and tests retain round 1's result: 339 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0599-keep-every-closed-row-to-one-title-line.md",
        "issue": "The required list of updated wrapping tests was missing from the Delivery log.",
        "suggested_fix": "Completed: the Delivery log now lists the changed files and affected tests.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Closed rows now have consistent heights, with long titles cut off using an ellipsis. Full titles remain available through tooltips and opened views. The missing test record is complete, all criteria pass, and no blocking concerns remain."
  }
}
```

</details>

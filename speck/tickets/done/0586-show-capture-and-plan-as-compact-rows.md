---
id: "0586"
title: "Show Capture and Plan as compact rows"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0585"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:24:53.557Z"
approved: "2026-11-09T21:46:36.864Z"
finished: "2026-11-09T21:52:51.737Z"

---
# 0586 · Show Capture and Plan as compact rows

**Status:** ✅ done

## Problem
Capture and Plan still show the LCD-era cards. In the redesign they're compact rows like Build's, and an empty lane shows speck resting instead of a blank space.

## Outcome
Capture and Plan list their items as compact rows, and an empty lane shows speck asleep.

## Acceptance criteria
1. Each Capture note is one row: its title, a line saying where it came from (an idea, or the ticket a follow-up came from) and when, and its star, which still marks or unmarks it; pressing the row opens the note's whole text as today.
2. Each Plan draft is one row with its id, title and a line with its priority, size and risk; its Set ready and priority controls stay on the row and do what they do today.
3. An empty lane shows speck asleep with one line saying what lands there, for example "Nothing to plan · Draft tickets wait here for you to set them ready."
4. Each row is at least 44 px tall, and long titles wrap at 320 px wide.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Adding a way to capture from the panel: notes are still captured in chat.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `captureItem`, `noteItem`, `starButton`, `ticketItem`, `ticketHead`, `priorityPicker`, `readiness`, `setReadyButton` in `templates/panel.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: fixed the size and risk sitting under the priority's 44 px tap box, the empty lane's face stopping the render on a page without its script, and a border coming back on the row's labels below a pixel ratio of 2; each has a test.
- AC3's "an empty lane" is read as Capture's and Plan's, as the ticket's title and problem say: Build keeps its 0449 message, and Shipped is 0587's.

## In plain words
Capture and Plan now list their items as short rows, in the same style as Build, instead of separate cards. Each row has a title that wraps instead of being cut off, then one small line: for a note, where it came from and when, and for a draft, its priority, size and risk. A note's star and a draft's Set ready button are right on the row, so you can set a draft ready without opening it first. When a lane is empty, speck is shown asleep with a line saying what lands there.

To see it, open Capture and Plan in the panel; a lane with nothing in it shows speck asleep. Keep an eye on drafts that fail the ready check: their Set ready button is greyed out on the row, and hovering over it says why. Build and Shipped keep their own empty messages for now.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Opening a Capture note makes its title span both grid columns, including the column occupied by its star.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 340,090
- Elapsed since build started: 22 min
- Changed lines: 106 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests updated from the old look (AC5), each to the rows' new look with what it checks otherwise left as it was:
- Empty Capture's new line: `test/panel-0038.test.mjs`, `test/panel-0056.test.mjs`, `test/panel-0520.test.mjs`, `test/panel-0536.test.mjs`.
- A note's new second line ("Idea · 8 Oct", "From 0139 · 9 Oct"): `test/panel-0039.test.mjs` (AC3), `test/panel-0214.test.mjs`, `test/panel-0435.test.mjs`, `test/panel-0537.test.mjs`, `test/panel.test.mjs` (0033 AC5).
- Set ready on the row: `test/panel-0039.test.mjs` (AC1), `test/panel-0062.test.mjs`, `test/panel-0463.test.mjs`, `test/panel-0467.test.mjs`, `test/panel-0419.test.mjs` (AC1), `test/panel.test.mjs` (0042 AC1).
- Rows, not bordered cards: `test/panel-0151.test.mjs` (AC4), `test/panel-0167.test.mjs`, `test/panel-0418.test.mjs`.
- The priority, size and risk as words: `test/panel-0151.test.mjs` (AC3), `test/panel-0419.test.mjs` (AC1), `test/panel-0519.test.mjs`.
- Long titles wrap: `test/panel-0419.test.mjs` (AC1, AC2 and AC5), `test/panel-0434.test.mjs`, `test/panel-0435.test.mjs` (AC5), `test/panel-0468.test.mjs`.

Follow-ups:
- Inbox: `speck/ideas/2026-11-09-show-speck-asleep-in-an-empty-build-and-shipped.md`.

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
    "reviewed_sha": "afd2ba561b8017b48ff165972ba7e08f5391f439",
    "session": "fresh",
    "thread_id": "01a1c245-071c-7533-a0f1-35ea33a07e7d",
    "builder_response": "- Tests run: test/panel-0586.test.mjs test/panel-0038.test.mjs test/panel-0039.test.mjs test/panel-0056.test.mjs test/panel-0062.test.mjs test/panel-0151.test.mjs test/panel-0167.test.mjs test/panel-0214.test.mjs test/panel-0418.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0435.test.mjs test/panel-0463.test.mjs test/panel-0467.test.mjs test/panel-0468.test.mjs test/panel-0519.test.mjs test/panel-0520.test.mjs test/panel-0536.test.mjs test/panel-0537.test.mjs test/panel.test.mjs  (with --related, so also every existing test file that names a changed file). Also run outside this output, all passing: the other panel tests that exercise Capture's and Plan's rows through helpers (988 tests).\n- AC3 is read as Capture's and Plan's empty lanes, as the ticket's title and problem say (in its Notes): Build keeps its 0449 message and Shipped is 0587's.\n- Press on a Plan row still opens it in place, as today (the ticket asks only that Set ready and priority stay on the row and do what they do today). Open, Set ready goes under the table, so a title keeps its 0441 line limits.\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 209332,
      "cached_input_tokens": 149248,
      "cache_write_input_tokens": 0,
      "output_tokens": 944,
      "reasoning_output_tokens": 110
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 60084,
      "cached": 149248,
      "write": 0,
      "output": 944
    },
    "cost_usd": 0.1445328,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T21:45:03.060Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel-cards.css: .item.row.open .head .line spans both columns, while an open Capture note's star remains explicitly in column 2, spanning rows 1–2. The title and star therefore occupy overlapping grid cells. panel-0586 tests opening notes but measures only closed rows."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketHead and setReadyButton in templates/panel.js retain the controls and stop button clicks propagating. Passing panel-0586 tests exercise readiness, refusal and priority changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "asleepLane and render provide both empty states. Passing panel-0586 AC3 tests check the asleep face, explanatory text and preservation across refreshes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0586 AC4 browser test measures minimum row height and title wrapping at 320 px for both lanes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the updated appearance tests. Their changes match the requested redesign; /tmp/speck-0586-tests.txt confirms 435 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css",
        "issue": "Opening a Capture note makes its title span both grid columns, including the column occupied by its star. A long open title can run behind the star because both are explicitly placed in the same grid area.",
        "suggested_fix": "Restrict the full-width open-title rule to ticket rows, or explicitly move the open note's star to a separate area. Add a browser check that an open Capture note's long title and star do not overlap at 320 px.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Capture and Plan now use compact rows, and their empty states show speck asleep. The controls and narrow-screen layout have useful passing tests. One layout defect needs fixing: opening a Capture note lets its title overlap its star."
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
    "reviewed_sha": "5a7eeb87a734ce367bba7097114ce3d0ddce919c",
    "session": "continued",
    "thread_id": "01a1c245-071c-7533-a0f1-35ea33a07e7d",
    "builder_response": "- Tests run: test/panel-0586.test.mjs test/panel-0038.test.mjs test/panel-0039.test.mjs test/panel-0056.test.mjs test/panel-0062.test.mjs test/panel-0151.test.mjs test/panel-0167.test.mjs test/panel-0214.test.mjs test/panel-0418.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0435.test.mjs test/panel-0463.test.mjs test/panel-0467.test.mjs test/panel-0468.test.mjs test/panel-0519.test.mjs test/panel-0520.test.mjs test/panel-0536.test.mjs test/panel-0537.test.mjs test/panel.test.mjs \n- F1: fixed. templates/panel-cards.css: the full-width open-title rule now applies only to ticket rows (`.item.ticket.row.open`), so an open note keeps its title in column 1 beside its star. test/panel-0586.test.mjs's browser test opens the long note at 320 px and checks its title ends before the star.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 338592,
      "cached_input_tokens": 272256,
      "cache_write_input_tokens": 0,
      "output_tokens": 1498,
      "reasoning_output_tokens": 110
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6252,
      "cached": 123008,
      "write": 0,
      "output": 554
    },
    "cost_usd": 0.0303448,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T21:46:20.909Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js captureItem and noteItem render the title, source/date, star and expandable text. panel-0586 AC1 tests pass; panel-0538 covers starring and unstarring. The passing browser test now verifies an open long title stays clear of its star."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketHead renders the id, title, priority/size/risk line and Set ready control. Passing panel-0586 AC2 tests exercise priority changes, readiness, disabled controls and refusals."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "asleepLane and render provide sleeping faces and explanatory lines for empty Capture and Plan lanes. Passing panel-0586 AC3 tests cover both states and preservation across refreshes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css sets a 44 px minimum row height and wrapping titles. The passing panel-0586 AC4 browser test measures both lanes at 320 px, including the open note's separation from its star."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the updated appearance tests, whose changes retain relevant behaviour checks. The saved round-two output confirms 336 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css",
        "issue": "An open Capture note's title previously shared grid space with its star.",
        "suggested_fix": "Completed: the full-width open-title selector now applies only to ticket rows, and a passing browser assertion checks that an open Capture title stays clear of its star at 320 px.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Capture and Plan now display compact rows with working controls, wrapping titles and sleeping empty states. The title/star overlap is fixed and covered by a browser test. All criteria pass, with no remaining blocking concerns."
  }
}
```

</details>

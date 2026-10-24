---
id: "0463"
title: "Lay out an open ticket that hasn't started like one in flight"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0462"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T11:10:51.080Z"
approved: "2026-10-24T11:34:07.514Z"

---
# 0463 · Lay out an open ticket that hasn't started like one in flight

**Status:** 👍 approved

## Problem
After 0461 and 0462, an open ticket in flight shows a step track and an even table of facts, but an open ticket in Plan, or one queued in Build, still lists its facts in a line joined by dots that wraps on a phone. The cards don't look like one family.

## Outcome
An open ticket that hasn't started shows the same step track and table as one in flight.

## Acceptance criteria
1. An open ticket in Plan's Tickets list, and an open ticket queued in Build, shows under its title the same step track as 0461 and the same table as 0462: the same bars, colours, cell sizes, lines, label and value places, one line per value with `…` and the full text as its tooltip. All five bars and names are grey, as no step has started.
2. Its table's six cells are `Status` (`Draft` for every ticket in Plan, `Queued` for a ticket queued in Build), `After` (how many of the tickets it waits on haven't shipped, such as `1 left`, or `11 left of 27` when it waits on more than one, or `—` when it waits on none that haven't shipped), `Lint` (`passes`, or its errors and warnings in their colours), `Priority`, `Size · risk` and `Type`, in that order, so `Status` is the top-left cell, where a ticket in flight has `Now`. In Build, the `After` cell is labelled `Waiting on`.
3. The line joined by dots is gone from these open tickets, and what's under it (the criteria, the priority control, Set ready, Full ticket and so on) stays as it is. A closed ticket keeps its one short line. Checked in a real browser at 320 px and 390 px, with a value longer than its cell.
4. A screen reader reads each cell as its label and value. No test that passed before this change fails.

## Out of scope
- Ideas and Inbox items.
- Shipped tickets (0464) and the full ticket (0465).

## Notes
- Asked for by the user on 2026-10-24, after choosing the step track and facts grid for open build tickets (0461, 0462; mock-ups at https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "that layout should just be the template for all tickets in plan and ship. And also when you open a ticket in the full screen mode, like that table should be there as well."
- Today: `ticketHead` draws a Plan ticket's line (priority, size, risk, criteria, lint, after or unlocks), and `queuedLine` a queued one's, both in `templates/panel.js`.
- The user asked on 2026-10-24 for the top-left cell to say `Draft` for any ticket in Plan. The number of criteria isn't in the table, as an open Plan ticket lists its criteria under it.
- The user agreed on 2026-10-24 that `After` holds a count, as option E in the mock-ups shows: the tickets themselves are shown under the table by 0467.
- Waits for 0462, whose table this reuses.
- Failing before this build: none
- Self-check: the open draft's priority control, in its Priority cell, got its own plain class rather than a borderless tag (the contrast checks need every tag's edge), and a 44 px tap box on touch screens whose negative margins keep the cell as tall as the others; the browser test now runs on a touch screen too.

## In plain words
When you open a ticket in Plan, or a queued ticket in Build, it now looks like a ticket that's being built: a row of five grey steps under its title, then a small table of six facts. The table says whether it's a draft or queued, how many of the tickets it waits on haven't shipped yet, whether it passes lint (errors in red, warnings in amber), and its priority, size and risk, and kind. On a draft, tapping the priority in the table still opens the menu that sets it. Closed tickets look as before. To see it, open any draft in Plan, or a queued ticket in Build, on a phone or a wide screen. Worth knowing: the "after" cell shows a count, not which tickets it waits on, until a later ticket lists them under the table.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 208,273
- Elapsed since build started: 23 min
- Changed lines: 132 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: the Build queue now shows no priority, size or risk tag anywhere (closed cards haven't since 0434, and open ones have them in the table as plain text), so their tips are only in Plan and the full ticket pane. Which tickets an open ticket waits on is left to 0467, as the ticket's Notes say.

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
    "reviewed_sha": "1b716ab6ecf00cd1fa1f7cb7edf784761dd4bbf1",
    "session": "fresh",
    "thread_id": "01a16daf-f701-7d11-a576-fbe7c5db8238",
    "builder_response": "- Tests run: test/panel-0463.test.mjs, the existing test files this ticket changed (test/panel-0041, 0077, 0140, 0151, 0155, 0165, 0190, 0213, 0224, 0419, 0434, 0453, 0461, 0462), test/panel-0161 and test/panel-0417 (which failed in an earlier run before the fix below), and with --related every test file naming a changed file. Separately, while building, every test/panel*.test.mjs file and every other test file importing test/support/panel.mjs or test/support/queue-phone.mjs passed.\n- Round 1. What changed and why:\n  - templates/panel.js: an open Plan ticket's head (ticketHead) and an open queued Build card (queueItem) now show trackOf with five not-reached steps (NOT_STARTED) and a facts table (waitingFacts) in place of the dotted line. factsOf's cell builder and bottom row were pulled out (factCell, lastFacts) so both tables share them. After counts list(t.waiting_on) (the unshipped ones, as readiness already treats them) against list(t.after): '—' for none left, 'N left' when it waits on one, 'N left of M' when it waits on more than one. Lint shows 'passes', or its errors (.bad) and warnings (.warn). queueUpdate swaps the open card's table, not a missing .act line, when only its chain changes. queuedLine lost its now-unused isOpen parameter.\n  - The priority control: on an open draft it was in the dotted line that goes. AC3 keeps it, so it is now the Priority cell's value: priorityPicker on a plain span.set-prio (not a .tag, since tags are boxed and every tag must show its edge, which 0161 checks). On touch screens its .prio box is 44 by 44 px, with negative top and bottom margins so the cell stays as tall as the others; the browser test checks that too.\n  - templates/panel.css: every `.q .track…` and `.q .facts…` rule also names `.item.ticket .track…` / `.item.ticket .facts…`, so the track and table are the same in both lanes.\n  - Existing tests changed because they checked what this ticket removes: an open queued card's or open draft's dotted line and the priority, size and risk tags in it. The Build queue now has no priority, size or risk tag anywhere (closed cards never showed them since 0434; open ones have them in the table), so tests that reached those tags through an open queued card now use a closed draft's tags, the closed queued card's bug/fix tag, or the full ticket pane (0151, 0165, 0190, 0213, 0224, support/queue-phone.mjs), or check the table's cells (0077, 0419, 0434, 0461, 0462, 0155). 0041 checks the chain icon and the table rather than the 'unlocks' text that was in the dotted line. 0140 and 0453 find the open draft's priority control by .set-prio as well as .tag.pick.\n- Pictures: Plan and Build at 390 px, light and dark, are in the review pack.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 207611,
      "cached_input_tokens": 148352,
      "cache_write_input_tokens": 0,
      "output_tokens": 662,
      "reasoning_output_tokens": 63
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T11:33:56.941Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js: ticketHead and queueItem reuse trackOf with NOT_STARTED and waitingFacts. Shared panel.css rules give Plan and Build identical styling. panel-0463 AC1 tests passed, including shared-style checks; the real-browser test verifies layout and truncation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "waitingFacts and lastFacts render all six cells in the required order, with Draft/Queued, dependency counts, coloured lint results and the required Build label. panel-0463 AC2 exercises these cases and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticketHead and queueItem replace only the open card's details line; closed cards retain their line. panel-0463 AC3 tests verify retained content, priority menu, queued controls and refresh behaviour. The real-browser test passed at 320 and 390 px with long values, using mouse and touch modes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "factCell uses a dl containing grouped dt/dd label-value pairs, covered by the passing panel-0463 AC4 test. The recorded test output confirms 316 passed, zero failed and three skipped across 319 tests; the required real-browser test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Open Plan and queued Build tickets now share the step track and facts table used by tickets in progress. Dependency counts, lint colours and the priority control work as required, including narrow phone layouts. The tests exercise the requested behaviour, and I found no blocking issues."
  }
}
```

</details>

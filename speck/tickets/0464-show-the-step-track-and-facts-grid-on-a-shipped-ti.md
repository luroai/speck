---
id: "0464"
title: Lay out an open shipped ticket like one in flight                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0463"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T11:37:23.357Z"
approved: "2026-10-24T11:46:51.061Z"

---
# 0464 · Lay out an open shipped ticket like one in flight

**Status:** 👍 approved

## Problem
After 0461 and 0462, an open ticket in flight shows a step track and an even table of facts, but a shipped ticket's Details shows its figures as a list of labels and values. The cards don't look like one family.

## Outcome
An open shipped ticket shows the same step track and table as one in flight, with its figures in the table.

## Acceptance criteria
1. Pressing a shipped ticket's Details shows, under its title, the same step track as 0461 and the same table as 0462: the same bars, colours, cell sizes, lines, label and value places, one line per value with `…` and the full text as its tooltip. All five bars are in their steps' colours, as every step is done, and the Review step names its last round, such as `Review 2`.
2. Its table's six cells are `Shipped` (when, as its line says it), `Time` (minutes), `Review rounds`, `Builder cost`, `Builder tokens` and `Reviewer tokens`, in that order. A figure the ticket doesn't have shows `—`, so the table always has six cells.
3. The list of labels and values Details showed is gone, and Review pack stays under the table. A closed shipped ticket keeps its one line. Checked in a real browser at 320 px and 390 px, with a value longer than its cell.
4. A screen reader reads each cell as its label and value. No test that passed before this change fails.

## Out of scope
- The shipped list's closed line and the latest-ten limit (0411).
- Tickets not started (0463) and the full ticket (0465).

## Notes
- Asked for by the user on 2026-10-24, after choosing the step track and facts grid for open build tickets (0461, 0462; mock-ups at https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "that layout should just be the template for all tickets in plan and ship. And also when you open a ticket in the full screen mode, like that table should be there as well."
- Today: the Shipped list in `templates/panel.js` (0157, 0162, 0420) draws `figs` (Time, Review rounds, Reviewer tokens, Builder tokens, Builder cost) as `.fig` label and value pairs when a row is open.
- Waits for 0463: both change the shared table and `templates/panel.css`.
- Failing before this build: none
- Self-check: Review pack's row had the old 1% table-cell width, which squeezed it and put Review pack off a whole pixel; it now spans the card, and the browser test checks that row and Details at its end. Also checked a merged-but-not-pushed card keeps its note under the table.

## In plain words
Opening a shipped ticket with Details now shows the same coloured row of five steps and the same six-box table as a ticket being built, so every card looks like one family. All five steps are in colour, as it's finished, and the review step says how many rounds it took, such as "Review 2". The table gives when it shipped, how long it took, its review rounds, the builder's cost and tokens, and the reviewer's tokens, with a dash for anything not recorded. Review pack sits under the table, and the Details button that closes it is now at the end of that row. To see it, open the Shipped tab and press Details on any ticket. Closed cards still show their single line.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 126,361
- Elapsed since build started: 9 min
- Changed lines: 91 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. Note: while a card is open, Details moves from the end of its closed line to the end of the Review pack row under the table.

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
    "reviewed_sha": "b989513a75fb601e0c64b8af46dd1d599a43d504",
    "session": "fresh",
    "thread_id": "01a16dbb-9e59-70e0-bc12-4202e21713aa",
    "builder_response": "- Tests run: test/panel-0464.test.mjs test/panel-0137.test.mjs test/panel-0157.test.mjs test/panel-0162.test.mjs test/panel-0420.test.mjs test/panel-0427.test.mjs test/panel-0453.test.mjs (with --related, which added the repo checks and the files naming templates/panel.js or panel.css)\n- Open card layout: title line, then a `steps` cell holding the track and the facts table, then any \"merged, not pushed\" note, then Review pack with Details at the end of its row (Details moved there from the closed line, which is gone while open).\n- The Shipped cell's value is the time or day as the closed line says it; its tooltip is the line's own `when` (the day and time before today), and shortened token counts have the exact number as their tooltip, as on the line before.\n- Updated old tests that asserted the removed labelled figures (0137, 0157, 0162, 0420, 0427, 0453): same intent, new layout. 0427 no longer requires the figures in monospace, as the table (0462) isn't.\n- Pictures: light and dark at 420 px, kept with `speck picture`.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 125665,
      "cached_input_tokens": 76416,
      "cache_write_input_tokens": 0,
      "output_tokens": 696,
      "reasoning_output_tokens": 19
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T11:46:42.617Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js shippedSteps(), shippedFacts() and trackOf() reuse the shared layout. Passing panel-0464 tests verify all five completed steps, Review 2, shared CSS, tooltips and real-browser layout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shippedFacts() always renders the six specified cells in order. Passing AC2 tests cover figures, missing values, exact token tooltips and the Shipped cell's midnight update."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() replaces the open card's old figures and summary with steps and facts, followed by Review pack. Passing AC3 tests verify closing behaviour and the unchanged closed line; the real-browser test passed at 320 and 390 px with an overflowing cost."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "factCell() supplies dt/dd label-value pairs within a dl, verified by the passing AC4 test. Recorded test output confirms 214 passed, zero failed and three skipped; the ticket's browser test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Open shipped tickets now show the shared coloured step track and six-cell facts table, with Review pack below. Missing figures, long values and narrow screens are covered. The recorded tests pass, and I found no blocking issues or unrelated changes."
  }
}
```

</details>

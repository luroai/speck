---
id: "0462"
title: "Show an open build ticket's facts in a grid"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0461"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T10:52:09.690Z"
approved: "2026-10-24T11:07:31.038Z"
finished: "2026-10-24T11:10:30.959Z"

---
# 0462 · Show an open build ticket's facts in a grid

**Status:** ✅ done

## Problem
An open ticket in the Build lane lists what it's doing, its stage, its reviewer, its timer, priority, size, risk and type in one line joined by dots. On a phone the line wraps wherever the width runs out, so it looks untidy and nothing tells you which part matters.

## Outcome
An open ticket that's in flight shows its facts in a small, even table under its step track, each fact in its own labelled cell on one line.

## Acceptance criteria
1. In an open ticket that's in flight, the line of facts joined by dots is replaced, under the step track (0461), by a table of six equal cells in three columns and two rows, with lines between the cells and round the table: `Now` (what's happening in a word or two, such as `Writing`, `Reviewing` or `Ready to ship`, with the moving lights while an agent is at work), `Builder` or `Reviewer` (whichever is at work, by its model as the card names it today, or by the agent's name with no model), `Time` (its timer, labelled `Waiting` while it's approved and waiting for you), `Priority`, `Size · risk` (such as `S · low`) and `Type` (`bug`, `fix`, `document` or `code`, bug, fix and document in their tags' colours).
2. Each cell has its label above its value in the same place in every cell. Every value stays on one line: a value too long for its cell ends in `…`, and its full text is its tooltip. Every cell in a row is the same height. Checked in a real browser at 320 px and 390 px, with a value longer than its cell.
3. A closed ticket keeps its one short line, and a queued ticket keeps its line, as today. Full ticket, Stop build, Review pack and the log stay under the table.
4. A screen reader reads each cell as its label and value. No test that passed before this change fails.

## Out of scope
- The step track itself (0461).
- Closed and queued tickets, and the Plan and Shipped tabs.

## Notes
- Asked for by the user on 2026-10-24, choosing option D in the mock-ups (https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "make sure any of the facts within the table do not create a new line. If it's too long … the ellipsis", and "as clean and as uniform as the images, … it's the uniformness that I love". The mock-ups show it for a ticket building, in review, and approved and waiting.
- Today: `progressOf` in `templates/panel.js` (0168, 0416, 0434, 0443) draws the dotted line with `detailsLine`, and `tagsOf` its priority, size and risk while it's open. `say` gives a short and a full sentence for what it's doing (0443).
- Waits for 0461: both change `progressOf` in `templates/panel.js` and the card's styles in `templates/panel.css`.
- Failing before this build: none
- Self-check: an approved ticket whose auto-ship failed now labels its timer `Waiting` too, as it waits for you; the cells' labels went from 11 px to 12 px, as 0161 sets 12 px as the smallest text; and the lights in the Now cell are hidden from screen readers, so a cell reads as its label and value.
- Old tests that read the open card's dotted line now read its table, or check the line on the closed card, where it still is: foreman-0317, panel.test (0034, 0045), 0050, 0077, 0138, 0153, 0155, 0156, 0196, 0201, 0203, 0361, 0419, 0427, 0434 and 0443. 0443 AC2 (an open card shows the full sentence) gives way to this ticket's AC1: the Now cell shows the short words, with the full sentence as its tooltip.

## In plain words
When you open a ticket that's being built, reviewed or waiting to ship, its details now sit in a small, even table under its step track instead of one long line joined by dots: what it's doing now, who's working on it, its timer, its priority, its size and risk, and its type. Each detail stays on one line, and anything too long ends in "…", with the whole of it shown when you hover. To see it, open any ticket in the Build lane, on a phone or a narrow window. Closed and queued tickets look as before. Worth knowing: the open card's priority, size and risk no longer explain themselves when tapped, and the "Now" cell gives a word or two, with the full sentence on hover.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 196,700
- Elapsed since build started: 15 min
- Changed lines: 85 (limit 5000)
- Follow-ups: speck/ideas/2026-10-24-name-the-builder-s-model-in-the-facts-grid.md and speck/ideas/2026-10-24-explain-the-facts-grid-s-priority-size-and-risk.md.
- Known limit: the Builder cell names the agent, not its model, as the board doesn't give the builder's model.

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
    "reviewed_sha": "b679a03b4ef70f03a456923fb78fa9db033a3a44",
    "session": "fresh",
    "thread_id": "01a16d97-6cc6-73d1-9706-132b9759ca16",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0462.test.mjs (new) and every existing test file this ticket changed: test/foreman-0317.test.mjs test/panel-0050.test.mjs test/panel-0077.test.mjs test/panel-0138.test.mjs test/panel-0153.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0196.test.mjs test/panel-0201.test.mjs test/panel-0203.test.mjs test/panel-0361.test.mjs test/panel-0419.test.mjs test/panel-0427.test.mjs test/panel-0434.test.mjs test/panel-0443.test.mjs test/panel.test.mjs, plus the 292 files --related brought in through test/support/panel.mjs and the templates. All pass; 3 skipped are existing skips.\n- Existing tests changed: they read the open in-flight card's dotted line, which AC1 replaces. Each now reads the open card's table, or checks the line on the closed card, where it still is, keeping its own intent. 0443 AC2 (an open card shows the full sentence) gives way to this ticket's AC1: the Now cell is a word or two, with the full sentence as its tooltip. 0419 AC3 and 0434 AC3 checked the tap-to-explain priority, size and risk tags on an open in-flight card; those are now plain cell values whose tooltip is their text, as AC2 asks.\n- Pictures of the Build lane at 390 px, light and dark, are in the review pack.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 195966,
      "cached_input_tokens": 140800,
      "cache_write_input_tokens": 0,
      "output_tokens": 734,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T11:07:10.298Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js factsOf and templates/panel-model.js workerOf/wordOf implement the six labelled facts. The two passing 0462 AC1 tests cover states, agent names, lights, colours, borders and equal columns."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0462 AC2 browser test checks alignment, equal cell dimensions, single-line values and long-model truncation at 320 and 390 px. The other AC2 test checks tooltips and timer updates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueItem preserves progressOf for closed tickets and queuedLine for queued tickets. The passing 0462 AC3 test checks these paths and the placement of Full ticket, Review pack and logs; existing stop-build tests also passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "factsOf uses a definition list with dt/dd label-value pairs and hides decorative lights from screen readers. The passing AC4 test verifies this structure. Verified /tmp/speck-0462-tests.txt reports 2629 passes, zero failures and three existing skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Open Build tickets now show six neatly aligned facts beneath their step track. Long values stay on one line and reveal their full text in tooltips. Browser checks passed at both requested phone widths, and closed and queued cards retain their existing layout. No blocking issues found."
  }
}
```

</details>

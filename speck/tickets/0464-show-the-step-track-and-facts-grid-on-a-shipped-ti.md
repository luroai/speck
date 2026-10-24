---
id: "0464"
title: Lay out an open shipped ticket like one in flight                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0464 · Lay out an open shipped ticket like one in flight

**Status:** 🔨 building

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

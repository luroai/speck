---
id: "0462"
title: "Show an open build ticket's facts in a grid"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0462 · Show an open build ticket's facts in a grid

**Status:** 🔨 building

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

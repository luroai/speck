---
id: "0445"
title: "Set a document task's document out like the full ticket"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-set-a-document-task-s-document-out-the-same-way.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0442"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0445 · Set a document task's document out like the full ticket

**Status:** 📝 draft

## Problem
0424 set the full ticket and the review pack out as a document, but a document task's document, in its own pop-up, kept the old sizes, so the three read differently.

## Outcome
A document task's document is set out like the full ticket.

## Acceptance criteria
1. In a document task's pop-up, the document's first heading is its title, in the full ticket's title size. Its other headings, text (at least 15 px with a line height of at least 1.5) and lists (numbers hanging to the left) use the full ticket's sizes from 0424.
2. The pop-up's top line still shows the document's file path, as today.

## Out of scope
- The full ticket and the review pack (0424).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0424, which kept the pop-up's rules apart to stay in scope. Open question answered: the document's first heading is its title.
- Waits for 0442: both change `templates/panel.css`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

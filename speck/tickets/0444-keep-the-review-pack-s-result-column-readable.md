---
id: "0444"
title: "Keep the review pack's Result column readable"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-keep-the-review-pack-s-result-column-readable.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0440"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:51:53.232Z"

---
# 0444 · Keep the review pack's Result column readable

**Status:** 🔨 building

## Problem
In a review pack's acceptance-criteria table, the Result column is squeezed to one letter wide, so its heading reads one letter per line and the header row is very tall.

## Outcome
The Result column is wide enough for its heading and its mark.

## Acceptance criteria
1. In a review pack's acceptance-criteria table, at 1280 px and 1440 px wide, the Result column is at least as wide as its heading and its widest mark, so `Result` reads on one line, and the table doesn't reach past the pack's right edge.
2. On a narrow screen, where 0158 stacks each row, each criterion's result still shows beside its number, as today.

## Out of scope
- The pack's other tables.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- Seen in the builder's pictures for 0423. The columns share out the width by their text, and Criterion and Evidence take nearly all of it.
- Waits for 0440: both change `templates/panel.css`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

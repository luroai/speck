---
id: "0270"
title: "Give speck's three fullest scripts room to grow"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T10:57:46.651Z"

---
# 0270 · Give speck's three fullest scripts room to grow

**Status:** 🔨 building

## Problem
No file under `scripts/` may be over 600 lines (0078 AC2). `scripts/panel.mjs` and `scripts/run.mjs` are at exactly 600 lines and `scripts/core.mjs` is at 599, so the next ticket that adds a line to any of them fails at ship time and is handed back to its build. 0258, 0260 and 0261 were each handed back for this on 2026-10-17.

## Outcome
`scripts/panel.mjs`, `scripts/run.mjs` and `scripts/core.mjs` each have room for the next few tickets, and speck does exactly what it did before.

## Acceptance criteria
1. `scripts/panel.mjs`, `scripts/run.mjs` and `scripts/core.mjs` are each at most 500 lines.
2. No file under `scripts/` is over 600 lines.
3. Every function and constant another file imports from one of those three files can still be imported from where it is imported today, so no file outside `scripts/` has to change its imports.
4. No test that passed before this change fails.

## Out of scope
- Changing what any code does. Code is moved, not rewritten.
- Lowering the 600-line limit.

## Notes
- Move whole parts that belong together into new modules under `scripts/`, named for what they do, as 0078 did for `speck.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

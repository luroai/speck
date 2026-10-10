---
id: "0090"
title: "Add an MIT licence in Luro's name"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:57:13.594Z"

---
# 0090 · Add an MIT licence in Luro's name

**Status:** 🔨 building

## Problem
`package.json` says the licence is MIT, but the repo has no licence file, so anyone finding speck on GitHub has no licence text and no copyright holder to go by.

## Outcome
The repo has a standard MIT licence file in Luro's name, and the README points to it.

## Acceptance criteria
1. A `LICENSE` file at the repo root has the standard MIT licence text with the line `Copyright (c) 2026 Luro`.
2. The README's Licence section links to `LICENSE`, and `package.json` still says `MIT`.
3. The full test suite passes.

## Out of scope
- Licence headers in source files.

## Notes
- Decided 2026-10-10: MIT, copyright Luro.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0019"
title: "Finish splitting speck.mjs into modules"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0018"]                # ticket ids that must be done first
created: 2026-10-09
cancel_reason: "Merged into 0018 once max_changed_lines went up to 5,000, so the module split fits one ticket."
cancelled: 2026-10-09

---
# 0019 · Finish splitting speck.mjs into modules

**Status:** ❌ cancelled

## Problem
After 0018, `scripts/speck.mjs` still holds install, doctor and ship code alongside the core ticket code and commands, so reviews of small changes still read a long file.

## Outcome
Install and doctor, and ship, each live in their own file under `scripts/`, and speck works exactly as before.

## Acceptance criteria
1. `init`, the install of skills and CLI, the `doctor` checks and `ship` (including `--auto`) live in separate files under `scripts/`, and `scripts/speck.mjs` no longer defines them.
2. Every function that tests or other code import from `scripts/speck.mjs` today can still be imported from there.
3. Every CLI command gives the same output and exit code as before; the full test suite passes unchanged.
4. A project installed with `speck init` runs `node .speck/scripts/speck.mjs doctor` and `ship` successfully, and re-running `init` there still updates `.speck/`.

## Out of scope
- Changing any behaviour, message or output.
- The test file (0020).

## Notes
- A pure move, kept under the 1,000 changed-line limit.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

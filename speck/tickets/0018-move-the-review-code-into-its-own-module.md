---
id: "0018"
title: "Split speck.mjs into modules by area"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0018 · Split speck.mjs into modules by area

**Status:** 📝 draft

## Problem
`scripts/speck.mjs` is about 1,340 lines in one file. Reviewers read large parts of it every round, which is a big share of the 400k–500k reviewer tokens a ticket costs, and an edit in one area risks breaking another.

## Outcome
speck's code is split into files by area under `scripts/`, and speck works exactly as before.

## Acceptance criteria
1. The review code (reviewing, recording, `prompt`, `diff`, `next`, `reviewer-settings` and the review pack), the install and doctor code, and the ship code (including `--auto`) each live in their own file under `scripts/`. `scripts/speck.mjs` keeps the commands' entry point. No file under `scripts/` is over 600 lines; if `speck.mjs` still is, more areas move out too.
2. Every function that tests or other code import from `scripts/speck.mjs` today can still be imported from there.
3. Every CLI command gives the same output and exit code as before, and the full test suite passes unchanged.
4. A project installed with `speck init` (which copies `scripts/` into `.speck/`) runs `review`, `record`, `pack`, `doctor` and `ship` from `.speck/scripts/speck.mjs`, and re-running `init` there still updates `.speck/`.

## Out of scope
- Changing any behaviour, message or output.
- The test file (0020).

## Notes
- Pre-check: AC1 used to fix what stays in `speck.mjs` and also cap every file at 600 lines, which could contradict each other. Now the cap wins.
- Checked 2026-10-09: `speck init` copies the whole `scripts/` folder into `.speck/` (installTooling), so new module files install without changes.
- This is a pure move. 0019 was merged in once `max_changed_lines` went up to 5,000.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

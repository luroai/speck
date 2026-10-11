---
id: "0122"
title: "Stop speck's tests reading this repo's own speck folder"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-stop-tests-depending-on-files-under-speck.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0121"]                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T12:25:08.256Z"

---
# 0122 · Stop speck's tests reading this repo's own speck folder

**Status:** 🔨 building

## Problem
Since 0112, `speck test` and `speck ship` reuse a test result when nothing outside `speck/` has changed. Some of speck's own tests read this repo's files under `speck/`: its config, done tickets and filed idea notes, and the private-words check scans them all. A change there can then pass or fail on a reused result that a fresh run would give differently.

## Outcome
No test in this repo reads this repo's own files under `speck/`, so a reused result is always the result a fresh run would give.

## Acceptance criteria
1. No test reads a file under this repo's own `speck/` folder. Tests that checked fixed content there (for example the repo's `speck/config.yml`, a done ticket or a filed idea note) check the same thing against test data of their own or a temporary repo, or are removed where what they checked was a one-off change that's already recorded in its ticket.
2. The private-words check (`test/private-words-0084.test.mjs`, `test/luro-0082.test.mjs`) no longer scans files under `speck/`. It still scans every other tracked file.
3. A new test fails if any test file reads this repo's own `speck/` folder, so it can't come back unnoticed.
4. No test that passed before this change fails, apart from tests this ticket removes under AC1. The Delivery log lists each test removed and why.

## Out of scope
- Checking tickets for private words (0121).
- Changing how test results are reused.

## Notes
- Known readers from 0112's build: `test/luro-0082.test.mjs` (done tickets and an idea note), `test/product-0068.test.mjs` (`speck/product.md`), `test/worktrees.test.mjs` (the repo's `speck/config.yml`). The builder should search for others.
- After this, tickets are checked for private words by `speck lint` (0121) instead, at the moment they're set ready.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

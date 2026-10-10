---
id: "0085"
title: "Keep every test running after the history rewrite"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0085 · Keep every test running after the history rewrite

**Status:** 📋 ready

## Problem
The history rewrite changes every commit id and removes the owner's words from 0082's ticket. Two tests depend on those: 0081's AC5 finds the panel from before 0081 by a fixed commit id, so it would quietly skip, and 0084's AC4 reads the owner's words from 0082's ticket, so it would fail. A trial rewrite on 2026-10-10 showed both.

## Outcome
The test suite gives the same results before and after the history rewrite.

## Acceptance criteria
1. 0081's AC5 finds the panel as it was before 0081 from the commit whose message is `speck(0081): ready`, not from a fixed commit id. It runs, rather than skipping, in this repo.
2. 0084's AC4 takes the words to look for from the owner's list, `~/.config/speck/private-words`, read as 0082's check reads it. When that list is missing or empty, it's reported as skipped. It no longer reads 0082's ticket.
3. No test or file under `scripts/`, `skills/` or `templates/` refers to a commit by its id.
4. The full suite passes, and with the owner's list in place, the only skips are the three 0078 ones that skip today.

## Out of scope
- The history rewrite itself, which is done by hand after this ships.
- Changing what 0081's or 0084's tests check.

## Notes
- Found by a trial rewrite with `git filter-repo` in a scratch copy: 684 tests, 1 failure (0084 AC4) and 4 skips (0081 AC5, plus the three 0078 skips that also happen today).
- Checked 2026-10-10: `9ff5e4c` in `test/panel-0081.test.mjs` is the only fixed commit id in `test/`, `scripts/`, `skills/` and `templates/`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0023"
title: "Self-check the build before the first review round"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T09:37:30.052Z"

---
# 0023 · Self-check the build before the first review round

**Status:** 🔍 reviewing

## Problem
In 0012, 0013 and 0014, the first review round always came back with one blocking finding, and each was an edge case the builder could have found: input that's built in rather than missing (`constructor`), state carried between rounds, an error that dropped part of the output, a docs claim wider than the code. Each round costs 200k–500k reviewer tokens and several minutes.

## Outcome
Before the first review round, the builder checks its own work against a short adversarial checklist and fixes what it finds, so fewer tickets need a second round.

## Acceptance criteria
1. The build skill has a self-check step after implementation and before the review loop. It covers at least: unusual inputs (empty, missing, malformed, built-in names), state carried across rounds or re-runs, error paths and their messages, every claim in docs or `product.md` matched to code and a test, and changes outside the ticket's scope.
2. The step tells the builder to add a test for each problem it finds, fix it, and then write one line in the ticket's Notes saying the self-check ran and what it changed (or "no changes").
3. The step says plainly that the self-check isn't a review or an approval, and the reviewer still decides.

## Out of scope
- Changing the reviewer prompt or the review loop.

## Notes
- The checklist comes from the round-1 findings in 0003, 0012, 0013 and 0014. Keep it short enough to run in a few minutes.
- Self-check: the AC1 test matched loose keywords (for example `/rounds?|re-runs?/`) that almost any text would pass. It now requires each checklist item by its bold label, with the substance the ticket asks for.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

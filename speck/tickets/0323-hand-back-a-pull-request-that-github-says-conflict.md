---
id: "0323"
title: "Hand back a pull request that GitHub says conflicts"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-hand-back-a-pull-request-github-says-conflicts.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:08:40.873Z"

---
# 0323 · Hand back a pull request that GitHub says conflicts

**Status:** 🔨 building

## Problem
In pull request mode, when GitHub says a ticket's pull request conflicts with the base branch, `speck ship` refuses with an ordinary error instead of a conflict (exit 13). `speck run` then doesn't hand the ticket back to its build to merge the base branch in, so an auto-shipped ticket sits approved with a conflict until someone notices.

## Outcome
In pull request mode, a pull request that GitHub says conflicts is handed back to its build, as a conflict found locally is.

## Acceptance criteria
1. With `ship_mode: pr`, when GitHub reports the ticket's pull request as conflicting with the base branch, `speck ship --auto` refuses with exit 13, naming the conflict, and changes nothing.
2. speck run hands such a ticket back to its build with the conflict steps, as it does for a conflict found by ship's own merge.
3. Pull requests GitHub can't merge for other reasons (checks failing, a review required) are refused as today, and aren't handed back.
4. `ship_mode: local` works as today.

## Out of scope
- Resolving conflicts on GitHub.

## Notes
- From `speck/ideas/2026-10-18-hand-back-a-pull-request-github-says-conflicts.md`. `whyNotMergeable` in `scripts/pr-ship.mjs` refuses a `CONFLICTING` or `DIRTY` pull request before ship's own landing test, which gives exit 13, is reached.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

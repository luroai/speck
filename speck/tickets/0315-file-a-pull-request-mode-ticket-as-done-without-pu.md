---
id: "0315"
title: "File a pull request mode ticket as done without pushing to the base branch"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:34:19.579Z"

---
# 0315 · File a pull request mode ticket as done without pushing to the base branch

**Status:** 🔨 building

## Problem
In pull request mode, shipping merges the ticket's pull request on GitHub, but filing the shipped ticket as done still commits and pushes straight to the base branch. A base branch protected so that it only takes pull requests refuses that push, and protection is the main reason to use pull request mode.

## Outcome
In pull request mode, a ticket is filed as done without anything being pushed straight to the base branch.

## Acceptance criteria
1. With `ship_mode: pr`, the ticket's move to done is committed on the ticket's own branch before its pull request is merged, so it reaches the base branch through the pull request.
2. Shipping in pull request mode pushes nothing straight to the base branch: it merges the pull request, then brings the local base branch up to date from GitHub.
3. A pull request merged on GitHub by hand also leaves its ticket done on the base branch, with no push from speck.
4. With `ship_mode: local`, shipping works exactly as today.

## Out of scope
- Making GitHub's branch protection rules.

## Notes
- From `speck/ideas/2026-10-18-file-a-pull-request-mode-ticket-as-done-on-a-protected-branch.md` (inbox, from 0296).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

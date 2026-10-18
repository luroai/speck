---
id: "0296"
title: "Ship a pull request mode ticket by merging its pull request"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0295"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T14:26:55.074Z"

---
# 0296 · Ship a pull request mode ticket by merging its pull request

**Status:** 🔨 building

## Problem
In pull request mode (0295), an approved ticket has a pull request, but speck has no way to ship it: merging through GitHub, tidying up, and doing nothing more when you've already merged it on GitHub.

## Outcome
In pull request mode, shipping a ticket merges its pull request on GitHub and tidies up, the same way whether you ship it, speck run's queue ships it, or you merge it on GitHub yourself.

## Acceptance criteria
1. With `ship_mode: pr`, `speck ship <id>` merges the ticket's pull request with `gh` once its checks pass, then brings the local base branch up to date, files the ticket as done, and removes its worktree and branch, as a local ship does.
2. When the pull request has already been merged on GitHub, `speck ship <id>` only tidies up.
3. When the pull request can't be merged (failing checks, a conflict, or a review GitHub requires), nothing changes locally, and speck says why in one line. speck run's queue tries it again once the pull request changes.
4. speck run's queue ships pull request mode tickets this way when `auto_ship` covers them, and notices a pull request merged on GitHub and tidies up after it.
5. With `ship_mode: local`, shipping works exactly as today.

## Out of scope
- Approving pull requests on GitHub.

## Notes
- Unverified: `gh pr merge <number> --merge` and `gh pr view <number> --json state,mergeable,statusCheckRollup` behave as needed. Check them against the installed `gh` before building.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

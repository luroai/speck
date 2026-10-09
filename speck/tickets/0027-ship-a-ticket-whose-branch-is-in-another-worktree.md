---
id: "0027"
title: "Ship a ticket whose branch is in another worktree"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
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
# 0027 · Ship a ticket whose branch is in another worktree

**Status:** 📝 draft

## Problem
Several sessions often share one checkout. Today `speck ship` checks out the base branch in the folder it runs in, and git refuses to check out a branch that's already checked out in another worktree. So once builds run in their own worktrees (0028), shipping would fail while your main checkout sits on the base branch.

## Outcome
`speck ship` works for a ticket whose branch is checked out in another worktree, with the same result as today.

## Acceptance criteria
1. When the ticket branch is checked out in a worktree and the base branch is checked out in the main checkout, `speck ship <id>` (and `--auto`) run from either folder gives today's result: the ticket set to `done` on its branch, a merge commit on the base branch, the push, and the branch deleted locally and on the remote.
2. The base branch's checkout ends up with the merged files. Ship refuses, changing nothing, if that checkout has uncommitted changes to tracked files, or isn't on the base branch. Untracked files there only block it if the merge would overwrite them.
3. After a successful ship, the ticket's worktree is removed. When ship ran from inside that worktree, it says the folder is gone and prints the path of the base branch's checkout.
4. Every existing ship check still applies. A refused or conflicting ship leaves the worktree, both branches and both folders as they were.
5. Tickets built without a worktree ship exactly as today.

## Out of scope
- Creating worktrees (0028).

## Notes
- Comes before 0028, so builds only move into worktrees once they can ship from one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

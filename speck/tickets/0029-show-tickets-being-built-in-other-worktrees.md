---
id: "0029"
title: "Show tickets being built in other worktrees"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0028"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:09:23.994Z"

---
# 0029 · Show tickets being built in other worktrees

**Status:** 🔨 building

## Problem
Once builds run in their own worktrees (0028), a ticket's progress is committed on its branch in that worktree. From the main checkout, the ticket still reads `ready`, so `speck status` misleads you and another session could start the same ticket.

## Outcome
`speck status` shows tickets being built in other worktrees, with their real status.

## Acceptance criteria
1. Run from any checkout, `speck status` lists each ticket whose branch is checked out in a worktree under the status in that worktree's copy (`building`, `reviewing`, `blocked` or `approved`), not the status on the base branch, with the worktree path on the line below.
2. A ticket shows up once, under its in-progress status.
3. With no other worktrees, `speck status` output is unchanged.
4. The status skill says to resume an in-progress ticket in its worktree, and names the path.

## Out of scope
- Other commands (`next`, `pack`) reading from other worktrees.

## Notes
- Self-check: skips detached worktrees, missing worktree folders and worktrees whose ticket file can't be found, and escapes the branch prefix before matching. Found `product.md` not yet updated, and fixed that.
- Built with `speck start` in its own worktree: the first ticket built this way. The tooling check followed this repo's `.speck/scripts` symlink, and the main checkout stayed on `main` throughout.
- During the build, `/tmp` ran out of inodes again (test fixtures, now including `<repo>.worktrees` folders from `speck start` tests). 0017 should clean up those too.
- Pre-check: no ambiguities found, and no external facts.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

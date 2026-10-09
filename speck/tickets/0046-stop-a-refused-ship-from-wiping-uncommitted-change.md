---
id: "0046"
title: "Stop a refused ship from wiping uncommitted changes"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
type: bug                # blank, or bug
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0046 · Stop a refused ship from wiping uncommitted changes

**Status:** 📝 draft

## Problem
`speck ship` checks that the base branch's checkout is clean, then runs the tests (over a minute here) before it merges. If anything edits a tracked file in that checkout during the tests and the merge then fails, ship's undo runs `git reset --hard` there and silently throws the edit away. On 9 October this wiped an uncommitted `speck/product.md` edit three times while 0045 tried to ship, and each failure was reported as a "conflict", which hid the real cause.

## Outcome
A refused ship never discards changes it didn't make, and says plainly when your own uncommitted changes are what's in the way.

## Acceptance criteria
1. If the base branch's checkout has uncommitted changes to tracked files when ship is about to merge (for example, made while the tests ran), ship refuses before merging, names those files, and leaves them exactly as they were, content and staged state alike. Nothing is shipped and both branches are as they were.
2. When a merge fails for any other reason, any uncommitted change that was in the base checkout or the ticket's worktree just before the merge is still there, unchanged, after ship's undo.
3. A merge that fails because it would overwrite local changes is reported as that, naming the files, not as a conflict. A real conflict is still reported as a conflict, naming the conflicting files.
4. Every existing ship refusal and its exit code is unchanged, and a ship that succeeds behaves as it does now.

## Out of scope
- Resolving conflicts or retrying the ship (0048).
- Untracked files, which ship already handles by naming them.

## Notes
- Data loss, so risk is high.
- The undo is in `shipTicket` in `scripts/speck.mjs` (`git reset -q --hard baseSha` in the base checkout, and `branchSha` in the ticket's worktree).
- A test can make the edit happen at the right moment by setting `commands.test` to a command that edits a tracked file in the base checkout.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

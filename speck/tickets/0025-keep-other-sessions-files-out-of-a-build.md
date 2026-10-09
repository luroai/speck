---
id: "0025"
title: "Keep other sessions' files out of a build"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T11:57:27.546Z"

---
# 0025 · Keep other sessions' files out of a build

**Status:** 🔨 building

## Problem
Other sessions sometimes work in the same checkout during a build. Twice in recent builds their files appeared mid-build, and one `git add -A` committed and pushed five draft tickets that the builder hadn't written. Untracked files from elsewhere also make `speck review` refuse to run, though they aren't part of what's reviewed.

## Outcome
A build commits only the files it changed, and other sessions' untracked files don't block its review.

## Acceptance criteria
1. The build and review skills tell the builder to stage files by name and never to use `git add -A`, `git add .` or `git commit -a`. If files it didn't create or change appear, it leaves them alone and mentions them to the user.
2. `speck review` and `speck record` no longer refuse because of untracked files. They still refuse when tracked files are modified or staged and not committed.
3. `speck ship` is unchanged: it still requires a fully clean tree, including untracked files.

## Out of scope
- Running builds in separate worktrees (see the open question on worktrees).

## Notes
- Pre-check: no ambiguities found, and no external facts.
- `speck record` had no clean-tree check before, so AC2's "still refuse" is new for it: it now shares `speck review`'s check (tracked changes only). Three older tests recorded rounds with tracked edits uncommitted (the reply file swept into a commit by `git add -A`, then rewritten; or ticket and config edits not yet committed). Their setup now commits by name first; what each one checks is unchanged.
- Self-check: my own record test never applied its dirty states (the loop skipped the call), so it passed for the wrong reason; fixed so each case really is dirty. No code changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: `speck close` still refuses when any untracked file is outside the ticket, so another session's file in the ticket's tree would block closing a build. The ticket only covers review and record, so it's unchanged.

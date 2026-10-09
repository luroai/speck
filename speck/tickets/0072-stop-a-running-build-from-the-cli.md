---
id: "0072"
title: "Stop a running build from the CLI"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0070"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0072 · Stop a running build from the CLI

**Status:** 📝 draft

## Problem
The only way to end a build for good is to kill its process by hand, which leaves the ticket `building` with nothing to say why it stopped or how to carry on.

## Outcome
`speck stop <id>` ends a running build for good and leaves its ticket `blocked`, with its work kept and a way to carry on.

## Acceptance criteria
1. `speck stop <id>`, for a ticket whose build `speck run` launched and is running or paused, ends the build and every process it started, and prints that it's stopped. None of them is left running.
2. It then sets the ticket `blocked` with the blocked question `Stopped by you on <YYYY-MM-DD>.` and commits that, in the build's worktree. The ticket's branch, worktree and the build's commits stay as they were, so the panel shows the resume command for its session as for any blocked ticket.
3. `speck run` doesn't report the stopped build as a build that stopped or failed, and doesn't launch it again.
4. It refuses, with a plain message and a non-zero exit and changing nothing, when the ticket doesn't exist or has no running or paused build launched by `speck run`.

## Out of scope
- Throwing the work away and building the ticket again from scratch.
- The panel's stop button (0073).

## Notes
- After 0070, so a paused build can be stopped too.
- While a build runs, its ticket file lives in the build's worktree, and `speck status` reads it from there.
- product.md's `speck run` description and the list of commands need updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

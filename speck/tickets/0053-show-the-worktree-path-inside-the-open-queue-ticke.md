---
id: "0053"
title: "Show the worktree path inside the open queue ticket"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0051"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:33:00.275Z"

---
# 0053 · Show the worktree path inside the open queue ticket

**Status:** 🔨 building

## Problem
An in-flight ticket's row prints its worktree's absolute path, for example `~/projects/speck.worktrees/speck/0052-show-a-build-s-log-growing-as-it-runs`, which is longer than everything else in the row put together. It's useful only now and then, when you want to look in the build's folder.

## Outcome
A closed queue row stays short, and the worktree's full path is shown inside the open ticket.

## Acceptance criteria
1. A closed queue row shows nothing about the worktree.
2. Opening the ticket shows its worktree path in full, as text, in the same monospace style as the rest of the details, and opening it again closes it as before.
3. A ticket whose `worktree` is `null` shows nothing about it.
4. Everything else in the row is unchanged: the status line, the minutes since `started`, the chain icon, and the "waiting on" or "unlocks" text stay where they are.

## Out of scope
- The worktree's folder name, or where it's made (0028).
- Shortening the path with `~` or an ellipsis instead of hiding it from the row.
- Showing the branch name or the build's session id.

## Notes
- After 0051, which adds the open row.
- The path is printed by `queueItem` in `templates/panel.html` today, in an `.act.path` line under the status line.
- The panel gets the path from `worktree` in `/api/state` (0030). Nothing in the JSON changes.
- product.md says in-flight tickets show their worktree path, in the panel's queue section: it needs to say the path is inside the open ticket.
- A shortened path in the row instead of hiding it is the other option here; the user picked hiding it, with the full path in the open ticket.
- The 0034 AC5 test in `test/panel.test.mjs` asserted the path in the closed row, which AC1 reverses: that one assertion now checks the closed row leaves it out, and the path's own checks are in `test/panel-0053.test.mjs`.
- AC3 held before the change (a `null` worktree was never shown); its test keeps it so, open or closed.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0070"
title: "Pause a running build from the CLI until it's played"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0070 · Pause a running build from the CLI until it's played

**Status:** 📝 draft

## Problem
Once `speck run` has launched a build, the only way to halt it is to kill its process by hand, which ends it for good. The user sometimes wants a build to hold still for a while (to free the machine, or to look at what it has done so far) and then carry on as if nothing happened.

## Outcome
`speck pause <id>` holds a running build where it is, and `speck play <id>` carries it on from there.

## Acceptance criteria
1. `speck pause <id>`, for a ticket whose build `speck run` launched and is still running, stops the build and every process it started from doing any more work (its log stops growing, and it makes no commits or file changes) until it's played, and prints that it's paused. The ticket's status doesn't change.
2. `speck play <id>`, for a paused build, carries that same build on from where it was paused: the same session, the same worktree and branch with its work so far, and its output going on into the same log. It prints that it's playing.
3. While a build is paused, `speck run` doesn't report it as stopped and doesn't launch another build of the ticket, and it still counts towards `max_parallel_builds`. `speck status --json` gives that ticket `paused: true`, and every other ticket `paused: false`.
4. `speck pause` refuses, with a plain message and a non-zero exit and changing nothing, when the ticket doesn't exist, has no running build launched by `speck run`, or is already paused; `speck play` refuses in the same way when the ticket doesn't exist or isn't paused.
5. A paused build stays paused, and can be played, after the `speck run` that launched it is stopped and started again.

## Out of scope
- Stopping a build for good (0072).
- The panel's pause and play icon (0071).
- Builds started by hand with `/speck-build` rather than by `speck run`: they have no run record.

## Notes
- `speck run` launches each build with `detached: true`, so the build is the leader of its own process group and a signal can reach everything it started, including a Codex reviewer.
- Whatever the mechanism, criterion 2 has to hold for a real build, not only for a test's stand-in build command.
- Unverified: whether a Claude Code build frozen mid-request (for example with SIGSTOP) carries on cleanly after a long pause, or whether its connection to the model times out (it can't be checked without a real build). If it doesn't, play may need to end the frozen build and carry on its session instead.
- Checked 2026-10-09: `claude --resume <session-id>` continues a session by id, and combines with `-p` (`claude --help`, Claude Code 2.1.296).
- product.md's `speck run` description and the list of commands need updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

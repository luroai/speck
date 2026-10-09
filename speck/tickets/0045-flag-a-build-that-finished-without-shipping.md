---
id: "0045"
title: "Flag a build that finished without shipping"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T15:04:35.590Z"

---
# 0045 · Flag a build that finished without shipping

**Status:** 🔨 building

## Problem
A build started by `speck run` can finish without shipping: `speck ship --auto` refuses (as it did for 0035, over an uncommitted change in the main checkout), or the build stops partway. The panel still shows the ticket as normal, because approved tickets are assumed to ship within seconds, and the build's explanation goes only to a log file nobody sees. So the user isn't told that the ticket needs them.

## Outcome
When a build from `speck run` has finished but its ticket hasn't shipped, the panel shows the ticket in red as needing you, with the build's last message under it.

## Acceptance criteria
1. When a build launched by `speck run` exits, `speck run` adds `exited` (the ISO time) and `exit_code` (a number, or `null` when a signal stopped it) to `speck/.cache/runs/<id>.json`, keeping the fields already there. A later launch of the same ticket replaces the file, so an old exit never sticks to a new build.
2. `speck status --json` gives each ticket `build_exit`: `{"at": …, "code": …, "message": …}` when its run file has `exited`, or `null` when there's no run file, it can't be read or it has no `exited`. `at` and `code` come from `exited` and `exit_code`. `message` is the last 50 lines of `speck/.cache/runs/<id>.log`, with trailing blank lines dropped, or `null` when the log is missing or empty. Every existing field is unchanged.
3. In the panel's queue, an `approved` ticket with a `build_exit` is red on its left edge and its current step, the way a blocked ticket is, with "Build finished without shipping" and its `message` under it, as text. An `approved` ticket with no `build_exit` looks as it does now.
4. A `building` or `reviewing` ticket with a `build_exit` is shown the same way, with "Build stopped before finishing" instead.
5. Blocked tickets, `ready` tickets and tickets with no `build_exit` look as they do now.

## Out of scope
- The command to resume a build's session (0044).
- Shipping, retrying or restarting a build from the panel.
- Builds not started by `speck run`, which leave no run file.
- Working out why ship refused: the build's own last message says that.

## Notes
- Prompted by 0035: approved at 14:55, `speck ship 0035 --auto` refused because `speck/config.yml` had an uncommitted change in the main checkout, and nothing showed it.
- Replaces the assumption in 0034 that approved tickets aren't red because they ship within seconds. `speck/product.md` must say which tickets are red now.
- With text output, `claude -p` prints only its final message, so the end of the log is the build's own summary of what happened.
- Uses the run files from 0043. 0044 reads the same files, for a different field.
- No external facts beyond the above, which was seen in 0035's log on this machine.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

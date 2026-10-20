---
id: "0342"
title: "Show when each Codex build log entry happened"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0341"]                # ticket ids that must be done first
created: 2026-10-20

---
# 0342 · Show when each Codex build log entry happened

**Status:** 📋 ready

## Problem
Claude Code and Cursor builds' log lines show when they happened (0080, 0340), but Codex builds' can't: Codex's `--json` events carry no time at all. So a Codex build's log is the only one with no times, and someone following it can't tell when anything happened or whether it's stuck.

## Outcome
Lines in a Codex build's log show when they happened, as Claude Code and Cursor builds' lines do.

## Acceptance criteria
1. In a Codex build's log in the panel, each line that starts an entry (an agent message, a command or a file change) begins with the time speck run's build wrote that event, as `HH:MM:SS`, 24-hour, in the local time of the machine the panel runs on, then a space.
2. A Codex build keeps running, and its later lines keep getting times, when speck run stops or switches to its new code, as builds do today.
3. Pausing, stopping, resuming and handing back a Codex build work as before.
4. Claude Code and Cursor build logs still take each line's time from their own events, and show exactly as before.
5. No test that passed before this change fails.

## Out of scope
- Times for Codex logs written before this ships.
- The Foreman's own log, and `speck run`'s output in the terminal.

## Notes
- Builds are started detached, with stdout and stderr written straight to `speck/.cache/runs/<id>.log` (`scripts/run.mjs`, around line 363), so that they outlive speck run. Whatever records the times must keep that: a build mustn't stop, or stop being found by speck run, because speck run did.
- After 0341, which changes the same reader (`scripts/build-log.mjs`).
- Checked 2026-10-20: a Codex build (`codex exec --json`, the CLI on this machine) emitted `thread.started`, `turn.started`, `item.started`, `item.completed` and `turn.completed` events with no time field on any of them or their items.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

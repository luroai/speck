---
id: "0080"
title: "Show when each build log entry happened"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0018"]                # ticket ids that must be done first
created: 2026-10-10

---
# 0080 · Show when each build log entry happened

**Status:** 📋 ready

## Problem
The panel's build log shows what a build did but not when. Reading it, you can't tell whether a step took seconds or twenty minutes, or how long ago the build last did anything.

## Outcome
Each entry in the panel's build log shows the time it happened.

## Acceptance criteria
1. In the build log of an open queue row, each line that starts an entry from a log event with a timestamp (an agent message, a tool call or a failed tool result) begins with that time as `HH:MM:SS`, 24-hour, in the local time of the machine the panel runs on, then a space.
2. No time is added to the other lines of a multi-line agent message, to blank lines, or to lines from events with no timestamp (the build's final result and `Build ended: …`) or lines that aren't events.
3. An event whose timestamp is missing or can't be read shows its line without a time, and the rest of the log shows as before.
4. Only the build log box changes. The failure message under a queue row and `speck run`'s output in the terminal stay as they are.

## Out of scope
- Dates, elapsed times or durations between entries.
- Timestamps in logs from builders other than Claude Code.

## Notes
- After 0018, which moves the panel's code, including the log endpoint, into its own module.
- Checked 2026-10-10: in Claude Code's `--output-format stream-json` logs (`speck/.cache/runs/0018.log`, `0073.log`), `assistant` and `user` events carry `"timestamp"` as ISO 8601 UTC, for example `2026-10-10T11:56:45.034Z`. `result` and `system` events have none.
- Tests should set `TZ` so the expected local time is fixed.
- Assumption: AC4 keeps the failure message and `speck run`'s output without times. Say if you want times there too.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

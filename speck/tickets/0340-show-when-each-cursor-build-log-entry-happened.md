---
id: "0340"
title: "Show when each Cursor build log entry happened"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T20:26:02.603Z"

---
# 0340 · Show when each Cursor build log entry happened

**Status:** 🔨 building

## Problem
A Cursor build's log in the panel has no times on its lines, while a Claude Code build's lines each start with `HH:MM:SS` (0080). The log reader only reads an ISO `timestamp` string, and Cursor's stream-json events carry `timestamp_ms`, a number of milliseconds since 1970, instead. Its shell-command lines get no time either way. Someone following a Cursor build can't tell when anything happened or whether it's stuck.

## Outcome
Lines in a Cursor build's log show when they happened, as Claude Code builds' lines do.

## Acceptance criteria
1. In the build log of an open queue row, each line that starts an entry from a Cursor event with a `timestamp_ms` number (an agent message, or a shell command starting) begins with that time as `HH:MM:SS`, 24-hour, in the local time of the machine the panel runs on, then a space, as 0080 does for Claude Code events.
2. A Cursor event with no `timestamp_ms`, or one that isn't a usable number, shows its line without a time, and the rest of the log shows as before.
3. No time is added to the other lines of a multi-line agent message, to blank lines, to a failed shell command's `✗` line, or to the build's final result and `Build ended: …`, as for Claude Code.
4. Claude Code and Codex build logs show exactly as before.
5. No test that passed before this change fails.

## Out of scope
- Times on Codex build log lines, whose events carry no time (0342).
- Lines for Cursor's reads, edits and searches, which aren't shown at all yet (0341).
- The failure message under a queue row and `speck run`'s output in the terminal, as in 0080.

## Notes
- Builds on 0080. The reader is `readable` in `scripts/build-log.mjs`: `clock` takes only an ISO `timestamp` string, and the Cursor shell branch (`tool_call` with `shellToolCall`) adds no time.
- Checked 2026-10-20: a real Cursor stream (`agent -p --force --trust --output-format stream-json --model auto`, the CLI on this machine) gave `timestamp_ms` numbers such as `1792511607818` on its `thinking`, `assistant` and `tool_call` events, and none on `system`, `user`, the last `assistant` event or `result`. Read through `readablePiece` with `times: true`, its lines came out as `I'll run \`ls\`, then reply with done.` and `→ Shell: ls` with no time, while a Claude Code event with `timestamp` gave `13:00:05 Reading the ticket.`.
- Test it by calling `readablePiece` directly with Cursor-shaped events.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0013"
title: "Resume a configured reviewer's session between rounds"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0012"]                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T21:41:33.861Z"

---
# 0013 · Resume a configured reviewer's session between rounds

**Status:** 🔍 reviewing

## Problem
After 0012, a command reviewer gets the whole history resent every round. That costs tokens, and the reviewer re-reads everything instead of continuing the conversation it already had, which is what Codex does today.

## Outcome
A command reviewer that supports resuming a session continues the same session in later rounds, as the Codex reviewer does.

## Acceptance criteria
1. A reviewer's `reviewer_options` entry can set `session_id_path`, a dot path into the command's JSON output (for example `session_id`). When set, the value found there is saved with the round as `thread_id`.
2. When the entry also has `resume_command` containing `{session}`, rounds after the first run it with the latest saved `thread_id` and send only the round-2 prompt (builder response, diff since last review, test output), as Codex rounds do today.
3. If there's no saved `thread_id`, no `resume_command`, or the resume command exits non-zero, speck runs the plain `command` with the full history as in 0012 and says so in one line of output, rather than failing.
4. The review pack shows, for each round, whether it continued a session or started fresh.

## Out of scope
- Codex's existing resume logic, which stays as it is.
- Listing or cleaning up old reviewer sessions.

## Notes
- After 0012.
- **Live run (2026-10-08).** In a throwaway repo, `reviewer: claude` had `session_id_path: session_id` and `resume_command: "claude -p --output-format json --permission-mode plan --resume {session} --model {model} --effort {effort}"` on `haiku`. A two-round review of a sample ticket ran through this branch's `speck review`. Round 1 started fresh and saved Claude's `session_id`. Round 2 ran the resume command with that id and only the round-2 prompt, with no fallback line. The reviewer referred back to its round-1 findings and approved. The pack shows round 1 as `fresh session` and round 2 as `continued session`. Claude Code 2.1.294's `--help` confirms `-r, --resume <session id>` works in print mode.
- Every review history line in the pack now ends with the session label, for example `; fresh session`. Rounds recorded with `speck record` (a `claude-subagent`, for instance) show `session not recorded` after round 1, because speck can't see whether the builder resumed the same subagent.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

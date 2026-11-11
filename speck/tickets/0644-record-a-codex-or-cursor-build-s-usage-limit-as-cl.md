---
id: "0644"
title: "Record a Codex or Cursor build's usage limit as Claude's is"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0642"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:51:45.219Z"

---
# 0644 · Record a Codex or Cursor build's usage limit as Claude's is

**Status:** 🔨 building

## Problem
speck records a usage limit and carries the build on after the reset only when Claude stops a build (0622). A Codex or Cursor build that stops on its limit is treated as a build that stopped for an unknown reason.

## Outcome
A Codex or Cursor build that stops on its usage limit is waited out and carried on after the reset, as a Claude build is.

## Acceptance criteria
1. A Codex build whose log ends refused for its usage limit (`usage_limit_exceeded`) is recorded as a usage limit for Codex, with the reset time its message or its session file gives, and `speck run` carries it on a minute after the reset, as 0622 does for Claude.
2. A Cursor build whose output ends refused for its usage limit is handled the same way for Cursor, with the reset time when its message gives one and otherwise a retry after 30 minutes, as 0622 does without one.
3. While an agent's limit is recorded, `speck run` starts nothing on that agent, and `speck status` and the panel say which agent is limited and until when.
4. No test that passed before this change fails.

## Out of scope
- Moving the work to another agent: 0647 and 0648.

## Notes
- Claude's limit is `scripts/usage-limit.mjs` (0622, `holds` is Claude only); reviewers' limits are `scripts/reviewer-limit.mjs` (0623), whose `REFUSED` already matches Codex's "You've hit your usage limit" text.
- Checked 2026-11-11: a refused Codex run ends with `"codex_error_info":"usage_limit_exceeded"` and "…try again at 3:41 AM", a local time without a date.
- Checked 2026-11-11: Cursor's CLI (2026.11.11) has no wording of its own for its limit: the message comes from Cursor's server, and the CLI classes it by error codes such as `PRO_USER_USAGE_LIMIT` and `FREE_USER_USAGE_LIMIT`. So it's matched loosely, as `REFUSED` does.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0718"
title: "Count a delegated Codex session's later turns"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-count-a-delegated-codex-session-s-later-turns.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:24:47.320Z"

---
# 0718 · Count a delegated Codex session's later turns

**Status:** 🔨 building

## Problem
A Codex session started in a ticket's worktree is recorded once, with the tokens it had when that build ended. If a later build carries the same session on, the extra tokens aren't counted, so the ticket shows less spend than it really cost.

## Outcome
A delegated Codex session carried on by a later build counts at its newest total, once.

## Acceptance criteria
1. When a later build of the same ticket carries on a Codex session already recorded for that ticket, and its tokens have grown, the ticket's spend counts that session at its newest total, once.
2. A sub-agent session started later under an already recorded session is counted.
3. A session whose tokens haven't grown, or one recorded for another ticket, a review round, a watch run or a build itself, isn't counted again.
4. No test that passed before this change fails.

## Out of scope
- Cursor sessions: saved rounds show Cursor reports each run's own usage.

## Notes
- `recordDelegatedSpend` (`scripts/spend.mjs`, called from `scripts/run.mjs` when a build ends) skips any thread already in `run.delegated-spend.jsonl`, and `delegatedOf` keeps the first entry per thread.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

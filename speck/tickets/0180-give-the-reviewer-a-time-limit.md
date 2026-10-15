---
id: "0180"
title: "Give the reviewer a time limit"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T11:11:39.043Z"

---
# 0180 · Give the reviewer a time limit

**Status:** 🔨 building

## Problem
speck runs the Codex reviewer, and any reviewer set up as a command, with no time limit. If one hangs, the review waits for ever, and so does its build, which keeps holding one of `max_parallel_builds`.

## Outcome
A reviewer that runs too long is ended, and the review round fails with a message that says so.

## Acceptance criteria
1. A reviewer run by speck (Codex, or a reviewer command under `reviewer_options`) that hasn't finished after `review_timeout_minutes` (in `speck/config.yml`, default 30) is ended, with every process it started. The round fails with a message saying the reviewer took longer than that many minutes and nothing was recorded.
2. Nothing from the ended attempt is recorded as a round, and the round can be run again as normal.
3. `review_timeout_minutes` must be a whole number of 1 or more. Any other value is refused with a message saying how to fix it.
4. A reviewer that finishes within the limit works exactly as before.
5. No test that passed before this change fails.

## Out of scope
- The claude-subagent reviewer, which runs inside the builder's own session rather than as a process speck starts.
- A time limit on whole builds (`speck/ideas/2026-10-13-look-into-a-build-that-runs-long.md`).

## Notes
- `scripts/review.mjs` runs `codex` through `sh()` (spawnSync, no timeout), and `runReviewer()` in `scripts/reviewers.mjs` likewise.
- Follows `test_stall_minutes` (0152) for the setting's checks and wording.
- Codex rounds took 29 to 44 seconds on 2026-10-14 (0164), so 30 minutes is generous.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

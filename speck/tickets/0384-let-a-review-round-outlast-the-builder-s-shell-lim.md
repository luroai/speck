---
id: "0384"
title: "Let a review round outlast the builder's shell limit"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-let-a-review-round-outlast-the-builder-s-shell-limit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0383"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T20:13:36.538Z"

---
# 0384 · Let a review round outlast the builder's shell limit

**Status:** 🔨 building

## Problem
speck lets a reviewer run for `review_timeout_minutes` (30 by default). But a builder waits for `speck review` in one foreground shell command, and Claude Code ends such a command after 10 minutes. `speck run`'s Claude Code builds can't run commands in the background (0245). On 0368, a Grok review was still running at 10 minutes, so the builder's shell ended the round. The builder then improvised a detached run and a polling loop.

## Outcome
A review round that runs longer than 10 minutes still finishes and is recorded. The builder waits for it through speck commands that each return within that limit.

## Acceptance criteria
1. A round's reviewer may be Codex, Claude, Cursor or a command under `reviewer_options`. If it's still running 9 minutes after `speck review` started, `speck review` exits with code 12. It prints that round <n> is still running and the exact command to wait for it. The reviewer carries on, and is still ended `review_timeout_minutes` after it started, as today.
2. The printed command waits up to 9 minutes for that same round. If the reviewer finishes, or had already finished before the command ran, the command records the round, prints and exits exactly as `speck review` would have: 0, 10 or 11, or a failure message with nothing recorded. If the reviewer is still running, it exits 12 again with the same command. No round ever gets a second reviewer: while one is running, `speck review <id>` waits for it rather than starting another.
3. A reviewer that finishes within 9 minutes gives the same output, exit code and recorded round as today. The panel shows the round as running for as long as its reviewer runs, through every exit 12.
4. The review skill and the build skill tell the builder that exit 12 means the round is still running. The builder should run the printed command in the foreground, again each time, until it exits with any other code.
5. No test that passed before this change fails.

## Out of scope
- The `claude-subagent` reviewer, which runs through the Agent tool, not the shell.
- Changing `review_timeout_minutes` or its default.
- Making the 9 minutes a setting.
- 0383, which reads a verdict that comes after prose.

## Notes
- Checked 2026-10-22: Claude Code's Bash tool allows at most 600000 ms (10 minutes) for one foreground command (its tool description). `speck run` sets `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` for its Claude Code builds (0245). 9 minutes leaves a minute to spare.
- Checked 2026-10-22: no exit code 12 is in use. `speck review` exits 0, 10 or 11 (`scripts/review.mjs`).
- Tests may shorten the 9 minutes the way `SPECK_REVIEW_TIMEOUT_MS` shortens the review time limit (`scripts/reviewers.mjs`).
- Related: 0180 (the reviewer's time limit, `scripts/limit.mjs`), 0223 (the running round's record, `<id>.review.json`, in `scripts/review-running.mjs`) and 0227 (foreground test runs and review rounds).
- Waits for 0383: both change `scripts/reviewers.mjs`.
- A priority 0 fix: a slow reviewer stalls every build it reviews.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

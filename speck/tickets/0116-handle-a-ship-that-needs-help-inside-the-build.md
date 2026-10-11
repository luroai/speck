---
id: "0116"
title: "Handle a ship that needs help inside the build"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T11:19:50.797Z"

---
# 0116 · Handle a ship that needs help inside the build

**Status:** 🔨 building

## Problem
0101 added the `speck-integrate` skill for a ship queue to start, but the queue (0102–0105) was cancelled when speck moved to one build at a time. Nothing starts the skill, so its handling of conflicts and of a failing base branch never runs.

## Outcome
`/speck-build` handles a ship that needs help itself, using `speck-integrate`'s steps, and the separate skill is gone.

## Acceptance criteria
1. When `speck ship <id> --auto` exits with 13 (a conflict), the build skill resolves it with `speck-integrate`'s steps: `speck merge-check`, resolving each file by its class, running the tests and a merge round before shipping again. After two merges that still conflict, it blocks the ticket with the files in its question, as today.
2. When it exits with 14 (the base branch's own tests fail), the build skill changes no code. It creates one fix ticket (`--type=fix`) describing the failure in plain words, unless an open fix ticket already covers it, sets it ready, then stops and tells the user, leaving its own ticket `approved`.
3. The build skill asks the user only when two tickets contradict each other or a merge round blocks, in plain words without git terms, with the options and its recommendation.
4. `speck init` no longer installs `speck-integrate`, and re-running it removes the copy an earlier version installed. The brief no longer describes the skill or the ship queue.
5. No test that passed before this change fails.

## Out of scope
- Shipping a simple merge without review (`speck/ideas/2026-10-11-ship-a-simple-merge-without-another-review.md`).

## Notes
- Assumption for AC2: the fix ticket is set ready without asking, so it builds next, ahead of everything else at priority 0. This fits "set them ready and walk away". The other choice is to leave it as a draft for you.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

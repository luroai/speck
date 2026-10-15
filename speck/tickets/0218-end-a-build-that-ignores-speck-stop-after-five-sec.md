---
id: "0218"
title: "End a build that ignores speck stop after five seconds"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-keep-speck-stop-s-five-second-wait-to-five-seconds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0217"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:48:31.383Z"

---
# 0218 · End a build that ignores speck stop after five seconds

**Status:** 🔨 building

## Problem
`speck stop` asks each of a build's processes to end, then checks 50 times, 100 ms apart, before forcing them. Each check lists every process on the machine, which is slow on a busy one, so a process that ignores the request is forced after about 11 seconds rather than 5. Someone pressing Stop build waits twice as long as meant.

## Outcome
`speck stop` forces a process that ignores it to end about five seconds after asking.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a build's process ignores the request to end, `speck stop` forces it to end no later than 6 seconds after first asking, even when each check of the running processes takes 200 ms or more.
2. A process that ends when asked isn't forced, and `speck stop` returns as soon as all the build's processes have ended, as today.
3. No test that passed before this change fails.

## Out of scope
- Making each check of the running processes faster.

## Notes
- The wait is the loop in `endBuild()` in `scripts/run.mjs`, which counts checks rather than time.
- Seen while timing `test/stop-0072.test.mjs` in 0198: its `speck stop` took about 11 s.
- Failing before this build: none
- Self-check: the five seconds are timed with a monotonic clock, so a change to the system clock can't shorten or stretch the wait.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

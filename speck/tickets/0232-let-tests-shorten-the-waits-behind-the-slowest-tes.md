---
id: "0232"
title: "Let tests shorten the waits behind the slowest tests"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0231"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:33:37.045Z"

---
# 0232 · Let tests shorten the waits behind the slowest tests

**Status:** 🔨 building

## Problem
speck's slowest passing tests spend most of their time waiting for real limits to run out, such as `speck stop`'s 5-second wait or speck run's polling. On an 8 GB MacBook Air, 25 tests took 10 s or more each, 372 s in total.

## Outcome
The slowest tests run against limits they set shorter, while speck itself waits as long as it does today.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. Each passing test listed in Notes that waits for one of speck's own limits to run out can set that limit shorter, as `SPECK_STALL_MS` and `SPECK_REVIEW_TIMEOUT_MS` already allow, and does.
2. Without those settings, speck waits as long as today.
3. Each changed test still checks its criterion: it fails when the behaviour it checks is broken.
4. No test that passed before this change fails.

## Out of scope
- Tests that are slow because they fail on a busy machine.
- Waits in the browser tests' page stubs (0234).

## Notes
- The passing tests at 10 s or more, measured 2026-10-15 on an 8 GB MacBook Air: 0084 private words AC2 and AC3 (13.6 to 18.9 s), 0177 AC3 (17.0 s), 0148 AC3 (15.9 s), 0176 (15.6 s), 0099 AC4 (12.6 s), the cancel reason AC1/AC4 test (11.4 s), 0075 AC1 (10.4 s) and 0100 AC3 (10.3 s). `test/stop-0072.test.mjs` (22.8 s) failed in that run.
- Some of these may be slow for another reason (for example many CLI starts); leave those and say so in the Delivery log.
- 0218 changes `speck stop`'s wait to go by the clock and is planned after this.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0175"
title: "End every process a test leaves running"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-13-stop-the-pause-and-stop-tests-leaving-processes-running.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T19:37:04.183Z"

---
# 0175 · End every process a test leaves running

**Status:** 🔨 building

## Problem
Every full test run leaves processes running for good. The test setup deletes each test file's temporary folder afterwards, but never ends what the tests started, and some test helpers wait for ever for a file in that folder. On 2026-10-14, 474 leftovers held about 13 GB of the machine's 15 GB of memory (7.5 GB of processes, and 5.8 GB of deleted logs they kept writing to in `/tmp`, which is held in memory here). The load average reached about 118, the panel stopped answering, the full suite went from 64 to 262 seconds, and builds took twice as long.

## Outcome
When a test file finishes, nothing it started is still running, however its tests ended.

## Acceptance criteria
1. Within 10 seconds of a test file finishing, whether its tests passed, failed or timed out, no process it started, directly or indirectly, is still running. That includes processes in a session or process group of their own.
2. If a test file's own process is stopped with SIGINT, SIGTERM or SIGHUP, the same holds within 10 seconds.
3. A test helper that loops waiting for a file in the test's temporary folder ends by itself within 10 seconds of that folder being removed, so one left behind by a test file killed with SIGKILL doesn't run for ever. This covers the ticker build and its helper in `test/support/ticker.mjs` and the gated test command in `test/ship-0153.test.mjs`.
4. Five full `npm test` runs in a row, each with a second full run going alongside it, leave no process from either run still running 10 seconds after they finish.
5. No test that passed before this change fails.

## Out of scope
- speck itself leaving a killed ship's tests running (0174).
- Processes left by earlier test runs. They were ended by hand on 2026-10-14.
- Making tests faster.

## Notes
- `test/support/tmp.mjs` gives each test file its own folder and sets `TMPDIR`, `TMP` and `TEMP` to it, and every process a test starts inherits them. `processesWithEnv()` in `scripts/run.mjs` already finds processes by an environment entry, on Linux and macOS.
- Run one file at a time, only `test/ship-0153.test.mjs` leaves processes (two wait loops each run). The ticker leaks (pause, stop and waiting tests) show up only when the full suite runs under load, so they depend on timing: fix them by cleaning up, not by chasing each race.
- Moved here from 0174, which had this as its AC3.
- Supersedes the inbox note from 0152 (about 17 leftover tickers on 2026-10-13).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0174"
title: "Stop a killed ship leaving its test run behind"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0175"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0174 · Stop a killed ship leaving its test run behind

**Status:** 📝 draft

## Problem
When `speck ship`, `speck test` or a build is killed while its tests run, the test command keeps running, because speck runs it in its own process group. The 0153 tests do this on purpose, and their test command waits for a file that is never made, so each full suite left loops behind that never end. On 2026-10-14, 346 of them, some 18 hours old, pushed the load average above 100, hung the panel and made other tests fail.

## Outcome
Killing a ship, test run or build ends its test command too.

## Acceptance criteria
1. When `speck ship` or `speck test` is killed with SIGKILL while its test command is running, the test command and every process it started have ended within 10 seconds.
2. When a build is stopped with `speck stop <id>`, or from the panel, while it is running the tests, the test command and every process it started have ended within 10 seconds.
3. A test command that isn't killed still runs to the end, and the stall limit from 0152 still ends one that stops writing output.
4. No test that passed before this change fails.

## Out of scope
- The tests that check speck run has stopped too soon (0173).
- speck's own tests leaving processes running, including the 0153 tests that kill a ship part-way through (0175, which took this ticket's old AC3).
- Killing processes left behind before this ships. They were cleared by hand on 2026-10-14.

## Notes
- `scripts/stall.mjs` starts the test command with `detached: true`, so it gets its own process group. The 0153 tests spawn `speck ship` detached and kill its group with SIGKILL, which doesn't reach the test command's group.
- The leftover loops came from `gated()` in `test/ship-0153.test.mjs`: `sh -c 'touch reached; while [ ! -f go ]; do sleep 0.05; done'`. The "killed" tests never write `go`, and the temporary folder is then deleted.
- Two other leftovers were found on the same day: a `speck run` and a `speck panel` started by 0171's tests in `/tmp/speck-test-…` folders. If the same cause doesn't explain them, record what does in Follow-ups instead of fixing them here.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

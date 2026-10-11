---
id: "0118"
title: "Stop panel tests failing when another test takes their port"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-make-the-test-suite-faster.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:35:54.329Z"

---
# 0118 · Stop panel tests failing when another test takes their port

**Status:** 🔨 building

## Problem
Panel tests fail now and then with "Port … is already in use, so the panel didn't start". The helper `freePort()` in `test/support/panel.mjs` finds a free port, releases it, and the panel is started on it a moment later. Meanwhile another test file running in parallel can take the same port. It stopped 0097 shipping, and it cost 0111's build a re-run. Each time, the builder had to work out that it wasn't their change.

## Outcome
A panel test no longer fails because another test took the port it picked.

## Acceptance criteria
1. When the port a panel test picked is already taken by the time the panel starts, the test starts the panel on another free port and carries on, instead of failing. A test proves this by holding the picked port open itself.
2. A panel that fails to start for any other reason still fails the test, with the panel's own message.
3. Requests in a test go to the port the panel actually started on.
4. No test that passed before this change fails.

## Out of scope
- Changing `speck panel` itself, for example accepting `--port 0`. This is a fix to the tests only.
- Speeding up the panel tests (0117 and the fixed waits).

## Notes
- `freePort()` is used 41 times across about 20 test files. Most go through `startPanel()`.
- Seen 2026-10-11 with no other build running, so it's a race inside one suite run, not between builds.
- Failing before this build: none
- Self-check: no changes (checked a missing or malformed --port value, the panel exiting before its message is read, and a panel that starts on a port other than the one given, which startPanel stops and fails)

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

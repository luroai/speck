---
id: "0091"
title: "Say plainly on Windows that speck doesn't support it yet"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:57:08.603Z"

---
# 0091 · Say plainly on Windows that speck doesn't support it yet

**Status:** 🔨 building

## Problem
speck supports only macOS and Linux for now, and parts of it, such as pausing and stopping builds, rely on them. On Windows, `speck init` and `speck doctor` say nothing about this, so someone there finds out only when something fails.

## Outcome
On Windows, `speck doctor` and `speck init` say plainly that speck doesn't support it yet and suggest WSL.

## Acceptance criteria
1. On Windows, `speck doctor` shows a ✗ item saying speck supports macOS and Linux for now, with the fix: use WSL (Windows Subsystem for Linux) and run speck there.
2. On macOS and Linux, no such item appears, and every other check is unchanged.
3. `speck init` on Windows shows the same item in its checks, so it ends by asking you to fix the ✗ items.

## Out of scope
- Making any speck command work on Windows.

## Notes
- Tests can't run on Windows here, so the check should take the platform as an input that tests can set.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

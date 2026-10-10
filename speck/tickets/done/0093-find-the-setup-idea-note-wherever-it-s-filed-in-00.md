---
id: "0093"
title: "Find the setup idea note wherever it's filed in 0082's check"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
cancel_reason: "Not needed: 0090 made the same one-line fix to 0082's test and shipped it, so main passes again."
cancelled: 2026-10-10

---
# 0093 · Find the setup idea note wherever it's filed in 0082's check

**Status:** ❌ cancelled

## Problem
0082's AC4 test reads the setup idea note at `speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md`. Ticketing that idea (0086–0089) filed the note in `speck/ideas/done/`, as speck does, so the test and the two 0084 tests that run 0082's checks fail on main. Every build's ship runs the full suite, so nothing can ship: 0090 and 0091 are approved but stopped.

## Outcome
0082's check finds the setup idea note in whichever ideas folder it's filed in, and the full suite passes on main again.

## Acceptance criteria
1. 0082's AC4 test reads the setup idea note from `speck/ideas/` if it's there, otherwise from `speck/ideas/done/`, and checks the same sentence as before.
2. If the note is in neither folder, the test fails with a message naming both paths, not a file-not-found stack trace.
3. The full test suite passes on main, including 0084's AC2 and AC3.

## Out of scope
- Changing what 0082's check looks for.
- Shipping 0090 and 0091, which happens once this is on main.

## Notes
- Caused by the ticketing on 2026-10-10, not by any build. The same fix is captured as an inbox note on 0091's branch (`speck/ideas/2026-10-10-fix-tests-that-read-a-filed-idea-note.md`), which reaches main when 0091 ships.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

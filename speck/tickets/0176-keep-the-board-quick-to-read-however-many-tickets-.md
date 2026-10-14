---
id: "0176"
title: "Keep the board quick to read however many tickets are built"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-14

---
# 0176 · Keep the board quick to read however many tickets are built

**Status:** 📝 draft

## Problem
Every read of the board (`speck status --json`, `speck run`'s check every 5 seconds, and the panel's `/api/state`) reads and parses every finished build's whole log to find its last 50 lines. With 128 logs (55 MB) on 2026-10-14, one read took about 750 ms of CPU, 63% of it in the logs. It grows with every ticket built, so `speck run` and the panel head towards being busy all the time.

## Outcome
How long the board takes to read doesn't depend on how big the build logs are.

## Acceptance criteria
1. With 200 tickets that each have a finished build, making every build log 10 times bigger (from 200 KB to 2 MB) adds less than 10% to how long `speck status --json` takes.
2. Each ticket's `build_exit.message` is exactly what it was before this change, for any log. That includes a log whose last 50 readable lines span more than its last few hundred KB, for example one ending in very long tool-output lines.
3. With 200 finished builds whose logs are 2 MB each, an idle `speck run` (no ready tickets) uses on average less than 5% of one CPU core over a minute.
4. No test that passed before this change fails.

## Out of scope
- How often the panel asks for the board, and how much it sends (0177, 0178, 0179).
- Removing old build logs.

## Notes
- `buildExit()` in `scripts/speck.mjs` reads the whole `<id>.log` and runs `readableLog()` over it for every ticket with a run record. On 2026-10-14 that was 63% of `statusData()`'s time.
- The panel uses `build_exit.message` only for tickets in the queue (`templates/panel.html`, around line 681).
- The field names of `speck status --json` are a contract (0030).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

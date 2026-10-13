---
id: "0159"
title: "Stop the 0149 panel tests hanging the full suite"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T22:50:12.210Z"

---
# 0159 · Stop the 0149 panel tests hanging the full suite

**Status:** 🔨 building

## Problem
Since 0149 shipped, the full test suite on `main` hangs in about a third to a half of runs, always just after test 714, in `test/panel-0149.test.mjs`. On its own the file passes in a few seconds every time; it hangs only when the whole suite runs side by side. Every hang costs a build or a ship 5 to 10 minutes (0150 took 26 minutes, 0152 over 45), and before 0152 it stalled 0149's own ship.

## Outcome
The full suite on `main` finishes every time in its usual time, and the 0149 browser test still checks what it did.

## Acceptance criteria
1. Ten full-suite runs in a row (`npm test`, one after another, on this machine) all finish without hanging, each within 3 minutes.
2. The 0149 AC4 browser test still checks that the page reports no manifest errors and that its icons load and match `icon.svg`.
3. Every wait in `test/panel-0149.test.mjs`, and in any helper in `test/support/` it calls that can wait on the browser or the panel, has a time limit. If the limit passes, the test fails with a message naming what it was waiting for, instead of hanging.
4. The ticket's Notes say in plain words what made the test hang under load.
5. No test that passed before this change fails.

## Out of scope
- Watching for stalled test runs in general (0152).
- Speeding up the rest of the suite.

## Notes
- Evidence: the hang stops output right after test 714 in `speck/.cache/results/run.85b8dba7-….out` (0149's ship, 20:42) and in 0150's and 0152's builds. 0152's builder found 3 hangs in 6 runs through speck, and one hang in a direct piped `node --test` run, so it isn't caused by speck's watchdog.
- The browser test (line 173) opens Chrome through `browserPage()` and polls `Page.getAppManifest` up to 50 times; Chrome DevTools calls through `b.send` may have no time limit.
- Run on its own, the file passed 3 times out of 3 in 5 to 8 seconds (2026-10-13 22:30).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

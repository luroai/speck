---
id: "0179"
title: "Stop the panel asking for updates it can't use"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-stop-asking-for-a-log-once-its-build-has-ended.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0178"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0179 · Stop the panel asking for updates it can't use

**Status:** 📝 draft

## Problem
The panel page asks for the board every 2 seconds, and for an open build log every second, even while its tab is hidden or the phone's screen is off. It also keeps asking for a finished build's log, which can't change. Each request costs the server work (see 0176 to 0178).

## Outcome
The panel asks for updates only while it can be seen, and stops asking for a log that can't change.

## Acceptance criteria
1. While the page is hidden (`document.visibilityState` is `hidden`), it sends no requests for the board or for logs.
2. When it becomes visible again, it asks for the board and for each open log at once, then carries on as before.
3. An open log whose build has exited (its ticket has a `build_exit`) is asked for once more, then not again until a new build of that ticket starts.
4. No test that passed before this change fails.

## Out of scope
- Pushing changes to the page instead of polling (`speck/ideas/2026-10-11-update-the-panel-in-real-time.md`).

## Notes
- `poll()`, `startLogTimer()` and `logTick()` in `templates/panel.html`.
- From the idea note's open question: a new build of the ticket starts the requests again.
- Unverified: the Page Visibility API (`document.visibilityState`, the `visibilitychange` event) behaves the same in the headless Chromium the tests use as in browsers (not checked today).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

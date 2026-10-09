---
id: "0051"
title: "Expand a queue ticket to read its build log"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0051 · Expand a queue ticket to read its build log

**Status:** 📋 ready

## Problem
A build runs for tens of minutes and the queue shows only its five-step bar, so you can't tell whether it's working or stuck without leaving the panel. `speck run` already writes everything the build prints to `speck/.cache/runs/<id>.log` (0043), and the panel uses only the last 50 lines of it, and only once the build has exited (0045).

## Outcome
Clicking a queue ticket's top row opens it and shows the tail of its build's log, formatted for reading.

## Acceptance criteria
1. The panel's server answers `GET /api/tickets/<id>/log` with 200 and JSON `{"text": "…", "truncated": true|false}`: the last 200 lines of `speck/.cache/runs/<id>.log` in the main checkout, read afresh for every request, with trailing blank lines dropped, and `truncated` true when the file has more than 200 lines. A ticket with no log gets `{"text": "", "truncated": false}`, still 200. Every other request rule is unchanged (the `Host` allow-list, `GET` only, 404 for other paths).
2. Clicking the top row of a queue ticket opens it, and clicking that top row again closes it. Clicking or selecting text inside the open ticket leaves it open, and more than one queue ticket can be open at once.
3. The open ticket shows the log as text in a monospace block with a fixed maximum height and its own scrollbar. ANSI escape sequences aren't shown, a run of blank lines is shown as one, `truncated` adds a line saying earlier lines aren't shown, and a ticket with no log shows "No log yet." in the block instead.
4. The log is always shown as text, never as HTML.
5. A log is asked for only for tickets that are open: with no queue ticket open, no `/api/tickets/<id>/log` request is made. Which tickets are open, and the scroll position of an open log, survive the 2-second refresh while that ticket's own data is unchanged.

## Out of scope
- Keeping an open log up to date while the build runs (0052).
- Where the worktree path is shown (0053).
- The red row's existing 50-line message for a build that has exited (0045), which stays as it is.
- Searching, filtering or downloading the log.

## Notes
- The endpoint is a read, like `/api/state`: no token, and the panel's known limit (anything that can reach `127.0.0.1` can read the board) already covers it. It adds no write.
- Checked 2026-10-09: `speck run` opens `speck/.cache/runs/<id>.log` for writing at each launch and sends the build's stdout and stderr to it, so the file is often being written to while the panel reads it (`runsDir` and `launch` in `scripts/speck.mjs`).
- The log holds whatever the build printed, which can include file contents and command output. It's shown as text only.
- A request failing (the server is down) leaves the last log on screen; the page's existing disconnect handling applies.
- The page's kept-item rule from 0050 takes the open set in `viewOf`, as Shaping does, so an open row and its scroll position stay put across the refresh.
- product.md's panel section needs the new endpoint and the open row.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

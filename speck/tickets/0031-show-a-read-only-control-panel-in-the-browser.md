---
id: "0031"
title: "Show a read-only control panel in the browser"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0030"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0031 · Show a read-only control panel in the browser

**Status:** 📋 ready

## Problem
Tickets are now moving fast and several build at once, and following them in Markdown files and `speck status` makes it hard to see what's running, what's next and what needs you. A read-only view in the browser shows the pipeline at a glance, without changing how speck works.

## Outcome
`speck panel` serves a read-only page on this machine that shows Shaping, the Queue and Shipped, and keeps up as tickets change.

## Acceptance criteria
1. `speck panel` starts a server bound to `127.0.0.1` on port 4777, or the port given with `--port <n>`, prints the URL and runs until stopped. If the port is in use, it exits non-zero with a message naming the port. A request whose `Host` header isn't `127.0.0.1:<port>` or `localhost:<port>` gets 403.
2. `GET /` returns the page and `GET /api/state` returns the same JSON as `speck status --json` at the time of the request. Any other path returns 404, and any method other than `GET` returns 405. The server never writes to the repo.
3. The page shows, in the layout and dark style of `docs/panel-mockup.html`: **Shaping** (draft tickets, each with its criteria count and lint result, and clicking one shows its acceptance criteria; then ideas whose status doesn't start with `ticketed`); the **Queue** in three groups: **Needs you** (blocked tickets with their question, and approved tickets), **Running** (building and reviewing tickets, with the worktree path when there is one and, while reviewing, the latest round number) and **Up next** (ready tickets numbered in the JSON's order, marked "waiting on <ids>" when `waiting_on` isn't empty); and **Shipped** (the 5 `done` tickets with the latest `finished` time, newest first, each with its number of review rounds, total tokens and the minutes from `started` to `finished`; `done` tickets with no `finished` time come after those, and the minutes are left out when either time is missing). Cancelled tickets aren't shown.
4. The page fetches `/api/state` every 2 seconds without reloading. A ticket whose status changes in its file, in this checkout or another worktree, moves to its new area within 5 seconds. While the server can't be reached, the page says it's disconnected, and it recovers by itself when the server is back.
5. Text from tickets and ideas (titles, questions, criteria) is shown as text, never as HTML: a ticket titled `<b>x</b>` displays those characters literally.

## Out of scope
- Any write action: setting ready, reordering, answering questions (later tickets).
- Live agent activity, a self-check stage, overlap or "touches the same files" hints, server-sent events and remote access (Tailscale, Cloudflare).
- The mockup's sample-state banner and "later" buttons.

## Notes
- Design reference: `docs/panel-mockup.html` (sample data). Dark grey, thin 1px borders, square corners. Reuse its CSS where it helps.
- Zero dependencies: Node built-ins only, like the rest of the CLI.
- The `Host` check guards against DNS rebinding while the server is localhost-only.
- Build after 0030, whose JSON field names this relies on.
- Checked 2026-10-09: port 4777 is free on this machine, and Node reports a port already in use as error code `EADDRINUSE` on `listen` (Node 22.23.3, run locally).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

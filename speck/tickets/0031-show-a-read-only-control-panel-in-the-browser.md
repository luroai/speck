---
id: "0031"
title: "Show a read-only control panel in the browser"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-09T11:10:09.637Z"

---
# 0031 · Show a read-only control panel in the browser

**Status:** 🔍 reviewing

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
- Readings chosen: any method other than `GET` gets 405 on every path, including unknown ones (`HEAD` included); unknown `GET` paths get 404. Shipped shows 5 rows at most: done tickets with a `finished` time newest first, then any with no `finished` time, cut at 5.
- The page's grouping is a pure `panelModel(state)` in `templates/panel.html`, tested directly; `test/panel.test.mjs` also runs the whole page script against a minimal fake DOM, fetch and timer (AC4, AC5). Checked in a real browser (Playwright, Chromium) against this repo: the layout matches the mockup, a draft opens its criteria and stays open across refreshes, stopping the server shows "Disconnected" within 4 seconds, and restarting it recovers without a reload.
- Self-check: the header named the worktree folder rather than the repo (now the main checkout's name, with a test); a ticket speck can't read made the page say it couldn't reach the server (now `/api/state` returns a 500 with the error and the page shows it, with tests); the browser asked for a missing favicon (now an empty inline icon).
- Checked 2026-10-09: port 4777 is free on this machine, and Node reports a port already in use as error code `EADDRINUSE` on `listen` (Node 22.23.3, run locally).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "a7b1b5e30ea89ae32bee2120877994343e2bf5bd",
    "thread_id": "01a12062-11dd-7472-b2ec-402802b7b995",
    "seconds": 41,
    "usage": {
      "input_tokens": 191105,
      "cached_input_tokens": 120960,
      "cache_write_input_tokens": 0,
      "output_tokens": 980,
      "reasoning_output_tokens": 41
    },
    "saved_at": "2026-10-09T11:18:21.547Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdPanel and panelPort implement localhost binding, port selection, startup errors and Host validation. test/panel.test.mjs AC1 integration tests exercise these behaviours; builder reports they passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdPanel uses statusData for /api/state, restricts methods and routes, and performs no writes. AC2 integration tests compare JSON with status --json, check responses, snapshot the repository and exercise error recovery; builder reports they passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html panelModel, render and draftItem implement the requested grouping, details and shipped metrics. AC3 model tests exercise ordering, missing timestamps, totals and exclusions; the whole-script test exercises opening criteria. Style tests check the mockup palette and areas. Builder reports these passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "templates/panel.html poll schedules the next request only after fetch and response parsing finish, with no timeout. Independently running the actual script with a pending fetch produced one fetch and zero scheduled polls. Existing AC4 tests cover immediate responses and immediate rejection, but not stalled requests."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/panel.html el and render use textContent and createTextNode. AC5 whole-script tests exercise literal markup in titles across every area, ideas, blocked questions and opened criteria; builder reports they passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "A stalled fetch or response body stops polling indefinitely and leaves the page showing its previous connection status. Even successful requests are spaced by their duration plus two seconds, rather than fetching every two seconds. This breaks AC4's refresh and recovery guarantee. The fake-fetch tests resolve or reject immediately, so they miss this case.",
        "suggested_fix": "Bound the entire request, including body parsing, with a timeout and cancellation, and schedule polling to preserve the required cadence. Prevent stale responses from overwriting newer state. Add timer-driven tests for a pending fetch and a pending response body, verifying disconnection and automatic recovery.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The panel description otherwise matches the implementation, but its claim of fetching every two seconds and recovering automatically is not reliable while a request remains pending."
    },
    "escalation_question": "",
    "summary": "The read-only panel implements the requested views and protects ticket text from being interpreted as HTML. One reliability issue needs fixing: a stalled request can freeze updates indefinitely without showing that the panel is disconnected. The current tests miss this case."
  }
}
```

</details>

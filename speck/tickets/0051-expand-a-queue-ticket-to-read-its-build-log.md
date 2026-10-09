---
id: "0051"
title: "Expand a queue ticket to read its build log"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-09T19:15:53.316Z"

---
# 0051 · Expand a queue ticket to read its build log

**Status:** 👍 approved

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
- Self-check: a click that ends selecting text in a queue ticket's top row now neither opens nor closes it, so the selection stays (0055's browser test caught it dropping the selection), with a test; no other changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The ANSI pattern does not consume charset designation sequences such as ESC ( B.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 859,198
- Elapsed since build started: 12 min
- Changed lines: 86 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (none went to the inbox):
- Known limit: the server reads the whole log file on each request to take its last 200 lines. Fine for build logs today; worth reading only the file's tail if logs grow large, especially once 0052 polls an open log.
- Skipped for the inbox: keeping an open log up to date while the build runs, which is 0052.

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
    "reviewed_sha": "2e4927bce7045130d3765e89dfbeff688758306a",
    "thread_id": "01a12220-6f74-7f12-9caf-e426423e9f1f",
    "seconds": 51,
    "usage": {
      "input_tokens": 312426,
      "cached_input_tokens": 229120,
      "cache_write_input_tokens": 0,
      "output_tokens": 1066,
      "reasoning_output_tokens": 126
    },
    "saved_at": "2026-10-09T19:26:03.938Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs panelLog and cmdPanel implement fresh main-checkout reads and existing request restrictions. The three AC1 tests cover tail length, missing logs, worktrees and request rules; builder reports them passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html queueItem and toggleLog restrict toggling to the top row and maintain an independent open set. AC2 tests cover multiple open tickets and selection; the reported browser test passes."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "logText and .q .log provide formatting and scrolling, covered by AC3 and browser tests. However, an independent read-only execution of logText with '\\u001b(Bnormal' produced '(Bnormal': a standard terminal charset escape remains visible."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "logBox uses el, which assigns textContent. The AC4 test supplies HTML-shaped log content and checks that no corresponding elements are created; builder reports it passing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "toggleLog requests only on opening; render includes open state and cached log in keptItems. AC5 tests exercise request counts and preserved nodes/scroll position, supplemented by the reported passing browser test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "The ANSI pattern does not consume charset designation sequences such as ESC ( B. logText displays their remaining '(B' characters, contrary to the requirement that ANSI escape sequences aren't shown. Existing tests cover colour and OSC sequences but miss this case.",
        "suggested_fix": "Extend escape removal to consume charset designation sequences fully, and add a regression test asserting that '\\u001b(Bnormal' renders as 'normal'.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The endpoint and open-row descriptions match the implementation, but the claim that ANSI escape sequences are removed is not fully true until F1 is fixed."
    },
    "escalation_question": "",
    "summary": "Queue tickets can open safely rendered build logs, and the tests cover request rules, multiple open rows and preserved scrolling. One formatting defect needs fixing: some terminal escape codes leave visible fragments in the log. I inspected the code and independently reproduced that defect; I did not rerun the filesystem-writing test suite in this read-only review."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "7a6e73211a4b8a977113736904fa5e2d12cd531b",
    "thread_id": "01a12220-6f74-7f12-9caf-e426423e9f1f",
    "seconds": 25,
    "usage": {
      "input_tokens": 543781,
      "cached_input_tokens": 425216,
      "cache_write_input_tokens": 0,
      "output_tokens": 1925,
      "reasoning_output_tokens": 126
    },
    "saved_at": "2026-10-09T19:28:04.458Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs panelLog and cmdPanel retain fresh main-checkout reads, 200-line tails, empty-log responses and request restrictions. All three AC1 integration tests pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html queueItem and toggleLog maintain independent open tickets and limit toggling to top-row clicks. AC2 tests and the real-browser selection test pass in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "logText removes terminal escapes and collapses blank lines; .q .log supplies monospace text, maximum height and scrolling. Independently executed every formatting assertion against the current page model, including the F1 regression: all passed. Formatting and browser tests also pass in the supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "logBox renders through el using textContent. The AC4 test exercises HTML-shaped malicious content and verifies no HTML elements are created; it passes in the supplied output."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "toggleLog requests logs only on opening. render includes openQueue and cached logs in keptItems, preserving unchanged rows. Request-count, refresh-preservation and browser scroll tests pass in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Charset designation escapes previously left visible fragments. The updated ANSI pattern consumes these sequences fully, and the added regression assertions pass independently against the current implementation.",
        "suggested_fix": "None; the fix and regression coverage are sufficient.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The panel documentation accurately describes the endpoint, open rows, formatting, refresh preservation and close-and-reopen behaviour."
    },
    "escalation_question": "",
    "summary": "Approved. Queue tickets show readable build logs safely as text, and unchanged open logs retain their scroll position through refreshes. The escape-formatting defect is fixed and independently verified. The supplied full test run passes all 385 tests; no blocking concerns remain."
  }
}
```

</details>

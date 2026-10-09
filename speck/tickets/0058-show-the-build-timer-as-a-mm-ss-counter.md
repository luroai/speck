---
id: "0058"
title: "Show the build timer as a MM:SS counter"                # one outcome, no "and"
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
after: ["0051", "0052", "0053", "0055"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:49:23.122Z"

---
# 0058 · Show the build timer as a MM:SS counter

**Status:** 👍 approved

## Problem
The queue's elapsed time is whole minutes, so a build that started a minute and a half ago reads `1 min` and then sits there for another thirty seconds. With no seconds in it you can't tell a working build from a panel that has stopped updating, which is the same complaint that put motion on the progress bars (0055).

## Outcome
An in-flight ticket's elapsed time is a counter in `MM:SS` that advances every second, so it visibly runs.

## Acceptance criteria
1. Each in-flight ticket in the queue (`building`, `reviewing`, `blocked` or `approved`) whose `started` is set shows its elapsed time as `MM:SS`, in the row's right-hand position where its whole minutes are today. A `ready` ticket, and one with no readable `started`, show what they show today: nothing. `/api/state` gains no field: the page works the value out from `started`.
2. The minutes are padded to two digits and count past 59 rather than rolling over: 7 seconds is `00:07`, 7 minutes 42 seconds is `07:42`, and 62 minutes 7 seconds is `62:07`.
3. The counter advances once a second from its own 1-second timer in the page, so it moves on between the state polls rather than only with them. Its updates touch nothing else: the row's tags, chain icon, worktree line, status line and progress bar are changed only by the state poll, and no timer is left running once no in-flight ticket has a `started`.
4. The counter keeps the rule from 0050: with text selected in or across it, the selection stays, because only the characters that differ are replaced (`07:42` to `07:43` replaces one character).
5. Nothing else changes format: the Shipped list's per-row minutes and its "median minutes" stat keep whole minutes, as they are today.

## Out of scope
- Freezing the counter when a ticket becomes `blocked` or `approved`, which would need a time the ticket doesn't record.
- Seconds, or a different format, anywhere but the queue's in-flight rows.
- Motion on the progress bars, which is 0055.
- Anything server-side: `started` in `/api/state` already carries the precision needed.

## Notes
- After 0051, 0052, 0053 and 0055, which all change the same queue rows in `templates/panel.html`, and the same function that builds them (`queueItem`). A ready ticket that touches the same file would otherwise conflict when it ships, so listing them here keeps the builds apart. 0052 puts a 1-second timer in the page for an open log: reuse it rather than adding a second one if it fits.
- Unlike 0055's motion, the counter runs for every in-flight ticket, `blocked` and `approved` included, because it reports elapsed time rather than "an agent is working".
- Where the value is today: `minutes` in `panelModel` (`Math.floor` of the elapsed milliseconds, kept at or above zero against a `started` in the future), and `queueMinutes` in the view, which prints `7 min`. `speck start` writes `started`.
- The existing tests that assert the whole-minute text, which must be updated to the new format while keeping their own guarantees (in-place update, selection kept): `test/panel.test.mjs` (0034 AC5, around lines 583-590: `[7, 0, null, null]` and `'7 min'`), `test/panel-0040.test.mjs` (around lines 144-149) and `test/panel-0050.test.mjs` (around lines 137-149, plus the real-browser test around lines 278-298, which waits on `'5 min'`).
- What a kept row shows from the clock is listed in the page's `derived` for the queue, so whatever the counter reads has to be in it, or a kept row would stop ticking (0050).
- `speck/product.md` says in-flight tickets show "the whole minutes since `started`", and that a kept row's minutes change in place: both need the new wording.
- Checked 2026-10-09: `started` is written by `speck start` as an ISO timestamp, so the page has second precision without any change to the JSON (`statusData` in `scripts/speck.mjs`).
- The counter has its own `setInterval`, not 0052's log timer: that one runs only while a queue ticket is open, and the counter must run whenever an in-flight ticket has a `started`. The fake page in `test/support/panel.mjs` now keeps repeating timers apart (`intervals`), so the existing tests that run the state poll with `p.timers.shift()` are unaffected.
- `test/panel-0040.test.mjs` 0040 AC5 now starts its fake clock a second on: with seconds shown, a millisecond between reading the clock and making the tickets turned `05:00` into `04:59`.
- Self-check: no changes. Checked an unreadable or future `started` (tested), repeated ids (each row is paired with its own counter node), a row rebuilt or removed between ticks (each render replaces the list the timer updates), and that the tick changes nothing but the counters' text.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 343,963
- Elapsed since build started: 12 min
- Changed lines: 36 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox note):
- The counter's `setInterval` isn't aligned to each ticket's whole seconds, so a tick that lands late can now and then skip a second, or show one twice. Aligning it would need a timer per second boundary.
- While the panel is disconnected the counters keep running from the last state received; the disconnected message says the state is old.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "7dd27e832762844047067760a8b4a2f5a1a5145a",
    "thread_id": "01a12241-6232-7f92-8dc5-57f2aa1a661e",
    "seconds": 32,
    "usage": {
      "input_tokens": 342865,
      "cached_input_tokens": 250624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1098,
      "reasoning_output_tokens": 54
    },
    "saved_at": "2026-10-09T20:01:44.399Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel and queueItem derive the counter from readable started values for all four in-flight statuses. test/panel-0058.test.mjs AC1 tests cover placement, missing/unreadable dates, ready tickets and unchanged state fields; builder reports both passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: counter pads minutes and seconds without rolling minutes over. AC2 tests cover all specified examples, 100 minutes and future timestamps; builder reports passing. Independent read-only verification confirmed 07:42 and 62:07."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: startCounters manages one 1000ms interval; tickCounters updates only counter text. render refreshes node references. AC3 tests exercise isolated ticks, unchanged surrounding nodes, rebuilt rows, cleanup and restart; builder reports passing. Independent read-only verification confirmed ticking and cleanup."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: tickCounters uses setText, which replaces only differing characters and preserves selection endpoints. The real-browser AC3/AC4 test checks selections within and across the counter and records actual replaceData calls; builder reports passing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/panel.html retains Shipped minutes and median calculations and rendering. test/panel-0058.test.mjs AC5 verifies whole-minute row values and median; builder reports passing."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "Updated wording accurately describes queue formatting, the separate timer, cleanup and selection preservation. Shipped formatting remains unchanged."
    },
    "escalation_question": "",
    "summary": "The queue now shows elapsed minutes and seconds and advances independently every second. Tests cover timer cleanup, selection preservation and unchanged Shipped formatting. Repository inspection and independent read-only checks found no blocking issues; the builder reports all 444 tests passing."
  }
}
```

</details>

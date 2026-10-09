---
id: "0058"
title: "Show the build timer as a MM:SS counter"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

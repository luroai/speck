---
id: "0187"
title: "Push board changes to the panel as they happen"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-update-the-panel-in-real-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0177"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T22:06:47.011Z"

---
# 0187 · Push board changes to the panel as they happen

**Status:** 🔍 reviewing

## Problem
The panel page asks for the whole board every 2 seconds, whether anything has changed or not. Changes show up as much as 2 seconds late, every open page costs the panel a full reading of the board every 2 seconds, and a slow answer flashes "Disconnected" across the top (0186).

## Outcome
The panel sends each change to every open page as it happens, and pages no longer ask for the board on a timer.

## Acceptance criteria
1. An open page shows a change to the board within 1 second of the file that records it changing, without asking for it. That covers a ticket's status, fields or text, an idea, a build starting, ending, pausing or being stopped, a ship starting or ending, and speck run being turned on or off. A change no file records, such as a build's process ending while speck run is off, shows within 30 seconds.
2. The page no longer asks for the board on a timer. While nothing changes, an open page and the panel exchange only a keep-alive, at least every 30 seconds.
3. However many pages are open, the panel works out the board once per change, and changes in quick succession (for example, a commit that changes ten tickets) reach each page as one update.
4. When the connection drops, for example when the panel restarts on new code, the network blips or a phone wakes from sleep, the page reconnects by itself and shows the current board at once. "Disconnected" shows only if it can't reconnect within 10 seconds.
5. No test that passed before this change fails, except checks that the page polls `/api/state` every 2 seconds (`test/panel-0059.test.mjs`, AC4), which change to check criterion 2.

## Out of scope
- Sending only what changed rather than the whole board (0188).
- An open build log (0189).
- Making the full board smaller (0178).

## Notes
- Server-Sent Events (`EventSource` in the page, a `text/event-stream` answer from the panel) fit: one-way, reconnecting by themselves, plain HTTP, and no dependency.
- Over plain HTTP/1.1, as at `127.0.0.1`, a browser keeps only about six connections open per address, so each page should hold one stream, and 0189's log updates should share it.
- The panel server already watches its own code for changes (`codeStamp()` in `scripts/panel.mjs`).
- Checked 2026-10-14: Cloudflare's own docs give a 100-second proxy read timeout (error 524), and say Cloudflare Tunnel buffers proxied answers unless they're `Content-Type: text/event-stream`, which it streams as the data arrives.
- Checked 2026-10-14: Node's docs say `fs.watch` gained `recursive` support on Linux in v19.1.0; it works on the installed Node v22.23.3.
- Builds after 0177 (one shared reading of the board for every request) and 0186.
- Design: the stream (`/api/events`) announces each new board by number, and the page then fetches `/api/state` with that number, answered from the one reading that board came from. The board isn't sent over the stream itself because 21 real-browser tests feed the page by replacing its fetch of `/api/state`, and criterion 5 keeps them passing. It also leaves room for 0188.
- The page redraws on each keep-alive (every 5 seconds), so what it works out from the clock still moves on between changes, as it did with every poll. The board is read again every third keep-alive (15 seconds) for what no file records.
- An answer still waiting when the next board is announced still shows "Disconnected", as before: 0186 changes that rule, and `test/panel.test.mjs` (0031 AC4) checks it.
- Besides `test/panel-0059.test.mjs` AC4, `test/panel.test.mjs` 0031 AC4 also checked that the page polls every 2 seconds (`POLL_MS = 2000`, `setTimeout(poll, …)`), so it changes the same way.
- The fake page in `test/support/panel.mjs` gets an EventSource whose server announces a new board each time the test runs its 2-second timer, as the poll's timer did, so the fake-page tests run unchanged.
- Self-check: speck run's folder is now looked up once, not on every answer (one `git worktree list` each); a folder that isn't there yet is watched through its parent for only that name, since git rewrites its own files as it reads; a burst of build log writes starts at most one reading every 2 seconds.
- Failing before this build: `0173 AC2: no test in test/ checks once that a process it stopped has gone` (it flags `test/panel-0177.test.mjs:159`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

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
    "reviewed_sha": "149468c60bbfcfac00b4163d4c380c4f4905b2e3",
    "thread_id": "01a13c95-f6df-7db3-9d63-666dca07ead5",
    "seconds": 29,
    "usage": {
      "input_tokens": 178829,
      "cached_input_tokens": 129152,
      "cache_write_input_tokens": 0,
      "output_tokens": 1312,
      "reasoning_output_tokens": 90
    },
    "saved_at": "2026-10-14T22:44:11.947Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0187.test.mjs covers ticket edits, ideas, build records, ships, worktrees and process exits; the supplied run reports these tests passing. boardWatcher watches the relevant files and periodically refreshes process state."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 tests exercise announcement-driven fetches and idle keep-alives. templates/panel.html removes the board polling timer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 tests verify one reading across four streams, ten simultaneous ticket changes producing one announcement, and freshness after a page write."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Reconnect tests cover server restarts, but miss reconnecting after all streams close and files change. That path serves retained stale state. A failed state fetch also has no retry while the stream remains connected."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The supplied full run fails build-log-0176.test.mjs AC1, which is not listed as failing before this build. The documented 0173 failure is exempt."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel.mjs:404",
        "issue": "When all pages disconnect, file changes trigger nextReading(), which discards the refresh because feed.watched() is false. latest remains populated. A reconnecting page is immediately announced that old version, and askState() serves its stale board because external file changes do not increment writes. The current board can take another 15 seconds to appear.",
        "suggested_fix": "Track invalidation even without streams and refresh before announcing a cached board to a reconnecting page. Add a test that closes every stream, edits a ticket, waits for the watcher, then reconnects and checks the first board.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:2375",
        "issue": "A transient /api/state fetch failure immediately shows Disconnected and never retries if the event stream stays open and the board remains unchanged. Pings only redraw; periodic server readings suppress unchanged announcements. I reproduced this with fakePage: after one failed fetch and six pings, there was still only one fetch and Disconnected remained visible.",
        "suggested_fix": "Retry failed state retrieval, or reconnect the stream to obtain another announcement, with the required 10-second connection grace period. Add coverage for a failed state fetch followed by recovery without a board change.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/build-log-0176.test.mjs:145",
        "issue": "The full suite reports an additional failure outside the ticket's documented baseline: the finished-build log performance test. Consequently criterion 5 is not satisfied by the submitted evidence.",
        "suggested_fix": "Investigate and provide a fresh passing full-suite result, or evidence establishing whether this is a pre-existing intermittent failure. Do not weaken the performance assertion.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Live board updates and shared readings are well covered, but recovery has two gaps: returning pages can initially receive an old board, and a temporary board-download failure can leave a page disconnected indefinitely. The suite also has an unexplained additional failure."
  }
}
```

</details>

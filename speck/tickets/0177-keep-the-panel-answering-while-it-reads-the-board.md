---
id: "0177"
title: "Keep the panel answering while it reads the board"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-14T21:14:21.689Z"

---
# 0177 · Keep the panel answering while it reads the board

**Status:** 🔍 reviewing

## Problem
The panel server works out the whole board for each `/api/state` request, and while it does (about 750 ms on 2026-10-14) it can't answer anything else. Every open tab asks every 2 seconds, and a request the page has already given up on is still worked out. On a busy machine requests pile up faster than they're answered: on 2026-10-14 the panel stopped answering, with 60 connections queued and its process at 100% CPU.

## Outcome
The panel keeps answering promptly, however many tabs are open and however slow the board is to read.

## Acceptance criteria
1. `/api/state` requests that arrive while the board is being read share that reading: ten requests sent at once cause one reading, not ten.
2. A request whose connection has closed before its reading starts doesn't cause one.
3. While the board is being read, the panel still answers the page, its icons, a build log and every write (Set ready, Back to Plan, priority, Stop build, Ship and the speck run switch) within 1 second, even when one reading takes 5 seconds.
4. After a write, the next `/api/state` answer shows its result, never an answer read before the write.
5. No test that passed before this change fails.

## Out of scope
- How long one reading takes (0176) and how much it sends (0178).
- Pushing changes to the page instead of polling (`speck/ideas/2026-10-11-update-the-panel-in-real-time.md`).

## Notes
- `panelServer()` in `scripts/panel.mjs` calls `statusData(repo)` inside the request handler. The page aborts a request still waiting when the next is due (`poll()` in `templates/panel.html`), but the server carries on working it out.
- Failing before this build: none
- Self-check: a board reader that stops now answers its reading with a plain error and the next reading starts a new one (new test). The full suite also showed the reader could load code changed just after the server started, so the server now waits for its reader to load before it's ready.

## In plain words
The panel no longer freezes when several tabs are open or the machine is busy. Working out the board now happens in the background, so the page, its buttons and build logs answer straight away while it does. Tabs asking at the same moment share one look at the board instead of each starting their own, and a tab that has already given up no longer makes the panel do the work anyway. After you press a button such as Set ready or a priority, the next refresh always shows the result.

To see it, open the panel in several tabs and use the buttons while it refreshes: they answer at once. The board itself still takes as long to work out as before (that's a separate ticket), so on a very slow machine the queue may refresh a little less often, but nothing else waits for it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, none needing a ticket of their own, so no inbox notes):
- If the board reader stops (it hasn't in testing), the next reading starts a new one, which loads the code as it is on disk then, not as the running server loaded it. The server restarts on any code change anyway.
- Readings run one at a time: after a write, a request waits for any reading already under way to finish, then for a fresh one, so up to two readings' time.
- A change made outside the panel (a speck command in a terminal) doesn't make a reading under way out of date; the next poll, 2 seconds later, shows it.
- `checkNotBeingBuilt` (Set ready and priority) still looks at every ticket worktree's copy of its ticket, one file each; it could pass the ticket's id to `ticketsElsewhere` as Back to Plan now does.

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
    "reviewed_sha": "96faa1050ee205c849cdb178b0cc4c936ae724ae",
    "thread_id": "01a13c4e-c0ba-7d71-9189-b4afeb5836d9",
    "seconds": 58,
    "usage": {
      "input_tokens": 224311,
      "cached_input_tokens": 178048,
      "cache_write_input_tokens": 0,
      "output_tokens": 1544,
      "reasoning_output_tokens": 278
    },
    "saved_at": "2026-10-14T21:26:54.094Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel.mjs askState shares the active reading. The passing 0177 AC1 test sends ten concurrent requests and verifies one reading."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "nextReading filters closed connections before starting work. The passing 0177 AC2 test checks abandoned and retained queued requests."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "panelBackToPlan still calls synchronous statusData(repo) on the server thread at scripts/panel.mjs:85. A five-second board read therefore blocks this write and other requests. The AC3 test slows only the worker's call, concealing this path."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "nextReading sends completed results to done.these without checking whether done.at still equals writes (scripts/panel.mjs:397). A board captured before a write can be returned after that write completes. The AC4 test delays before capturing the board and does not assert freshness of the earlier outstanding response."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0177-tests.txt: 1649 tests, 1646 passed, zero failed, three skipped. No failures were recorded before the build."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel.mjs:397",
        "issue": "An outstanding state request can return a stale board after a write completes. The write counter affects newly arriving requests, but completed readings are sent to their original recipients even when invalidated.",
        "suggested_fix": "Check the write generation before sending a completed board. Requeue live recipients of an invalidated reading for a fresh reading. Add a test that captures the old board, delays its delivery, completes a write, and verifies every subsequent state answer includes the write.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/panel.mjs:85",
        "issue": "Back to Plan still reads the entire board synchronously on the HTTP server thread. When statusData takes five seconds, this write also takes at least five seconds and prevents the panel answering other requests. The new timing test delays only the worker call, so it misses this remaining blocking read.",
        "suggested_fix": "Move this board-dependent validation off the server thread while preserving its safety checks. Test with statusData itself slowed, including its use during Back to Plan, and verify the write and concurrent page requests meet the timing requirement.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/panel-0177.test.mjs:98",
        "issue": "The responsiveness test uses a draft ticket for Stop build, a nonexistent ticket for Ship, and an already-off run switch. Accepting any status below 500 proves only quick refusal, not responsiveness of the active write paths required by AC3.",
        "suggested_fix": "Exercise active Stop build and run-switch operations and the real Ship handler with suitable controlled fixtures. Assert the expected outcomes as well as timing. If Ship's existing wait-for-completion behaviour conflicts with the one-second requirement, raise that specific conflict for a product decision.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Concurrent board requests now share work in a separate thread, and the reported suite passes. Changes are still needed: Back to Plan can block the server, an older board answer can arrive after a write, and several write timing checks exercise only refusals."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "752c6c29432a14e97f09e722b641a269bce9f86a",
    "thread_id": "01a13c4e-c0ba-7d71-9189-b4afeb5836d9",
    "seconds": 44,
    "usage": {
      "input_tokens": 571573,
      "cached_input_tokens": 462976,
      "cache_write_input_tokens": 0,
      "output_tokens": 2759,
      "reasoning_output_tokens": 471
    },
    "saved_at": "2026-10-14T21:36:34.685Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "askState shares the active reading; the passing AC1 test verifies ten concurrent requests cause one reading."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "nextReading filters closed connections, including requeued recipients. The expanded AC2 test passes."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Back to Plan calls ticketShown synchronously. ticketShown calls statusTickets, which reads and parses every ticket through core.mjs listTickets. Slow ticket-file reading can therefore still block the server. The passing AC3 tests inject delay only at statusData's entry, bypassing this shared underlying work."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "nextReading now compares done.at with writes and requeues recipients of invalidated readings. The passing AC4 test checks both the outstanding request and the request sent after the write, and verifies a second reading occurs."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0177-tests.txt: 1652 tests, 1649 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel.mjs",
        "issue": "Completed readings are now checked against the write generation before delivery; invalidated recipients wait for a fresh reading.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs:447",
        "issue": "The blocking board scan remains in Back to Plan under a different function. ticketShown calls statusTickets before selecting one ticket; statusTickets calls listTickets, which synchronously reads and parses every live and completed ticket, and scans worktrees. If this shared board-reading work takes five seconds, Back to Plan still blocks the HTTP server for that time. Removing linting and other enrichment reduces work but does not isolate slow board reads.",
        "suggested_fix": "Remove the full synchronous ticket scan from this request path, preserving the checks for worktree status and a running build. Move the required scan off the server thread or perform a genuinely targeted lookup. Add a timing test that slows the underlying ticket scan used by both statusData and ticketShown, rather than only statusData's entry.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/panel-0177.test.mjs",
        "issue": "The expanded tests now exercise successful Stop build, real run on/off operations, and successful shipping, checking outcomes and response times.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Sharing, cancellation and fresh answers after writes now work, and the expanded tests exercise successful writes. One blocking issue remains: Back to Plan still scans every ticket on the server thread, so slow board-file reading can freeze the panel. The full suite passes, but its injected delay misses this remaining path."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "8feb534927f6276685e528d73c6baf6b1badd7f7",
    "thread_id": "01a13c4e-c0ba-7d71-9189-b4afeb5836d9",
    "seconds": 18,
    "usage": {
      "input_tokens": 704370,
      "cached_input_tokens": 589568,
      "cache_write_input_tokens": 0,
      "output_tokens": 3384,
      "reasoning_output_tokens": 471
    },
    "saved_at": "2026-10-14T21:41:09.047Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.mjs askState shares the active reading. The passing AC1 test verifies ten simultaneous requests cause one board reading."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "nextReading removes closed connections before starting work. The passing AC2 test covers both queued and requeued abandoned requests."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Board scans run in a worker; Back to Plan now uses a targeted ticket lookup. Four passing AC3 tests slow listTickets by five seconds and verify page, icon, log and successful write responses within one second, including Stop build, Ship and run on/off."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "nextReading checks the write generation and requeues recipients of outdated readings. The passing AC4 test verifies freshness for requests sent both before and after the write."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0177-tests.txt: 1652 tests, 1649 passed, zero failed, three skipped. No failures were recorded before the build."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel.mjs",
        "issue": "Outdated readings are now discarded after writes, and their live recipients receive a fresh reading.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "ticketShown now reads only the requested ticket. ticketsElsewhere filters unrelated worktree branches before reading their tickets. The timing tests now slow the underlying full ticket scan, covering the previously missed blocking path.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/panel-0177.test.mjs",
        "issue": "Timing tests exercise successful Stop build, Ship and run-switch operations and check their outcomes.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel now shares board readings without blocking other requests, skips abandoned queued requests, and returns fresh results after writes. All previous concerns are resolved, and the full suite passes. Ready for the product owner's merge decision."
  }
}
```

</details>

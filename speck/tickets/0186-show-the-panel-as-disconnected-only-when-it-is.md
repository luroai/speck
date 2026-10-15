---
id: "0186"
title: "Show the panel as disconnected only when it is"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-15T12:11:30.695Z"
approved: "2026-10-15T12:37:57.380Z"

---
# 0186 · Show the panel as disconnected only when it is

**Status:** 👍 approved

## Problem
Every now and then the panel shows "Disconnected: can't reach speck panel" across the top, and it goes again a moment later. The page treats any answer to its 2-second request for the board that hasn't come back in time as a lost connection, but the panel is only slow: on 2026-10-14 each answer took 0.5 to 0.9 seconds with one build running, and longer during test runs or with a phone and a laptop both open.

## Outcome
The panel shows "Disconnected" only when it really can't reach the panel, never because an answer was slow.

## Acceptance criteria
1. An answer to the page's request for the board that takes longer than 2 seconds isn't treated as a disconnection: the page waits for it, for up to 15 seconds, and sends no other request for the board while one is waiting.
2. The "Disconnected" notice shows only once the page has had no answer from the panel for 10 seconds, and goes as soon as an answer arrives.
3. One failed reading of the board ("couldn't read the tickets") shows no notice. The notice shows only when readings have failed for 10 seconds in a row.
4. No test that passed before this change fails, except checks of the old rule (the notice shows when a request is still waiting after 2 seconds), which change to check criteria 1 to 3.

## Out of scope
- Replacing the 2-second polling with updates pushed from the panel (0187).
- How long the panel takes to answer (0176, 0177).

## Notes
- `poll()` in `templates/panel.html` aborts a request still waiting when the next is due and calls `setConnected(false)`, which shows the notice.
- Reported on 2026-10-14: the notice flashes up and goes "because of the 2 second load".
- 0187 replaces the polling this changes, so keep this small: it's the fix for now.
- Failing before this build: none
- Built on 0187, which shipped first: the page no longer asks every 2 seconds but when the panel announces a new board. So "sends no other request while one is waiting" means a board announced while a request waits is asked for once that request is answered or given up (only the latest one), and "the old rule" is that a request still waiting when the next board is announced was dropped and shown as disconnected.
- The 10-second limit counts from when the page asked for the board, and is called off by the next board that arrives. The stream's own 10-second limit (0187) is unchanged.
- The fake page in the tests now gives up a request the page aborts, as a browser does, and keeps the page's 10- and 15-second waits apart from `timers`, run with `elapse(ms)`.
- Self-check: the page tracks whether its notice shows itself rather than reading it from the page, so a first request that fails shows nothing.

## In plain words
The panel no longer flashes "Disconnected" when it's only slow to answer. It now waits up to 15 seconds for the board, and only says it's disconnected, or that it couldn't read the tickets, once 10 seconds have gone by without a board. The notice goes as soon as a board arrives. To see it, leave the panel open while builds and test runs keep it busy: the notice shouldn't flash up any more. If the panel really stops, the notice now takes about 10 seconds to appear rather than 2.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 185,772
- Elapsed since build started: 26 min
- Changed lines: 52 (limit 5000)
Follow-ups:
- Tidy-up: the notice's starting text in the page still says "Retrying every 2 seconds…". It's never seen, because the page sets the text before it shows the notice, but it's out of date.
- Skipped, already in the inbox: the 0128 AC4 test failed once by chance in this build's full run and passed on the retry (speck/ideas/2026-10-15-fix-the-0128-ac4-test-that-fails-by-chance.md).

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
    "reviewed_sha": "c770d77e165428853bdf0dd4d82de179412dc281",
    "thread_id": "01a13f90-ca04-7012-8c44-81b3656baed9",
    "seconds": 47,
    "usage": {
      "input_tokens": 184318,
      "cached_input_tokens": 141440,
      "cache_write_input_tokens": 0,
      "output_tokens": 1454,
      "reasoning_output_tokens": 323
    },
    "saved_at": "2026-10-15T12:37:42.381Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html load() serialises board requests, retains the latest announcement and aborts after 15 seconds. panel-0186 AC1 tests cover waiting, queuing and cancellation. Independent chronological checks passed at 2, 10 and 15 seconds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "load() starts the 10-second notice timer and clears it on a successful board response. panel-0186 AC2 tests exercise delayed answers, repeated failures and recovery."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "failed() delays the reading-error notice until the existing 10-second timer expires. Both panel-0186 AC3 tests exercise suppression, sustained errors and recovery."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0186-tests.txt records 1,815 tests with one initial failure; that test passed on the automatic retry and was recorded as flaky. Updated tests reflect the new notice timing without removing behavioural checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Slow board requests now wait up to 15 seconds, with only the latest queued update fetched afterwards. Connection and reading-error notices appear after 10 seconds and clear when a board arrives. The tests support the change; one unrelated test passed on retry. No blocking concerns found."
  }
}
```

</details>

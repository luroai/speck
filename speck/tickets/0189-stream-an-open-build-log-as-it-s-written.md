---
id: "0189"
title: "Stream an open build log as it's written"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0188"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T11:50:15.421Z"

---
# 0189 · Stream an open build log as it's written

**Status:** 🔍 reviewing

## Problem
An open build log is asked for every second, and each time the panel reads and converts the whole log again, up to 2.5 MB, even when nothing has been added, and even after the build has ended.

## Outcome
An open build log shows new lines as they're written, without the page asking on a timer.

## Acceptance criteria
1. An open build log shows each new entry within 1 second of the build writing it, and the page doesn't ask for the log on a timer.
2. Opening a log shows its last 200 entries straight away, with their times, as it does today.
3. Each update carries only the new entries, and the panel doesn't read the whole log again for each one.
4. A log whose build has ended gets no more updates until a new build of that ticket starts.
5. No test that passed before this change fails, except checks that the page asks for an open log every second, which change to check criterion 1.

## Out of scope
- Logs of builds not started by `speck run`.

## Notes
- `panelLog()` in `scripts/panel.mjs` reads the whole log and runs `readableLog()` over it. A build writes one JSON event per line, and a line can arrive in more than one write, so only whole lines are converted.
- Use the stream 0187 sets up, so a page holds one connection (see 0187's Notes).
- Covers the open-log part of 0179, which 0187 and this ticket replace, and the idea note `speck/ideas/done/2026-10-09-stop-asking-for-a-log-once-its-build-has-ended.md`.
- Failing before this build: none
- Design: each stream is first sent its own name (event `stream`). The page asks for an open log once, naming its stream in an `X-Speck-Stream` header (the URL stays `/api/tickets/<id>/log`, which several browser tests stub), and the stream then sends `log` events: the lines to take off the end (a plain last line still being written) and the lines to add, or a new build's whole log. A half-written JSON event isn't shown until it's whole. A failed request is asked for again at the stream's next keep-alive.
- Changed under AC5: the 0052 tests that checked the page asks every second (its four AC1 tests, the retries in its two AC4 tests and the repeated asks in its real-browser AC3 test) now check the stream's updates instead.
- Self-check: closing and opening a log quickly could leave it closed when the close arrived last, so each open and close is numbered (`X-Speck-Order`) and a late one is ignored.

## In plain words
An open build log in the panel now updates by itself the moment the build writes something, usually well within a second, instead of the page asking for the whole log every second. Opening a log still shows its last 200 lines with their times straight away. Once a build has finished, its log gets nothing more until that ticket is built again.

To see it, open a ticket that's being built in the panel's Build list and watch its log: new lines appear as they're written, with no reload.

Worth keeping an eye on: if a log can't be loaded, the page tries again every few seconds rather than every second, and the message in the log box says so.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, no inbox notes):
- `scripts/panel.mjs` is at exactly 600 lines, the limit `test/split-0018.test.mjs` sets, so the next change to it will need to move something out first.

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
    "reviewed_sha": "bb82f92d1d4ef24e2143a4d6517d58fcdf88d612",
    "thread_id": "01a13f7b-9027-7163-9c06-4ca028885d64",
    "seconds": 44,
    "usage": {
      "input_tokens": 185124,
      "cached_input_tokens": 134016,
      "cache_write_input_tokens": 0,
      "output_tokens": 1230,
      "reasoning_output_tokens": 258
    },
    "saved_at": "2026-10-15T12:14:28.966Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The 0189 AC1 tests cover complete entries and removal of the page timer. However, logFeed.catchUp suppresses further changes to a plain unfinished line when its line count stays unchanged; a read-only reproduction confirmed the displayed text remains stale."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The 0189 AC2 tests compare logFeed.answer with readableLog's last 200 lines, including timestamps, and check the page's rolling limit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The 0189 AC3 tests measure bytes read from a 2.5 MB log, inspect incremental payloads, and exercise JSON events split across writes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The 0189 AC4 unit and panel integration tests cover silence for unchanged ended logs and replacement when a new build starts."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full output at /tmp/speck-0189-tests.txt records 1810 passes, zero failures and three skips. Changes to the 0052 tests replace polling expectations with stream behaviour as permitted."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/log-feed.mjs",
        "issue": "catchUp's 'nothing new to show' check compares line positions without comparing the unfinished line's text. After sending 'npm ER', appending 'R! failed' without a newline sends no update, even across subsequent keep-alives. The page remains stale until a newline arrives, potentially forever if the process exits without one. The existing partial-line test completes the line with a newline and misses this case.",
        "suggested_fix": "Track changes to the displayed partial text and emit a drop-and-replacement update when it changes, even if line positions are unchanged. Add a regression test with multiple writes to the same plain line before any newline.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The stream replaces repeated log requests and the full suite passes. One bug still leaves an unfinished plain log line stale as more text arrives. Fix that update case before merge."
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
    "reviewed_sha": "35a06a4b489ef6522f656bfb67928496b14ea137",
    "thread_id": "01a13f7b-9027-7163-9c06-4ca028885d64",
    "seconds": 30,
    "usage": {
      "input_tokens": 353234,
      "cached_input_tokens": 294784,
      "cache_write_input_tokens": 0,
      "output_tokens": 2260,
      "reasoning_output_tokens": 273
    },
    "saved_at": "2026-10-15T12:18:04.015Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "boardWatcher forwards log writes to logFeed, which gathers writes for 50 ms and sends stream updates. The page has no log polling timer. Passing AC1 tests cover delivery within one second, page updates and reconnection. The new F1 regression exercises successive unfinished-line writes; an independent in-memory reproduction also passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "logFeed.answer returns the last 200 displayed lines with times. Passing AC2 tests compare the initial response against readableLog and verify the page maintains the 200-line limit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "logFeed.catchUp reads from the saved position, plus a bounded header check, and sends incremental lines. Passing AC3 tests measure bytes read from a 2.5 MB log and exercise split JSON events, partial plain lines and subscription closure."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 unit and panel integration tests verify unchanged ended logs send nothing and a new build resets the displayed log before incremental updates resume."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The current full-suite output in /tmp/speck-0189-tests.txt records 1811 passes, zero failures and three skips. The polling-test changes remain within the ticket's stated exception."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/log-feed.mjs",
        "issue": "Successive writes to an unfinished plain line previously left its displayed text stale. shown() now records the unstable text, and catchUp compares it before suppressing an update. The regression test and independent reproduction confirm each extension sends a replacement.",
        "suggested_fix": "Completed; retain the regression test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Open build logs now receive new entries through the existing stream without repeated page requests. The unfinished-line bug is fixed, all criteria pass, and the full suite reports no failures. Ready for the product owner's merge decision."
  }
}
```

</details>

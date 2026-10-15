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

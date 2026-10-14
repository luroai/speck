---
id: "0176"
title: "Keep the board quick to read however many tickets are built"                # one outcome, no "and"
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
started: "2026-10-14T21:03:32.266Z"
blocked_at: ""
waited_seconds: 569
approved: "2026-10-14T21:28:42.937Z"

---
# 0176 · Keep the board quick to read however many tickets are built

**Status:** 👍 approved

## Problem
Every read of the board (`speck status --json`, `speck run`'s check every 5 seconds, and the panel's `/api/state`) reads and parses every finished build's whole log to find its last 50 lines. With 128 logs (55 MB) on 2026-10-14, one read took about 750 ms of CPU, 63% of it in the logs. It grows with every ticket built, so `speck run` and the panel head towards being busy all the time.

## Outcome
How long the board takes to read doesn't depend on how big the build logs are.

## Acceptance criteria
1. With 200 tickets that each have a finished build, making every build log 10 times bigger (from 200 KB to 2 MB) adds less than 10% to how long `speck status --json` takes.
2. Each ticket's `build_exit.message` is exactly what it was before this change, for any log. That includes a log whose last 50 readable lines span more than its last few hundred KB, for example one ending in very long tool-output lines.
3. With 200 finished builds whose logs are 2 MB each, an idle `speck run` (no ready tickets) uses on average less than 5% of one CPU core over a minute.
4. No test that passed before this change fails.

## Out of scope
- How often the panel asks for the board, and how much it sends (0177, 0178, 0179).
- Removing old build logs.

## Notes
- `buildExit()` in `scripts/speck.mjs` reads the whole `<id>.log` and runs `readableLog()` over it for every ticket with a run record. On 2026-10-14 that was 63% of `statusData()`'s time.
- The panel uses `build_exit.message` only for tickets in the queue (`templates/panel.html`, around line 681).
- The field names of `speck status --json` are a contract (0030).
- Failing before this build: 0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each
- Resumed 2026-10-14: the user stopped the build only to clear the queue. Merged main, where 0190 fixed 0165 AC1.
- Self-check: added AC2 cases where the result repeats agent text from before the last piece read, with more than 50 readable lines after it (a check that ignored that text passed the first cases); moved the log code to `scripts/build-log.mjs` to keep `speck.mjs` under 600 lines; the AC1 timing now swaps pre-written logs in by renaming, so writing 400 MB doesn't overlap a timing.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->
The board, the panel and `speck run` now look only at the end of each finished build's log, and remember what they found until that log changes. So reading the board stays quick however many tickets have been built, and a `speck run` with nothing to do sits almost idle instead of keeping a processor busy.

Nothing you see changes: the end of a build's log shown in the panel is exactly what it was. To see it for yourself, leave `speck run` going with nothing ready and watch its processor use stay near zero.

Worth keeping an eye on: one of the new checks times the board with small and large logs, so on a very busy machine it could now and then fail by chance.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 134,692
- Elapsed since build started: 25 min
- Changed lines: 136 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes): the remembered log ends are kept for the life of the process, one small entry per log, and never pruned; the AC1 test compares wall-clock times, so it could fail now and then on a heavily loaded machine.

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
    "reviewed_sha": "fa4c0c8d0459ff563648705b1702fa94d5e97927",
    "thread_id": "01a13c50-b347-7f91-88dd-a99fccb407c5",
    "seconds": 29,
    "usage": {
      "input_tokens": 133950,
      "cached_input_tokens": 94848,
      "cache_write_input_tokens": 0,
      "output_tokens": 742,
      "reasoning_output_tokens": 99
    },
    "saved_at": "2026-10-14T21:28:33.302Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/build-log-0176.test.mjs AC1 launches real status --json processes against 200 finished builds, alternating pre-written 200 KB and 2 MB logs and asserting less than 10% growth. Recorded full-suite output confirms it passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/build-log.mjs logTail expands its read until enough complete readable lines and required preceding assistant text are available. readableLog preserves the previous formatter's behaviour. Both AC2 tests passed, covering long tool output, repeated results, malformed input, Unicode, trailing whitespace and changed or missing logs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 test runs the real idle speck run with its five-second polling interval, 200 finished builds and 2 MB logs, measuring process and completed-child CPU ticks over 60 seconds. The recorded test passed the 5% threshold."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0176-tests.txt confirms 1,648 tests: 1,645 passed, zero failed and three skipped. The branch's changes against its merge base contain no weakened existing tests or unrelated implementation changes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The board now reads only the necessary end of each build log and reuses it until the file changes. Tests confirm faster board reads, low idle CPU use and unchanged messages, including unusually long logs. The full suite passed; no blocking concerns found."
  }
}
```

</details>

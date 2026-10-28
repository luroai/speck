---
id: "0537"
title: "Order same-day notes in Capture newest first"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0536"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:56:24.401Z"
approved: "2026-10-28T10:06:26.035Z"

---
# 0537 · Order same-day notes in Capture newest first

**Status:** 👍 approved

## Problem
Capture sorts notes newest first by their `Captured:` date, but that line holds only a day, so notes captured on the same day fall back to the order of their file names, which is alphabetical. On a busy day the note you captured a minute ago can sit below older ones, so the list doesn't look newest first.

## Outcome
Notes say what time they were captured, and Capture lists notes from the same day newest first by that time.

## Acceptance criteria
1. A note's `Captured:` line may give a 24-hour time after the date, as `Captured: 2026-10-27 14:32 · Status: idea`. Its status is read as today (`idea` here), and its card still says "Captured 27 Oct", as it would without the time.
2. Capture still lists notes by date, newest first. Of notes with the same date, those with a time come first, latest time first: a note captured at `2026-10-27 14:32` is above one at `2026-10-27 09:05`, whatever their file names. Notes with the same date and no time follow those, in the order they're listed in today. Notes with no date, or an impossible one, are still last.
3. A `Captured:` line whose time isn't a real time (such as `25:00` or `9:5`) sorts as if it had no time, and its card shows the date as for a note with no time.
4. The note formats in the `speck-capture` skill and in the `speck-build` skill's follow-up notes write the line as `Captured: <YYYY-MM-DD HH:MM> · Status: …`, the time in 24-hour local time when the note is written, and the brief says Capture orders notes from the same day by that time.
5. No test that passed before this change fails.

## Out of scope
- Adding times to notes already written.
- Showing the time on a card.
- The count of notes (0536) and starring notes (a later ticket).

## Notes
- Asked for by the user 2026-10-27: the Capture list doesn't look ordered newest first. Checked 2026-10-27 against the repo's own notes: the list is sorted by day, newest first, and five notes captured on 2026-10-27 are in alphabetical order of their file names (`panelModel`'s `capture` sort in `templates/panel-model.js`, which falls back to JSON order, which is `speck status --json`'s file-name order).
- 0520's decision stands: order by the `Captured:` line, never the note's body or the file's dates (file dates change on checkout and on every edit, such as triage's `Triaged:` line).
- Failing before this build: none
- AC4 changes the note format, so `test/panel-0521.test.mjs` and `test/followups-0036.test.mjs`, which pinned `Captured: <date>`, now check `Captured: <YYYY-MM-DD HH:MM>`.
- Self-check: a time must be exactly `HH:MM` with nothing more after it (`14:32:10`, `9:05` and `12:345` count as no time), tested in AC3's test; no other changes.
- Pictures: none, because the cards look exactly as before and no note in the repo has a time yet (adding them is out of scope), so a picture would show today's list.
- `ideaStatus` (`STATUS_LINE` in `scripts/core.mjs`) and `capturedOn` in `templates/panel.js` already match a line with text between the date and `· Status:`; the tests should prove it stays so.

## In plain words
Notes now record the time they were captured as well as the day, and Capture puts notes from the same day in order of that time, the latest at the top. Cards look the same: they still show only the day. Notes written before this change have no time, so on a given day they sit below the timed ones, in the order they were listed before. To see it, capture two ideas a few minutes apart and open Capture: the newer one is on top. Worth a look: a note whose time is written wrongly is simply treated as having no time.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 capturedAt only rejects digits or a colon immediately after HH:MM.; F2 AC4's tests omit the required local-time instruction and the brief's same-day ordering fact.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 314,286
- Elapsed since build started: 10 min
- Changed lines: 28 (limit 5000)
- Follow-ups:
  - Inbox: `speck/ideas/2026-10-28-steady-the-0384-ac3-running-round-test-under-load.md`. "0384 AC3" failed under load in this build's related run, after 0540 steadied it, and passed alone.
  - Skipped as a duplicate: "0232 AC3" failed under load in the same run and passed alone, matching `speck/ideas/2026-10-28-steady-the-0232-ac3-cpu-cost-test-under-load.md`.

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
    "reviewed_sha": "1535057f9c2c0c89b584dc3bb8a99f32bc18265e",
    "session": "fresh",
    "thread_id": "01a181f7-74a3-7531-bae2-9eba6001a6ce",
    "builder_response": "- Tests run: `speck test --related test/panel-0537.test.mjs test/panel-0521.test.mjs test/followups-0036.test.mjs` (the ticket's own file, the two existing files it changed, and every existing file naming a changed file).\n- Two tests failed in that run, both timing checks under load from running ~1,600 tests at once: `0232 AC3` (test/quick-waits-0232.test.mjs, CPU use of speck run's checks) and `0384 AC3` (test/review-wait-0384.test.mjs). Neither touches Capture, the note format or anything this ticket changed; both files pass when rerun alone (appended at the end of the test output).\n- test/panel-0521.test.mjs and test/followups-0036.test.mjs pinned the old `Captured: <date>` template, which AC4 changes; they now check `Captured: <YYYY-MM-DD HH:MM>`.\n- AC4's brief sentence is in the Capture part of the `speck panel` row in docs/brief.md.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 111564,
      "cached_input_tokens": 70784,
      "cache_write_input_tokens": 0,
      "output_tokens": 926,
      "reasoning_output_tokens": 34
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 40780,
      "cached": 70784,
      "write": 0,
      "output": 926
    },
    "cost_usd": 0.0978984,
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:04:39.378Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The two passing 0537 AC1 tests exercise ideaStatus and card rendering with a timed Captured line."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0537 AC2 tests exercise date precedence, descending times, midnight, stable untimed ordering, and missing or impossible dates."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "templates/panel-model.js capturedAt accepts malformed times such as 14:32x and 14:32.5 as 14:32. Direct execution confirmed both receive a sorting time instead of null."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "Both skills specify the timestamp format and 24-hour local time; docs/brief.md describes same-day ordering. The passing AC4 test checks the template facts, but does not check the local-time instruction or the brief's ordering fact."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied output records passing ticket tests and successful isolated reruns of the two timing-related failures. The committed change provides no evidence of a regression in those unrelated behaviours."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "capturedAt only rejects digits or a colon immediately after HH:MM. Consequently malformed values such as 14:32x and 14:32.5 count as valid times and move ahead of untimed notes, contrary to AC3 and the ticket's exact-HH:MM rule.",
        "suggested_fix": "Require the complete time token to be HH:MM, followed by the status delimiter or the end of the line. Add regression cases for suffix letters and fractional values.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0537.test.mjs",
        "issue": "AC4's tests omit the required local-time instruction and the brief's same-day ordering fact. Those document facts are not marked checked by review, so the criterion lacks complete test coverage.",
        "suggested_fix": "Add fact-based checks for the local-time instructions in both skills and the ordering fact in the brief, without pinning exact prose or paragraph order.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Normal timestamps sort correctly, and cards keep their existing date display. Changes are needed because malformed timestamps can still affect ordering, and the documentation checks do not cover all required facts."
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
    "reviewed_sha": "57dcc95f2d34836c9842868002cd8659fe4e3b8c",
    "session": "continued",
    "thread_id": "01a181f7-74a3-7531-bae2-9eba6001a6ce",
    "builder_response": "- Tests run: test/panel-0537.test.mjs test/panel-0521.test.mjs test/followups-0036.test.mjs\n- F1: fixed. `capturedAt` in templates/panel-model.js now takes the time only when it's followed by optional spaces then `·` or the line's end (`(?=[ \\t]*(?:·|$))`). AC3's test adds `14:32x`, `14:32.5`, `14:32:10` and `14:32pm`, each sorting as no time.\n- F2: fixed. New test `0537 AC4: both skills say the time is 24-hour local time, and the brief says Capture orders a day's notes by it` checks that each skill says the `Captured:` time is 24-hour local time, and that the brief's Capture description mentions the same day and the time, without pinning the wording.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 200275,
      "cached_input_tokens": 154624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1521,
      "reasoning_output_tokens": 34
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4871,
      "cached": 83840,
      "write": 0,
      "output": 595
    },
    "cost_usd": 0.024076,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T10:05:58.803Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Passing 0537 AC1 tests exercise status parsing and card rendering: timed notes retain their status and show Captured 27 Oct without the time."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelModel's capture comparator orders by date, then valid time descending, then original order. Passing AC2 tests cover filename independence, untimed notes, midnight, and absent or impossible dates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "capturedAt now requires a delimiter or line end after HH:MM and validates hour and minute ranges. Passing AC3 tests cover malformed suffixes, seconds, invalid ranges and unchanged card dates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both skills specify YYYY-MM-DD HH:MM and 24-hour local time when writing the note; the brief describes same-day time ordering. Both AC4 tests pass and cover these facts."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The current run reports 130 passed, zero failed and three skipped. Earlier unrelated timing failures passed isolated reruns; no regression is evident from the changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "Malformed timestamp suffixes previously counted as valid sorting times.",
        "suggested_fix": "Implemented: require a delimiter or line end after HH:MM, with regression cases for malformed suffixes.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0537.test.mjs",
        "issue": "AC4 previously lacked checks for local-time instructions and the brief's same-day ordering fact.",
        "suggested_fix": "Implemented: added passing checks for both skills' local-time instructions and the brief's ordering facts.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Same-day notes now appear newest first using valid capture times, while cards retain their existing date display. Malformed times fall back to untimed ordering. Both previous findings are resolved, and the change is ready for the owner's merge decision."
  }
}
```

</details>

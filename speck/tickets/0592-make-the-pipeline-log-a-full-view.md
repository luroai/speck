---
id: "0592"
title: "Make the Pipeline log a full view"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0591","0590"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:56:49.489Z"
waited_seconds: 4044
approved: "2026-11-09T23:34:04.791Z"

---
# 0592 · Make the Pipeline log a full view

**Status:** 👍 approved

## Problem
The Pipeline log is a pop-up of raw lines. In the redesign it's a full view you can filter, where speck's own calls stand out from the tool's routine lines.

## Outcome
The Pipeline log is a full view with filters, and speck's own lines carry its face.

## Acceptance criteria
1. Pressing the bar opens the Pipeline log as a full view: a back link, the heading, and a line with speck in its mood saying whether speck run is on, since when, and how many build slots are in use.
2. Filters, Everything, Decisions, Ships and Builds, show only those lines; Everything is chosen when it opens.
3. Each line is a row: its time in the mono font, its text, and its details, such as its log file or agent, under it in the mono font.
4. The engineering manager's own lines (0591) show speck's face beside them; the rest don't.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- A ticket's build log, which stays a pop-up (0548).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `#foreman` with `renderForeman`, `drawRunLog`, `fillLog`, `runLogRow` in `templates/panel-popups.js`; lines from `runLogSummary` and `runLogLine` in `templates/panel-model.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a blank log line no longer gets an empty row; the top isn't sticky, as it would cover a short window's log; the back link's top padding no longer doubles the safe area; speck's face in the status line has no fixed label, so its mood isn't misreported after a change; added tests for a filter kept through a refresh, the status line following the board and the box losing the full view's look once closed.

## In plain words
Pressing the bar now opens the Pipeline log as a full view, on the panel's own light or dark colours, with a link back to the lane you were on. At the top, speck in its current mood says whether speck run is on, since when, and how many build slots are in use. Below that you can filter to Decisions, Ships or Builds, and it opens on Everything. Each line is a row with its time, what happened and, under it, its log file or agent. Lines from your engineering manager carry speck's face. To see it, press the bar, or look at the pictures in this review pack. A ticket's own build log is still the pop-up it was. Lines written before speck started marking its own have no face, so older calls only show under Decisions if they say someone went with a recommendation.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The Builds filter hides real build lifecycle messages.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 2 of them merge rounds
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 726,713
- Elapsed since build started: 97 min
- Changed lines: 137 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests of the old look updated to the full view (test files): `test/panel-0366.test.mjs` (the back link for Close), `test/panel-0472.test.mjs` (the view's opened check), `test/pipeline-0415.test.mjs` (the back link for Close), `test/pipeline-0458.test.mjs` (what the view holds, the back link), `test/pipeline-0459.test.mjs` (a row's classes and time), `test/pipeline-0470.test.mjs` (the back link above the heading, and a short window scrolls to the log rather than keeping the top in view), `test/pipeline-0479.test.mjs` (no dark frame round the log, the back link), `test/build-log-0548.test.mjs` (the build log keeps the old frame, and the Pipeline log no longer shares it), `test/panel-0413.test.mjs` (the back link for Close), `test/panel-0453.test.mjs` (the Pipeline log's filter buttons for its Close).

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
    "reviewed_sha": "c2e20cb01994ce916c61e02d293816f9a59c795b",
    "session": "fresh",
    "thread_id": "01a1c296-fa97-7ea2-ad6e-5392df46487c",
    "builder_response": "- Tests run: test/pipeline-0592.test.mjs test/panel-0366.test.mjs test/panel-0472.test.mjs test/pipeline-0415.test.mjs test/pipeline-0458.test.mjs test/pipeline-0459.test.mjs test/pipeline-0470.test.mjs test/pipeline-0479.test.mjs, with `--related` adding every test file that names a changed file (41 files in the first run; 562 pass, 0 fail).\n- The whole suite isn't run for a round: `speck ship` runs it.\n- A ticket's build log stays a pop-up (out of scope): it keeps the old `#foreman` rules, and the full view's are scoped to `#foreman.log-view`.\n- \"Since when\" comes from `run.lock`'s modified time, as the process you started holds that lock through every switch to new code. `foreman.max` is speck run's own record of its build slots.\n- Pictures of Everything and Decisions in both looks are in the review pack.\n",
    "seconds": 44,
    "usage": {
      "input_tokens": 253264,
      "cached_input_tokens": 195968,
      "cache_write_input_tokens": 0,
      "output_tokens": 1103,
      "reasoning_output_tokens": 72
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 57296,
      "cached": 195968,
      "write": 0,
      "output": 1103
    },
    "cost_usd": 0.1452188,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:14:40.360Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "pipelineFrame and drawLogStatus in templates/panel-popups.js implement the full view and live status. Passing 0592 AC1 tests cover opening, back navigation, mood, start time and slot counts; browser tests cover layout."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing 0592 AC2 tests cover selection, reopening and refreshes, but RUN_LOG_BUILDS omits real build messages emitted by scripts/run.mjs. Directly calling runLogFiltered confirmed those messages disappear from Builds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runLogRow and runLogDetails render time, text and details; scoped CSS sets mono fonts. Passing 0592 AC3 tests exercise these behaviours."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runLogRow adds a face only when runLogLine detects the engineering manager marker. The passing 0592 AC4 test checks marked and unmarked rows."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists all seven updated existing test files. Reported related test results show 562 passes, zero failures and three skips; the changes remain within the Pipeline log scope."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "The Builds filter hides real build lifecycle messages. scripts/run.mjs emits “0001's build was resumed outside speck run.” and “0001 is approved, so its build outside speck run no longer counts towards max_parallel_builds.” Neither matches RUN_LOG_BUILDS. Direct evaluation confirmed both produce an empty Builds result, leaving users without relevant build updates.",
        "suggested_fix": "Extend build classification to cover the runner's actual build lifecycle messages, and add tests using these emitted formats.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The full view, live status, row details and speck faces are implemented and covered by passing tests. One filter needs fixing: Builds currently hides some real build updates, including builds resumed outside speck run."
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
    "reviewed_sha": "cb2409ece6a4816e9e075534142a5afda82ce6b3",
    "session": "continued",
    "thread_id": "01a1c296-fa97-7ea2-ad6e-5392df46487c",
    "builder_response": "- Tests run: test/pipeline-0592.test.mjs test/panel-0366.test.mjs test/panel-0472.test.mjs test/pipeline-0415.test.mjs test/pipeline-0458.test.mjs test/pipeline-0459.test.mjs test/pipeline-0470.test.mjs test/pipeline-0479.test.mjs\n- F1: fixed. `RUN_LOG_BUILDS` in templates/panel-model.js no longer lists exact phrases: a ticket's line is in Builds when it talks about its build or launching it (ship lines are matched first), and `Launched`/`Resumed` as before. `RUN_LOG_SHIPS` also gains \"last auto-ship\", which had the same gap. New test \"0592 AC2: Builds and Ships hold every form of those lines speck run writes\" feeds each format from scripts/run.mjs and scripts/ship-queue.mjs, including the two you named.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 376815,
      "cached_input_tokens": 313216,
      "cache_write_input_tokens": 0,
      "output_tokens": 1659,
      "reasoning_output_tokens": 72
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6303,
      "cached": 117248,
      "write": 0,
      "output": 556
    },
    "cost_usd": 0.0298908,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:16:33.921Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "pipelineFrame and drawLogStatus provide the back link, heading, mood and live run status. Passing 0592 AC1 tests cover start time, slot counts and refreshes; browser tests cover the full-view layout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runLogFilterOf now recognises the previously omitted build messages and additional auto-ship messages. The new passing regression test exercises actual runner message formats through the filter buttons. Existing tests cover default selection, continuation lines and refreshes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runLogRow and runLogDetails render each row's time, text and details. Passing 0592 AC3 tests check the contents and mono font rules."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runLogLine identifies the engineering manager marker, and runLogRow adds its face only to marked lines. The passing 0592 AC4 test checks both cases."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the seven updated existing test files. This round reports 195 passes, zero failures and three skips; the first round's related tests also passed. Build-log styling remains scoped separately."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "The Builds filter previously omitted real build lifecycle messages.",
        "suggested_fix": "Completed: build classification now includes those messages, with regression coverage using runner message formats.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The Pipeline log now provides a full view with live status, filters, readable rows and speck faces. The missing build updates are fixed and covered by regression tests. All criteria pass, with no remaining blocking findings."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "2f8cef0e6cc3eee6f4b279cef9f00c002682f3c0",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c296-fa97-7ea2-ad6e-5392df46487c",
    "builder_response": "- Tests run: test/pipeline-0592.test.mjs test/build-log-0548.test.mjs test/panel-0128.test.mjs test/panel-0413.test.mjs test/panel-0453.test.mjs test/panel-0366.test.mjs test/panel-0472.test.mjs test/pipeline-0415.test.mjs test/pipeline-0458.test.mjs test/pipeline-0459.test.mjs test/pipeline-0470.test.mjs test/pipeline-0479.test.mjs, with `--related` (777 pass, 0 fail).\n- Why this round: `speck ship` refused the approved branch. `git merge main` had nothing new to bring in, so the failures came from this ticket's change. The seven failing tests, and what each was:\n- 0128 AC1, AC2 and AC4: real breakage from this change, not a look test, so the tests are untouched. They compare the panel's run state to exactly `{ on, pid }`, and I had added `since` to it. `since` now travels on the Foreman's view instead (`foremanView({ since })`, `foreman.since`, `runSince` in scripts/panel-run.mjs), and `panelRunState` is as it was before this ticket.\n- 0453 AC1 AC3: a real slip of mine. The filter buttons had pill corners, and the panel's buttons have 8 px ones. I fixed the CSS (no border-radius of their own) and retook the pictures.\n- 0548 AC2, 0413 AC1/AC4/AC5, 0453 AC2 and 0453's view opener: tests of the old look that open the Pipeline log, updated to the full view and added to the Delivery log. 0548 AC2 said the build log and the Pipeline log share one frame, which this ticket ends: it now checks the build log keeps the pop-up's frame, title row, Close and log box, and that the Pipeline log, a full view, opens in the same element. 0413 presses the back link. 0453 measures a filter button, as the back link is a link with no border.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 523924,
      "cached_input_tokens": 448256,
      "cache_write_input_tokens": 0,
      "output_tokens": 2261,
      "reasoning_output_tokens": 72
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 12069,
      "cached": 135040,
      "write": 0,
      "output": 602
    },
    "cost_usd": 0.043662,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:27:17.129Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "pipelineFrame and drawLogStatus provide the full view, back link, mood and live status. Start time now flows through runSince, foremanView and foremanOf. Passing 0592 AC1 tests cover this data and rendering; browser tests cover layout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runLogFilterOf and runLogFiltered retain the corrected classification. Passing 0592 AC2 tests cover runner message formats, default selection, continuation lines and refreshes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runLogRow and runLogDetails render time, text and details, with mono fonts set by scoped CSS. Passing 0592 AC3 tests exercise these behaviours."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runLogRow adds a face only to lines marked as the engineering manager speaking. The passing 0592 AC4 test verifies marked and unmarked rows."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists the additional updated appearance tests. The test output confirms 777 passes, zero failures and three skips, including compatibility and button-border tests. The updated 0548 test explicitly checks that build logs retain their original pop-up frame."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "The Builds filter previously omitted real build lifecycle messages.",
        "suggested_fix": "Completed: classification includes the omitted messages, with regression coverage using runner message formats.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The full Pipeline log view meets all criteria. This round fixes the run-state compatibility issue and button styling, while preserving ticket build logs as pop-ups. The expanded tests pass, and no blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e2cee14ff75e1e454e7a84dd50615c01ec0f9c55",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c296-fa97-7ea2-ad6e-5392df46487c",
    "builder_response": "- Tests run: test/pipeline-0592.test.mjs test/build-log-0548.test.mjs test/panel-0128.test.mjs test/panel-0413.test.mjs test/panel-0453.test.mjs test/panel-0366.test.mjs test/panel-0472.test.mjs test/pipeline-0415.test.mjs test/pipeline-0458.test.mjs test/pipeline-0459.test.mjs test/pipeline-0470.test.mjs test/pipeline-0479.test.mjs (234 pass, 0 fail).\n- Merge round: main merged into the ticket branch after `speck ship` hit a conflict.\n- test/panel-0453.test.mjs, class logic, one conflict: only the name of the 0453 AC2 test. main (0587) changed it to \"Full ticket (0587: on a Plan ticket), Close, Save, a document's button\", dropping Review pack; this ticket changed \"the Foreman's Close\" to \"the Pipeline log's filter\". The resolved name keeps both changes. The test's body merged without a conflict.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 723937,
      "cached_input_tokens": 622464,
      "cache_write_input_tokens": 0,
      "output_tokens": 2776,
      "reasoning_output_tokens": 72
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 25805,
      "cached": 174208,
      "write": 0,
      "output": 515
    },
    "cost_usd": 0.0741808,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T23:34:01.570Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "pipelineFrame and drawLogStatus retain the full view, back link, heading, mood and live run status. Passing 0592 AC1 tests cover start time, slots and refreshes; browser tests verify layout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runLogFilterOf and runLogFiltered retain the corrected classifications. Passing 0592 AC2 tests cover all four filters, runner message formats, continuation lines, reopening and refreshes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runLogRow and runLogDetails retain time, text and details beneath each row. Passing 0592 AC3 tests check contents and mono font rules."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runLogLine detects the engineering manager marker; runLogRow adds a face only for marked lines. The 0592 AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists updated appearance tests. Current output confirms 234 passes, zero failures and three skips. The resolved panel-0453 test preserves main's Plan-ticket coverage and this ticket's filter-button coverage. Build-log tests preserve the original pop-up frame."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "The Builds filter previously omitted real build lifecycle messages.",
        "suggested_fix": "Completed: classification includes the omitted messages, with regression coverage using runner message formats.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves both sets of changes. The Pipeline log still meets all criteria, ticket build logs remain pop-ups, and the current tests pass. No blocking concerns remain."
  }
}
```

</details>

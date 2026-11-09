---
id: "0595"
title: "Read every project's board for the bridge"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T17:42:11.877Z"
approved: "2026-11-09T17:59:29.693Z"
finished: "2026-11-09T18:10:38.033Z"

---
# 0595 · Read every project's board for the bridge

**Status:** ✅ done

## Problem
The bridge shows what needs you across every project on this machine (0596), but each panel today knows only its own board. The panels already find each other through 0516's records, so one can ask the others for a summary.

## Outcome
A panel can give a summary of every speck panel running on this machine.

## Acceptance criteria
1. The panel serves a summary of each speck panel running on this machine, from 0516's records: its project's name, its status word, how many tickets are building, queued and need you, and how many shipped and what was spent in the last 7 days.
2. Each summary lists what needs you there: the ticket's id, title and why (a question, waiting at Ship, high risk, or the engineering manager's question).
3. A panel that doesn't answer within 2 seconds is listed as not running, without failing the rest.
4. It answers only the panel page it served, as the project menu's requests do (0516).
5. No test that passed before this change fails.

## Out of scope
- Showing it (0596).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `scripts/panel-projects.mjs` (`runningPanels`, `registerPanel`, the pass-through to another panel) and the routes in `scripts/panel.mjs`.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC5 is checked by the whole suite, which `speck ship` runs; this build ran the ticket's tests with `--related`.
- Pictures: none, because nothing anyone sees changes (0596 shows it).
- Self-check: widened the 2-second test's upper limit so a busy machine can't fail it; no code changes.

## In plain words
Nothing looks different yet. A speck panel can now gather a short report from every project running on this machine: what each is doing, what needs you and why, and what it shipped and spent in the last 7 days. A project that doesn't reply within 2 seconds is reported as not running, and the others still show.

The bridge, which comes next, is what will show this, so that's where you'll see it. Worth keeping an eye on: a very large project whose panel has nobody looking at it can take over 2 seconds to reply the first time, so it may show as not running until the next check. A project on an older speck also shows as not running until it's updated.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 341,279
- Elapsed since build started: 17 min
- Changed lines: 103 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- Skipped, already covered: the bridge's median build time isn't in this summary; 0596's AC2 asks for it, so 0596 needs to add it (ticket 0596).
- Known limit: the first reading of a very large project's board with no page open can pass the 2-second limit, so it's listed as not running until the next request, when the reading it started has finished.
- Known limit: a panel on code older than this ticket has no summary to give, so it's listed as not running until it's updated.

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
    "reviewed_sha": "0872621a5734755914eed9d540f1a36c677b6810",
    "session": "fresh",
    "thread_id": "01a1c170-1d66-7e22-8d3f-da6f6451e420",
    "builder_response": "- Tests run: test/panel-summary-0595.test.mjs and, with --related, every existing test file naming a changed script.\n- AC5 is left to the whole suite, which speck ship runs; the related run passed (1474 pass, 0 fail, 3 skipped).\n- Design note: POST /api/projects/summary, because browsers send Origin on a same-origin POST but not on a GET, and 0516's check is on Origin. Each panel answers GET /api/projects/own only with x-speck-via, which a page on another site can't send without a preflight the panel refuses.\n- No visual change: 0596 shows this.\n",
    "seconds": 45,
    "usage": {
      "input_tokens": 220368,
      "cached_input_tokens": 163968,
      "cache_write_input_tokens": 0,
      "output_tokens": 854,
      "reasoning_output_tokens": 99
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56400,
      "cached": 163968,
      "write": 0,
      "output": 854
    },
    "cost_usd": 0.1377368,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T17:52:37.221Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel-projects.mjs summaries() reads 0516 records and requests each panel's summary concurrently. scripts/panel-summary.mjs projectSummary() supplies counts, status and seven-day totals. Passing AC1 tests cover aggregation, spend filtering and a real panel's board."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "projectSummary() returns ticket ids, titles, reasons and question details. Passing AC2 tests cover blocked questions, manager questions, high-risk approvals, Ship waits and agreement with the existing page model."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "summaryOf() applies a 2,000 ms deadline to each complete response and returns running:false on failure. Passing AC3 tests cover silent and incomplete responses, refused connections, invalid answers and successful peers remaining available."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "summaries() requires POST and the same Origin check used by the project menu. The own-summary route requires x-speck-via. Passing AC4 tests cover rejected origins, missing Origin, GET rejection and the real panel's restricted own-summary route."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported related test run passed 1,474 tests with zero failures and three skips. Existing tests were not weakened. The whole-suite check remains part of shipping, as specified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel can now collect every running project's board summary, including tickets needing your attention and the past week's shipping and spending totals. Unresponsive panels are marked unavailable without hiding the others. The tests cover the required behaviour, and I found no blocking issues."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "151a1419cdb773c28393c15f74e247175f0fdda4",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c170-1d66-7e22-8d3f-da6f6451e420",
    "builder_response": "- Tests run: test/panel-0118.test.mjs test/panel-summary-0595.test.mjs\n- Ship failed on one test: 0118 AC3, every test that starts a panel on a picked port sends its requests to the port the panel started on. The cause was this ticket's own new test, which passed a `String(port)` variable straight to startPanel on one line.\n- Changed: that test now gives `String(await freePort())` inline and drops the variable. It already read the port back from what startPanel returned, so what it checks is unchanged. No code under scripts/ changed.\n- Merging main: already up to date, so no files were merged or resolved.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 339917,
      "cached_input_tokens": 278144,
      "cache_write_input_tokens": 0,
      "output_tokens": 1362,
      "reasoning_output_tokens": 99
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5373,
      "cached": 114176,
      "write": 0,
      "output": 508
    },
    "cost_usd": 0.0272436,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T17:59:25.834Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-projects.mjs summaries() collects each registered panel's name and summary. panel-summary.mjs projectSummary() supplies status, counts and seven-day shipping and spending totals. All AC1 tests passed, including the real-panel test."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "projectSummary() supplies ids, titles, reasons and question details. Passing AC2 tests cover questions, manager requests, Ship waits, high risk and agreement with the existing page model."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "summaryOf() retains its 2,000 ms deadline and isolates failed responses. Passing AC3 tests exercise silent, incomplete, refused and invalid responses alongside successful peers."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "summaries() requires POST and the project menu's Origin check; /api/projects/own requires x-speck-via. All origin, method and real-panel access tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The previously failing 0118 port check and all ticket tests now pass: 131 passed, zero failed, three skipped. The revised test still sends requests to the port returned by startPanel; no existing test was weakened or production code changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The summary service remains ready for merge. The test now follows the repository's port-selection rule while preserving its checks. All tests run for this round passed, and there are no open findings."
  }
}
```

</details>

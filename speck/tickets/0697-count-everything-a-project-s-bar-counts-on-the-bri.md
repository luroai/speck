---
id: "0697"
title: "Count everything a project's bar counts on the bridge"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-count-stopped-builds-on-the-bridge.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:28:31.481Z"
approved: "2026-11-15T22:31:20.541Z"

---
# 0697 · Count everything a project's bar counts on the bridge

**Status:** 👍 approved

## Problem
The bridge (All projects) counts a project's questions, the engineering manager's questions and tickets waiting at Ship under Needs you, but not a build that stopped with nothing to carry it on (0616) or a failing full suite (0630), which a project's own bar counts. So the bar can say "Needs you 1" while the bridge says "Nothing needs you" for the same project, and someone watching every project from the bridge misses it.

## Outcome
The bridge counts and shows everything a project's bar counts under Needs you.

## Acceptance criteria
1. For each project, the bridge's Needs you count is the same number the project's own bar shows, including stopped builds that nothing will carry on and a failing full suite.
2. A stopped build has a card on the bridge naming the project and the ticket and saying its build stopped, and a failing full suite has a card naming the project and the failing tests, or the exit code when no test is named, as the project's Build lane does.
3. With neither, the bridge's count and cards are as today.
4. No test that passed before this change fails.

## Out of scope
- Changing what a project's own bar counts.

## Notes
- From `speck/ideas/done/2026-11-10-count-stopped-builds-on-the-bridge.md` and `speck/ideas/done/2026-11-11-count-a-failing-full-suite-on-the-bridge.md`. The bridge's count comes from `projectSummary` in `scripts/panel-summary.mjs`; the full suite's failure is the foreman view's `full`.
- Failing before this build: none
- AC1 read with AC3: the bar's word doesn't count tickets waiting at Ship, which the bridge counts as well, as today. So the bridge's count is the bar's number plus the tickets at Ship; the tests check that the items other than those at Ship add up to the bar's number.
- Self-check: the brief said every bridge card opens a ticket; it now says a failing full suite's card names its failing tests or exit code and opens its project.

## In plain words
All projects now counts everything a project's own bar counts as needing you. A build that stopped and that nothing will pick up again gets a card naming its project and ticket. A failing full suite gets a card naming its project and the failing tests, or the exit code when no tests are named. Pressing the full suite's card takes you to that project. To see it, open All projects while one of your projects has a stopped build or a failing full suite: the count and the cards should match what that project's bar says. Tickets waiting at Ship still count on All projects as before, though a project's own bar doesn't count them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 313,496
- Elapsed since build started: 63 min
- Changed lines: 20 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none to the inbox. Known limit: the bridge leaves out an engineering manager's question about a ticket that isn't on the board, which the bar's word would count; that has always been so and this ticket didn't change it.

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
    "reviewed_sha": "fcca68165ccacc7e64b5aea67b1a0e0f05e5f8df",
    "session": "fresh",
    "thread_id": "01a1e12f-8345-77f1-b6c6-8a1b2b10ab78",
    "builder_response": "- Tests run: `speck test --related test/panel-0697.test.mjs` before review (1646 passed, 0 failed; it brought in every test file naming docs/brief.md or templates/panel-header.js). After that run I shortened the stopped card's reason so it fits on a phone, then ran test/panel-0697.test.mjs test/panel-0596.test.mjs test/panel-summary-0595.test.mjs test/panel-0432.test.mjs test/panel-0433.test.mjs (205 passed, 0 failed): that output is attached.\n- AC1 and AC3 together: the bar's word (\"Needs you <n>\") doesn't count tickets waiting at Ship, while the bridge counts them as well, today. AC3 keeps that, so the bridge's count is the bar's number plus the tickets at Ship. The AC1 tests build the bar's word with the real foremanView and the summary from the same board and record, and check that the items other than at-Ship ones add up to it. This is written in the ticket's Notes.\n- Stopped builds use foremanView's own rule (stoppedForYou), with the engineering manager's questions about the same ticket left out as the bar leaves them out. The full suite counts while foremanView gives `full` without a fix ticket on its way (0658), as the bar does.\n- The full suite's card names no ticket: it names its project, \"Full suite fails on <base>\", the short commit and the failing tests or the exit code, and pressing it switches to its project rather than opening a ticket.\n- docs/brief.md's sentence on the bridge's cards now says so.\n- Pictures of the bridge in both looks are in the review pack.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 174786,
      "cached_input_tokens": 124160,
      "cache_write_input_tokens": 0,
      "output_tokens": 690,
      "reasoning_output_tokens": 57
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50626,
      "cached": 124160,
      "write": 0,
      "output": 690
    },
    "cost_usd": 0.120568,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:49:38.776Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel-summary.mjs projectSummary reuses stoppedForYou and counts foreman.full unless a fix is underway. Passing 0697 AC1 tests compare its counts with real foremanView output, including overlapping manager questions. Existing Ship counts are preserved as clarified in the ticket."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-header.js bridgeParts renders stopped-build cards with project and ticket, and full-suite cards with project and failing tests or exit code. Passing 0697 AC2 tests exercise rendering and the full-suite card’s project navigation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0697 AC3 test verifies existing question and high-risk Ship items and counts remain unchanged when neither new condition applies."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported final targeted run: 205 passed, 0 failed, 3 skipped. The reviewed change preserves existing counting paths and does not weaken existing tests. The whole-suite shipping check remains pending."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The All projects view now counts stopped builds needing attention and failing full suites, and shows cards explaining each problem. Existing questions and Ship items retain their behaviour. The tests exercise the counts, card content and project navigation; no blocking issues found."
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
    "reviewed_sha": "ee444b1f6f94b219fbf3c29f27d12a7f0755a938",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1e12f-8345-77f1-b6c6-8a1b2b10ab78",
    "builder_response": "- Merge round after merging main into the ticket branch.\n- docs/brief.md (class: logic, 1 conflict, on the long `speck panel` line): main added the Shipped lane's By model table and Built with, and a sentence on `speck test --related`; this ticket changed the bridge's card sentence. They touch different parts of the line, so I took main's version and applied this ticket's change to the bridge's card sentence on it, unchanged. Nothing else changed in the merge.\n- Tests run: test/panel-0697.test.mjs test/panel-0596.test.mjs test/panel-summary-0595.test.mjs test/panel-0432.test.mjs test/panel-0433.test.mjs (205 passed, 0 failed).\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 312154,
      "cached_input_tokens": 243072,
      "cache_write_input_tokens": 0,
      "output_tokens": 1342,
      "reasoning_output_tokens": 57
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 18456,
      "cached": 118912,
      "write": 0,
      "output": 652
    },
    "cost_usd": 0.0553232,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T22:31:17.064Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "projectSummary in scripts/panel-summary.mjs and stoppedForYou/foremanView in scripts/foreman.mjs are unchanged from the approved commit. The four passing 0697 AC1 tests compare bridge counts with the real bar rules, preserving the existing additional Ship count."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "bridgeParts in templates/panel-header.js and the 0697 tests are unchanged from the approved commit. Passing AC2 tests cover project and ticket identification, stopped-build wording, failing test names, exit-code fallback and full-suite project navigation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0697 AC3 test confirms existing question and Ship items and counts remain unchanged when neither new condition applies. The merge preserves that implementation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The fresh targeted run reports 205 passed, 0 failed and 3 skipped. No implementation or test changes occurred during the merge in the reviewed files. git diff --check passes; the whole-suite shipping check remains pending."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approval stands after the merge. The bridge still shows stopped builds and failing full suites correctly. The documentation resolution preserves main’s additions and the approved bridge description exactly. The targeted tests pass, and no new issues were found."
  }
}
```

</details>

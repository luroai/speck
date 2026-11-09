---
id: "0568"
title: "List what speck decided for you in the panel"                # one outcome, no "and"
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
after: ["0564","0565","0567"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-09T00:13:58.642Z"
approved: "2026-11-09T00:35:03.905Z"

---
# 0568 · List what speck decided for you in the panel

**Status:** 👍 approved

## Problem
With speck deciding, you need one place to see what it chose and to change any you'd have chosen differently. Today each choice is a line in its ticket's Notes, and `speck status` lists only the last 24 hours.

## Outcome
The panel has a Decided for you list of the recommendations speck took, with a way to change one while its ticket waits to ship.

## Acceptance criteria
1. `speck status --json` lists each recommendation speck took in the last 7 days, newest first: the ticket's id and title, the option, when, and whether the ticket's criteria changed (0565).
2. When speck took at least one in the last 7 days, the panel shows a line under its status saying how many, and pressing it opens the Decided for you list, giving each one's ticket id and title, the option, when, and that it changed a criterion where it did.
3. A decision whose ticket is approved and not shipped has a Change button, which opens Ask for changes for that ticket as its review pack does. Other decisions have none.
4. The list fits a phone-width screen, and closes with its Close button or Escape.
5. No test that passed before this change fails.

## Out of scope
- The panel's new look and taking out the LCD screen, which come later from the mock.
- Changing a decision once its ticket has shipped.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- The mock of the panel made on 2026-11-08 shows the intended layout of the Decided for you list.
- Today: "chosen by speck" Notes lines are parsed by `wentWithLines` in `scripts/foreman-took.mjs`; Ask for changes is in `templates/panel-popups.js`.
- Waits for 0564 and 0567, which write the lines it lists, and 0565, which gives `criteria_changed`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the Decided for you line behind the open list is now held with the rest of the page, so Tab can't reach it; and a shipped ticket's criteria change is read from history, as its branch has gone.

## In plain words
When speck has made a decision for you in the last 7 days, a line under its status in the panel says how many. Press it to see each one: the ticket, what speck chose, when, and whether the ticket's acceptance criteria changed. If that ticket is approved and waiting to ship, a Change button opens its review pack, where you can ask for changes. Close or Escape shuts the list.

To see it, wait for speck to take a recommendation with watch set to decide, then look under the screen at the top of the panel.

Worth keeping an eye on: a ticket shipped through a squashed pull request can't show that its criteria changed, because the history that says so is gone.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 332,200
- Elapsed since build started: 21 min
- Changed lines: 144 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

### Follow-ups
- Known limit: `shippedCriteriaChanged` reads the ticket's `speck start` commit, so a ticket shipped by a squashed pull request reports no criteria change. No idea note: squashing isn't what `speck ship` does.
- None sent to the inbox.

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
    "reviewed_sha": "0943147c1596f736a6abb0ba3a5c87dea45d15f0",
    "session": "fresh",
    "thread_id": "01a1bdb0-6a77-7111-a51d-35c64621149e",
    "builder_response": "- Tests run: test/panel-decided-0568.test.mjs and the existing test files `speck test --related` chose for the files this branch changed, plus the commands.checks files.\n- Round 1, so no findings to answer. Pictures in the review pack use sample decisions injected into the page, because this repo has no decisions in the last 7 days; a real panel confirmed `decided` reaches the page.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 205767,
      "cached_input_tokens": 157824,
      "cache_write_input_tokens": 0,
      "output_tokens": 782,
      "reasoning_output_tokens": 74
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47943,
      "cached": 157824,
      "write": 0,
      "output": 782
    },
    "cost_usd": 0.1194884,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:24:10.669Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman-took.mjs decidedFor filters seven days and sorts newest first; statusData supplies ticket details and criteria_changed, including shipped history. Five passing AC1 tests cover filtering, real ticket notes, branch changes and shipped tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderDecided and decidedRow in templates/panel-popups.js show the count and requested decision details. Passing AC2 tests exercise opening, content, empty lists and safe rendering of ticket text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "renderDecided restricts Change to approved tickets that are not shipping; openPack reuses the review-pack flow. Three passing AC3 tests verify eligibility, Ask for changes and removal after status changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "closeDecided and the Escape handler close the list; panel-popups.css wraps long content. Passing AC4 tests cover both closing controls and actual Chromium layout at 320 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related-test and checks run passed 1,392 tests with zero failures and three skips. The diff reveals no unrelated changes or weakened existing tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now lists speck’s recent decisions and lets you request changes while a ticket waits to ship. The tests cover the data, controls and phone layout, including criteria changes on shipped tickets. No blocking concerns found."
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
    "reviewed_sha": "d2d7ec78620022a8110f0a2ebde571345b045d3c",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1bdb0-6a77-7111-a51d-35c64621149e",
    "builder_response": "- Tests run: test/panel-0161.test.mjs test/panel-0417.test.mjs test/panel-0427.test.mjs test/resume-0044.test.mjs test/status-json.test.mjs test/panel-decided-0568.test.mjs, plus the commands.checks files.\n- Merge round. `speck ship` found five existing tests failing on this ticket merged with main. main merged in with no conflicts. All five came from this ticket's own change, not from main's newer work, and none of those existing tests was changed.\n- 0030 AC1 and 0044 AC3 pin `speck status --json`'s exact top-level keys. `decided` is now left out when there is nothing to list (scripts/speck.mjs), so a board with no decisions keeps those keys. The panel already treats a missing `decided` as none. This ticket's own test changed to match: with no recommendations taken, `decided` is undefined rather than [].\n- 0161 AC4 allows only #full-ticket:focus to remove the focus ring: removed `#decided:focus { outline: none }`.\n- 0417 AC1 allows a plain 44 px minimum only in the header's and cards' stylesheets: moved the `.decided-line` rules to templates/panel-header.css, unchanged.\n- 0427 AC4 finds the Close rule by its exact selector list: put that selector list back, and gave `#decided .close` its own rule with the same declarations.\n",
    "seconds": 85,
    "usage": {
      "input_tokens": 330920,
      "cached_input_tokens": 267008,
      "cache_write_input_tokens": 0,
      "output_tokens": 1280,
      "reasoning_output_tokens": 74
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 15969,
      "cached": 109184,
      "write": 0,
      "output": 498
    },
    "cost_usd": 0.0478364,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:35:00.022Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman-took.mjs decidedFor filters and orders recent recommendations; scripts/speck.mjs statusData supplies details and criteria-change flags. Passing AC1 tests cover real notes, branch changes and shipped history. Omitting decided when empty preserves existing JSON compatibility."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-popups.js renderDecided and decidedRow display the count and all requested details. Passing AC2 tests exercise opening, contents and absence of the line when empty."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "renderDecided limits Change to approved tickets that are not shipping; openPack opens the existing review pack. Passing AC3 tests verify eligibility, Ask for changes and status updates."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Close and Escape handlers remain intact. Passing AC4 tests cover closing, holding the background page and actual browser layout at 320 px. Moving the line's CSS preserves its styling."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0568-tests.txt reports 170 passes, zero failures and three skips. Previously failing test files were included; existing tests were not modified. Compatibility fixes preserve the feature and main's behaviour."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change still meets all five criteria. The compatibility fixes address the failures found during shipping without weakening existing tests or changing the intended behaviour. No blocking concerns remain."
  }
}
```

</details>

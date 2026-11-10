---
id: "0610"
title: "Put All projects in the project menu's list"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-put-all-projects-in-the-project-menu-s-list.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0609"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:37:22.396Z"
approved: "2026-11-10T10:52:27.087Z"
finished: "2026-11-10T11:03:05.223Z"

---
# 0610 · Put All projects in the project menu's list

**Status:** ✅ done

## Problem
With two or more projects running, All projects is a button beside the project menu's caret in the black bar, taking room from the status on a phone, where the menu's own list is where it belongs.

## Outcome
All projects is an entry in the project menu's list, not a separate button.

## Acceptance criteria
1. With two or more speck panels running, the project menu's list has All projects as its first entry, which opens the bridge, and the projects under it; there's no All projects button beside the menu.
2. With one panel running, the list has no All projects entry, as today.
3. The menu shows the project the panel is showing, or All projects while the bridge is open.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The bridge itself (0596).

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0596's build. `test/panel-0516.test.mjs` compares the list's entries exactly; this ticket may change it. Today: `drawProjects`, `chooseProject` in `templates/panel-header.js`. Waits for 0609, which changes the same file.
- Relies on nothing outside this repo.
- Failing before this build: none
- Found at build: 0604 already took the separate All projects button out and put All projects in the menu's list, last. What's left for AC1 is making it the list's first entry; AC2 and AC3 already held and get tests of their own.
- Self-check: added a test that All projects still comes first while the project shown has stopped, above its "(stopped)" entry; no code change needed.
- Pictures: none, because the change is only the order of the entries in the browser's own drop-down list, which headless Chromium doesn't draw in a screenshot; the bar itself looks exactly as before.

## In plain words
With two or more projects' panels running, All projects is now the first entry in the project menu on the black bar, with your projects listed under it. It used to be at the bottom of that list. Nothing else changes: choosing it still opens the view of every project, and the menu still shows the project you're looking at.

To see it, start a second project's panel, then open the menu on the project's name in the bar. With only one panel running, there's no menu and no All projects, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Criterion 4 explicitly requires the Delivery log to list the tests changed for the new behaviour, but that section is empty.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 338,534
- Elapsed since build started: 15 min
- Changed lines: 8 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed for the new behaviour: `test/panel-0604.test.mjs` (0604 AC2, the menu's entries now start with All projects) and `test/panel-0580.test.mjs` (0580 AC3, the same order). Comments only, saying All projects is the first entry: `test/panel-0596.test.mjs` and `test/panel-0516.test.mjs`.

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
    "reviewed_sha": "00ffb49a45020e2b527e775652d06c51d8afdabf",
    "session": "fresh",
    "thread_id": "01a1c50b-c7de-7242-b03d-bd688280f992",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0610.test.mjs test/panel-0604.test.mjs test/panel-0580.test.mjs test/panel-0596.test.mjs test/panel-0516.test.mjs, which also ran every test file naming docs/brief.md or templates/panel-header.js (117 files, 0 failures).\n- Found at build: 0604 had already removed the separate All projects button and made All projects the project menu's last entry. This build moves it to the first entry (`unshift` in `drawProjects`), and adds tests for AC1 to AC3, including the stopped-project list.\n- AC4: tests changed for the new order: test/panel-0604.test.mjs (0604 AC2, list order) and test/panel-0580.test.mjs (0580 AC3, list order); comments only in test/panel-0596.test.mjs and test/panel-0516.test.mjs. docs/brief.md's sentence saying \"last, All projects\" now says it's the first entry.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 117182,
      "cached_input_tokens": 73600,
      "cache_write_input_tokens": 0,
      "output_tokens": 814,
      "reasoning_output_tokens": 20
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43582,
      "cached": 73600,
      "write": 0,
      "output": 814
    },
    "cost_usd": 0.102664,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:41:19.144Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js drawProjects() puts All projects first with unshift when at least two panels run. The three passing AC1 tests in test/panel-0610.test.mjs exercise ordering, opening the bridge, absence of a separate button and the stopped-project case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawProjects() adds All projects only when list.length >= 2. The passing 0610 AC2 test checks a single panel and missing project data."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawProjects() selects the current project unless bridgeOpen is true. The passing 0610 AC3 test checks the current project, All projects while open, and restoration after Escape."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "test/panel-0580.test.mjs and test/panel-0604.test.mjs now assert the new order. The saved test output reports 1,280 passes, three skips and zero failures. However, the ticket's Delivery log contains only its placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0610-put-all-projects-in-the-project-menu-s-list.md",
        "issue": "Criterion 4 explicitly requires the Delivery log to list the tests changed for the new behaviour, but that section is empty.",
        "suggested_fix": "Add a Delivery log entry naming the changed order assertions in test/panel-0580.test.mjs and test/panel-0604.test.mjs. Distinguish the comment-only updates in panel-0516 and panel-0596 if listing those too.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The menu change works and its behaviour is covered by passing tests. Approval is held only because the required list of updated tests is missing from the Delivery log."
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
    "reviewed_sha": "914497bd3e342692ebac9c6c7c1629aa6271ee00",
    "session": "continued",
    "thread_id": "01a1c50b-c7de-7242-b03d-bd688280f992",
    "builder_response": "- Tests run: test/panel-0610.test.mjs test/panel-0604.test.mjs test/panel-0580.test.mjs test/panel-0596.test.mjs test/panel-0516.test.mjs (with the repo's checks).\n- F1: fixed. The ticket's Delivery log now lists the tests changed for the new order (panel-0604, panel-0580) and, separately, the comment-only updates (panel-0596, panel-0516).\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 208262,
      "cached_input_tokens": 161792,
      "cache_write_input_tokens": 0,
      "output_tokens": 1421,
      "reasoning_output_tokens": 20
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 2888,
      "cached": 88192,
      "write": 0,
      "output": 607
    },
    "cost_usd": 0.0206652,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:42:06.079Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js drawProjects() puts All projects first when at least two panels run. The three passing AC1 tests in test/panel-0610.test.mjs check ordering, opening the bridge, absence of a separate button and the stopped-project case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawProjects() adds All projects only when list.length >= 2. The passing 0610 AC2 test checks single-panel and missing-project-data cases."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawProjects() selects the shown project unless bridgeOpen is true. The passing 0610 AC3 test checks selection before opening the bridge, while open and after Escape."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-0604 and panel-0580 assert the new order, and the ticket's Delivery log now names both, separately identifying comment-only updates. The latest test output reports 178 passes, three skips and zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0610-put-all-projects-in-the-project-menu-s-list.md",
        "issue": "The Delivery log previously omitted the tests changed for the new behaviour.",
        "suggested_fix": "Completed: the Delivery log now lists the changed assertions and distinguishes comment-only updates.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "All projects now appears first in the project menu, opens the bridge and preserves the correct selection. The tests pass, the required Delivery log is complete, and no blocking concerns remain."
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
    "reviewed_sha": "0fb1dd550c7c3534e51c3e5e17f325b93dfba024",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c50b-c7de-7242-b03d-bd688280f992",
    "builder_response": "- Merge round: merged main into the branch (`git merge main`, no rebase).\n- docs/brief.md (class: logic, 1 conflict on the long `speck panel` table row): took main's version of the line, so all of main's newer changes in it are kept, then made this ticket's one change to it again, \"lists the running projects and, last, All projects\" becoming \"lists the running projects under its first entry, All projects\". The brief now differs from main only by that wording.\n- Tests run: test/panel-0610.test.mjs test/panel-0604.test.mjs test/panel-0580.test.mjs test/panel-0596.test.mjs test/panel-0516.test.mjs test/docs-0597.test.mjs (with the repo's checks): 182 pass, 0 fail.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 336451,
      "cached_input_tokens": 271104,
      "cache_write_input_tokens": 0,
      "output_tokens": 2083,
      "reasoning_output_tokens": 20
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 18877,
      "cached": 109312,
      "write": 0,
      "output": 662
    },
    "cost_usd": 0.0553052,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:52:24.712Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js drawProjects() puts All projects first for two or more panels. Passing AC1 tests in test/panel-0610.test.mjs exercise ordering, opening the bridge, absence of a separate button and the stopped-project case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawProjects() adds All projects only when list.length >= 2. The passing 0610 AC2 test exercises single-panel and missing-project-data cases."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawProjects() selects the shown project unless bridgeOpen is true. The passing 0610 AC3 test checks selection before opening the bridge, while open and after Escape."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-0580 and panel-0604 assert the new order, and the Delivery log lists both updates. The latest test output records 182 passes, three skips and zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0610-put-all-projects-in-the-project-menu-s-list.md",
        "issue": "The Delivery log previously omitted the tests changed for the new behaviour.",
        "suggested_fix": "Completed: the Delivery log lists the changed assertions and separately identifies comment-only updates.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The menu behaviour remains correct after the merge, and the tests pass. The brief preserves all of main’s newer content, with only the intended menu-order wording changed. No blocking concerns remain."
  }
}
```

</details>

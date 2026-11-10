---
id: "0610"
title: "Put All projects in the project menu's list"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0610 · Put All projects in the project menu's list

**Status:** 🔍 reviewing

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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

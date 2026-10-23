---
id: "0406"
title: Put the building Settings groups in one box                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-fold-parallel-and-limits-into-building-and-reviewing.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0405"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:20:10.230Z"

---
# 0406 · Put the building Settings groups in one box

**Status:** 🔍 reviewing

## Problem
Settings splits building into three boxes: "Building and reviewing", "How much runs at once" and "Ticket size limits". Those belong together, so the view is longer than it needs to be.

## Outcome
Parallel runs and ticket size limits sit in the Building and reviewing group.

## Acceptance criteria
1. Settings has one "Building and reviewing" group and no separate "How much runs at once" or "Ticket size limits" groups.
2. That group holds, in order: the builder and reviewer settings it already has, then `max_parallel_builds` and `max_parallel_tests`, then `limits.max_acceptance_criteria`, `limits.max_changed_lines` and `limits.max_review_rounds`. Each setting still works as it does today.
3. Shipping and Foreman stay their own groups. No test that passed before this change fails, except a check that those two titles are their own groups, which is changed to check criterion 1.

## Out of scope
- Renaming any setting, or changing what it does.
- Appearance, Auto-build or Your agents.

## Notes
- Asked for 2026-10-23 from the "How much runs at once" heading. The three groups are entries in `SETTING_GROUPS` in `scripts/settings.mjs` (0257, 0273).
- Waits for 0405: both change how Settings is grouped or drawn (`scripts/settings.mjs`, `templates/panel.html`).
- Failing before this build: none
- Self-check: no changes. The panel draws whatever groups the server gives, so only `SETTING_GROUPS` changed; `test/panel-0257.test.mjs`'s list of groups was the check of the old titles (AC3).

## In plain words
Settings is shorter: how many builds and test runs go at once, and the ticket size limits, now sit at the end of the Building and reviewing box instead of in two boxes of their own. Every setting works and saves just as before; only where it sits has moved. To see it, open Settings in the panel and scroll to Building and reviewing. Shipping and Foreman are still their own boxes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "b5a80a63d289a19319df6e4207505d3c85978486",
    "session": "fresh",
    "thread_id": "01a168b6-3685-7ab0-b5ab-575a41f0870c",
    "builder_response": "- Tests run: test/settings-groups-0406.test.mjs test/panel-0257.test.mjs (plus the commands.checks files speck adds). Before committing I also ran every test file that uses SETTING_GROUPS or panelSettings (27 files, 364 tests, all passed).\n- The change is only in SETTING_GROUPS in scripts/settings.mjs: the panel and `speck config show` draw the groups the server gives, so no template change is needed.\n- AC3: test/panel-0257.test.mjs's GROUPS list was the check that the old titles were their own groups; it now lists the merged group.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 86003,
      "cached_input_tokens": 50816,
      "cache_write_input_tokens": 0,
      "output_tokens": 520,
      "reasoning_output_tokens": 8
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T12:22:32.942Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs SETTING_GROUPS merges the three groups. The passing 0406 AC1 test checks both the definitions and headings rendered by the panel's actual page script."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "SETTING_GROUPS retains every setting, default and explanation in the requested order. Both 0406 AC2 tests passed: one checks the order returned by panelSettings; the other saves and reads back all five moved settings using panelSetSetting."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0406 AC3 test verifies Shipping and Foreman remain separate with their existing settings. test/panel-0257.test.mjs updates the old grouping expectation without removing behavioural checks. The recorded run reports 125 passed, 3 skipped and no failures; the production diff changes only grouping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Parallel runs and ticket size limits now sit beneath the existing builder and reviewer settings in one box. Shipping and Foreman remain separate. The tests cover the rendered headings, setting order and saving the moved settings. No blocking issues found."
  }
}
```

</details>

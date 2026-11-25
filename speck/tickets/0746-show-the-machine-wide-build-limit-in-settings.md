---
id: "0746"
title: "Show the machine-wide build limit in Settings"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-show-the-machine-wide-build-limit-in-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:18:34.320Z"
approved: "2026-11-25T00:01:01.728Z"

---
# 0746 · Show the machine-wide build limit in Settings

**Status:** 👍 approved

## Problem
0726 added `machine_parallel_builds`, a limit on builds across every project on the machine, but only `speck config set` and `speck config show` reach it. Someone who tunes speck from the panel won't know it exists or that it's set.

## Outcome
Settings shows `machine_parallel_builds` after Builds at once, and it can be changed there.

## Acceptance criteria
1. Settings shows the machine-wide build limit right after Builds at once, with its value from the home folder (blank when unset), saying it applies to every project on this machine.
2. Changing it saves it straight away to the home folder's settings, as `speck config set machine_parallel_builds <n>` does, changing nothing in the repo; blank removes it.
3. A value `speck config set` refuses, such as 0, is refused with the same reason, and the row goes back to the saved value.
4. No test that passed before this change fails.

## Out of scope
- Other settings.

## Notes
Failing before this build: none
Self-check: no changes
- 0707 did the same for `machine_parallel_tests`: add it to `PANEL_HOME_SETTINGS` and give it a row like `homeRow`'s.

## In plain words
Settings now has a "Builds at once on this machine" row right under "Builds at once". It limits how many builds run at the same time across all your projects, and you can set it from the panel.

To see it, open Settings and look under Building and reviewing. Type a number and press Enter to save it, or clear the box to remove the limit. A value such as 0 is refused, with the reason.

Keep in mind that changing it affects every project on this machine, not only this one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 173,655
- Elapsed since build started: 42 min
- Changed lines: 32 (limit 5000)
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
    "reviewed_sha": "2f38849ffd2b1afe9d0666cbb6437b8705b076f0",
    "session": "fresh",
    "thread_id": "01a21000-e7c2-74d1-94f4-8af7fa22fa33",
    "builder_response": "- Tests run: `speck test --related` with test/settings-home-0746.test.mjs test/settings-layout-0729.test.mjs test/settings-0397.test.mjs test/panel-0257.test.mjs test/settings-groups-0406.test.mjs test/settings-home-0707.test.mjs test/machine-builds-0726.test.mjs, plus the related and checks files it chose. All passed.\n- Four existing tests' expected lists and counts were updated only to include the new row.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 172964,
      "cached_input_tokens": 121728,
      "cache_write_input_tokens": 0,
      "output_tokens": 691,
      "reasoning_output_tokens": 37
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51236,
      "cached": 121728,
      "write": 0,
      "output": 691
    },
    "cost_usd": 0.1215548,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:00:57.293Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs panelSettings places homeRow('machine_parallel_builds') immediately after max_parallel_builds. homeRow reads the home settings and explains its machine-wide scope. Three passing 0746 AC1 tests cover placement, unset and saved values, and page rendering."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/settings-home.mjs panelSaveSettings routes the new key through homeSettingValue and saveHomeSetting, shared with the CLI. Passing 0746 AC2 tests exercise a page change through panelSaveRequest, blank removal, preservation of the other home setting, and unchanged repo configuration, HEAD and status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Four passing 0746 AC3 tests compare refusals with setHomeSetting for invalid values and verify nothing is saved. The passing page test checks the refusal appears and the control returns to the saved value."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test run reports 753 passed, 3 skipped and 0 failed across 756 tests. Existing expectation changes account for the added row; the branch changes remain within the ticket's scope."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now shows the machine-wide build limit directly after Builds at once. Changes save to the home settings, clearing removes the limit, and invalid values show the CLI's reason and restore the saved value. The tests cover these behaviours and report no failures. No blocking concerns found."
  }
}
```

</details>

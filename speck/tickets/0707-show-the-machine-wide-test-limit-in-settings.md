---
id: "0707"
title: "Show the machine-wide test limit in Settings"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-show-machine-parallel-tests-in-the-settings-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0729"]                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T18:49:47.995Z"
approved: "2026-11-24T18:59:49.432Z"

---
# 0707 · Show the machine-wide test limit in Settings

**Status:** 👍 approved

## Problem
0678 added `machine_parallel_tests`, a limit on test runs across every project on the machine, but only `speck config set` and `speck config show` reach it. Someone who tunes speck from the panel won't know it exists, or that it's set.

## Outcome
Settings shows `machine_parallel_tests` beside `max_parallel_tests`, and it can be changed there.

## Acceptance criteria
1. Settings shows `machine_parallel_tests` right after `max_parallel_tests`, with its current value from the home folder (blank when it isn't set), and says it applies to every project on this machine, not only this one.
2. Saving a whole number there writes it to the home folder's settings, as `speck config set machine_parallel_tests <n>` does, and changes nothing in the repo: `speck/config.yml` is unchanged and no commit is made.
3. Saving it blank removes it, as `speck config set machine_parallel_tests ""` does.
4. A value `speck config set` refuses, such as 0, is refused in Settings with the same reason, and nothing is saved.
5. No test that passed before this change fails.

## Out of scope
- Other home-folder settings, which don't exist yet.

## Notes
- `addHomeSettingRow` (`scripts/home-settings.mjs`) is called only by `speck config show`, not by `panelSettings` (`scripts/settings.mjs`). `setHomeSetting` prints and throws `SpeckError`, so the panel needs a quiet way to save. The view's "saved for your machine only" wording doesn't fit a setting shared by every project.
- speck (2026-11-24 13:51 UTC) I'll resume 0707 at 14:45 UTC: 0707 has to come after 0729, which is approved but still waiting in speck run's ship queue behind 0704's ship, so starting now would only be refused again; by 14:45 UTC both ships should have finished. Its instruction: Check that 0729 has shipped to main, then start 0707 on top of the latest main and build it; if 0729 still hasn't shipped, stop again without changing anything
- 2026-11-24: its first build stopped before starting, as it began on 0729's approved work while that conflicted with main and the main checkout had been made bare. Set ready again once 0729 shipped.
- Failing before this build: none
- Self-check: a home settings file that can't be read now leaves the row blank with the reason in its explanation, and Save refuses it with that reason, changing nothing; the same setting given twice is refused before anything is saved. Tests added for both.
- Out of scope kept: machine_parallel_builds (0726) is a home-folder setting too, but this ticket shows only machine_parallel_tests.

## In plain words
Settings now has a "Test runs at once on this machine" row, just under "Test runs at once". It's the limit on test runs across every project of yours on this computer, which until now you could only set from the command line. It's blank when there's no limit. Type a number and save to set it, or clear the box and save to remove it. It's saved in your own settings folder, so the project's settings file doesn't change and nothing is committed. A number speck can't use, such as 0, is refused with the same reason the command line gives. To see it, open Settings and look under Building and reviewing. The build limit for the whole machine still isn't in Settings: that's saved as a follow-up idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 152,686
- Elapsed since build started: 10 min
- Changed lines: 97 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): show machine_parallel_builds in Settings too: speck/ideas/2026-11-24-show-the-machine-wide-build-limit-in-settings.md

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
    "reviewed_sha": "92db2a505628e7eff5316a201b63cffb622a7299",
    "session": "fresh",
    "thread_id": "01a20eed-1e59-7473-934c-245e9dcb3371",
    "builder_response": "- Tests run: `speck test --related test/settings-home-0707.test.mjs` once (506 files: 8 tests failed in 7 files: 3 because my edit cut off part of a line in panelSettings, since fixed, and 5 that list the Settings rows and now get the new one). Then this round's output: `speck test --files test/settings-home-0707.test.mjs test/build-model-0279.test.mjs test/panel-0257.test.mjs test/settings-0276.test.mjs test/settings-0278.test.mjs test/settings-0397.test.mjs test/settings-groups-0406.test.mjs test/settings-layout-0729.test.mjs test/machine-turns-0678.test.mjs test/machine-builds-0726.test.mjs test/config-show-0269.test.mjs`, all passing.\n- Existing tests changed, each only to expect the new row: panel-0257 and settings-groups-0406 (the Building and reviewing keys now include machine_parallel_tests after max_parallel_tests), settings-0397 (one more row; a home-folder row ends by saying it's saved in the home file for every project, without a commit) and settings-layout-0729 (28 rows; the same third \"saved\" wording allowed).\n- Design: the row and the home-aware Save live in a new scripts/settings-home.mjs, because settings.mjs was at its 600-line limit. panelSaveSettings there checks a machine_parallel_tests change with the same function `speck config set` uses (homeSettingValue, split out of setHomeSetting), saves it with saveHomeSetting (quiet), then saves the rest with saveRepoSettings (the old panelSaveSettings body). If the rest is refused, the home value is put back. `speck config show` skips the panel's home row, as addHomeSettingRow still adds its own.\n- Pictures of the new row, light and dark, are with the review pack.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 151946,
      "cached_input_tokens": 107904,
      "cache_write_input_tokens": 0,
      "output_tokens": 740,
      "reasoning_output_tokens": 71
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 44042,
      "cached": 107904,
      "write": 0,
      "output": 740
    },
    "cost_usd": 0.1062744,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T18:59:33.879Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelSettings inserts homeRow immediately after max_parallel_tests. homeRow reads the home settings and explains the scope across every project. Passing 0707 AC1 tests cover placement, blank and current values, and page rendering."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSaveSettings delegates home values to saveHomeSetting without invoking repo saving for a home-only change. Passing AC2 tests exercise the page query and verify the home value, unchanged repo config, HEAD and git status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "homeSettingValue maps blank to undefined; saveHomeSetting removes the key. Passing AC3 tests cover removal and an already-unset value."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The CLI and panel share homeSettingValue validation. Passing AC4 tests compare refusal reasons for invalid values, verify nothing is saved, and exercise the page's error display."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported targeted run passed 251 tests, with zero failures and three skips. Existing test changes accommodate the additional row without weakening the behaviours they check."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now shows and edits the test limit shared by every project on the machine. Saving or clearing it uses the home settings without changing or committing the project. Invalid values receive the same explanation as the command line. The relevant tests pass; no blocking concerns found."
  }
}
```

</details>

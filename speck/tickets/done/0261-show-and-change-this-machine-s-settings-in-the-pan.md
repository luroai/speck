---
id: "0261"
title: "Manage this machine's settings from the panel"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0259","0260"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-17T09:38:25.559Z"
approved: "2026-10-17T09:46:10.309Z"
finished: "2026-10-17T09:47:50.581Z"

---
# 0261 · Manage this machine's settings from the panel

**Status:** ✅ done

## Problem
Once a setting can be set for this machine only, someone looking at the Settings view can't tell whether the value shown is theirs or the repo's, and can't choose which to change.

## Outcome
The Settings view shows which settings use this machine's value, and lets you change or clear this machine's value without changing the repo's.

## Acceptance criteria
1. In the Settings view, `max_parallel_builds` and `max_parallel_tests` each show the value speck uses and say whether it's this machine's or the repo's. With a machine value set, the repo's value is shown too.
2. Changing either one asks whether the change is for "this machine only" or "the repo, for everyone". "This machine only" saves it as `speck config set --machine` does, with no change to `speck/config.yml` and no commit. "The repo" saves it as 0258 does.
3. A machine value can be cleared from the view, after which it shows the repo's value as the one speck uses.
4. A machine-only change is saved even when the checkout isn't on the base branch or `speck/config.yml` has uncommitted changes, since nothing is committed. A request without the panel's token or from another origin is refused with 403 and changes nothing.

## Out of scope
- Making other settings machine-only: 0260 decides which can be.

## Notes
- Builds on 0258 (panel writes for settings) and 0260 (machine values).
- Failing before this build: none
- Self-check: moved the machine file's write into `saveMachineValue` so the panel and `speck config set --machine` share it; a machine save never calls `loadConfig`, so a bad hand-edited machine value can still be fixed from the panel; an unknown `?scope=` is refused with 400; `speck config show` keeps showing `speck/config.yml`'s values, as it did; added a test that the brief names `speck config set --machine`.

## In plain words
The panel's Settings view now says, for the number of builds and test runs at once, whether the value in use is this computer's own or the project's shared one, and shows the shared one too when this computer has its own. Saving either asks whether the change is for this computer only or for everyone: this computer only is saved straight away and nothing is committed, even while the project has unsaved edits or isn't on its main branch. A button clears this computer's value so the shared one applies again. To see it, open Settings, change the number of builds, pick "This machine only", and check the row now says "this machine" while the shared settings file is unchanged. Worth knowing: the terminal's settings list still shows the shared values only.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 548,162
- Elapsed since build started: 8 min
- Changed lines: 109 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: `speck config show` still lists `speck/config.yml`'s values only, not this machine's (speck/ideas/2026-10-17-show-this-machine-s-values-in-speck-config-show.md).

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
    "reviewed_sha": "512757e024f0ef922c03ac25200aff9f9fa9a6fa",
    "thread_id": "01a1493d-9151-7781-8fc9-e6465dd9ebfc",
    "seconds": 21,
    "usage": {
      "input_tokens": 208006,
      "cached_input_tokens": 159104,
      "cache_write_input_tokens": 0,
      "output_tokens": 691,
      "reasoning_output_tokens": 46
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:42:34.456Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs panelSettings supplies effective values, their source and repo values; templates/panel.html renderSettings displays them. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scopeQuestion and saveSetting ask for the scope and send the chosen request. machineSetting uses saveMachineValue; repo saves retain the existing commit path. Both AC2 tests passed, checking requests, machine storage and unchanged git state."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "machineLine provides Clear; machineSetting removes the override and panelSettings returns the repo value afterwards. The AC3 test passed for both storage and the view."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "machineSetting runs before repo branch and dirty-file checks. scripts/panel.mjs checks origin and token before processing settings writes. Both AC4 tests passed, including real HTTP refusals with unchanged storage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel shows whether these settings come from this machine or the repo, lets users choose where to save changes, and can clear machine overrides. Machine saves leave the repo and commits untouched. The supplied 50-test run passed, and the code supports all four criteria. No blocking concerns found."
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
    "reviewed_sha": "1da07478f1be78347b59e28c979fd6184522f33a",
    "merge": true,
    "thread_id": "01a1493d-9151-7781-8fc9-e6465dd9ebfc",
    "seconds": 15,
    "usage": {
      "input_tokens": 338335,
      "cached_input_tokens": 269056,
      "cache_write_input_tokens": 0,
      "output_tokens": 1130,
      "reasoning_output_tokens": 53
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:46:07.449Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs panelSettings returns effective values, source and repo values. The merged renderSettings preserves these alongside the tooltip controls. Both 0261 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scopeQuestion and saveSetting preserve scope selection. machineSetting shares saveMachineValue with the CLI; repo saves retain validation and commits. Both 0261 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "machineLine sends the clear request; machineSetting removes the override and panelSettings then returns the repo value. The 0261 AC3 storage and view test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Machine writes bypass branch and dirty-config restrictions. The settings route still checks origin and token before writing. Both 0261 AC4 tests passed, including real HTTP 403 checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves machine settings controls and the existing settings tooltips. The script-size and test-runner registration fixes address issues caused by this ticket without weakening tests. The reported run has 69 passes, no failures and three skips. All four criteria remain satisfied."
  }
}
```

</details>

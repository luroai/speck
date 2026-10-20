---
id: "0348"
title: "Pick the Foreman's model from its agent's list in the Settings view"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0347"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T21:33:21.240Z"

---
# 0348 · Pick the Foreman's model from its agent's list in the Settings view

**Status:** 🔍 reviewing

## Problem
In the panel's Settings view, `foreman_model` is a box to type in for every agent, where `builder_model` is a list of the builder's models. Someone choosing the Foreman's model has to know its exact name as that agent writes it.

## Outcome
The Settings view offers the Foreman agent's models for `foreman_model` in a list, as it does the builder's for `builder_model`.

## Acceptance criteria
1. In the Settings view, `foreman_model` is a list of the models of the agent the Foreman runs on, each shown by its display name where it has one: Claude's model names for `claude`, the models Codex lists for `codex` and the models Cursor lists for `cursor`.
2. With `foreman` blank, the list is of the agent the Foreman runs on then (the builder when that's Codex or Cursor, and Claude Code otherwise).
3. When that agent's models can't be read, `foreman_model` is a box to type in, with why in one line, as for the builder.
4. Choosing another Foreman agent in the view while one is saved says to save it, then open Settings again to pick from its models, as for the reviewer.
5. No test that passed before this change fails.

## Out of scope
- `foreman_effort`.

## Notes
- From the user (2026-10-20), with 0347, which makes the Cursor reviewer's model a list.
- After 0347, which changes the same Settings code (`scripts/settings.mjs`, `templates/panel.html`). `foremanAgentOf` in `scripts/foreman-agent.mjs` says which agent the Foreman runs on.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the view now shows the server's reason when it couldn't tell which agent the Foreman runs on, rather than saying to save one; the brief says how foreman_model is offered.

## In plain words
In the panel's Settings, the Foreman's model is now picked from a list of the models its agent offers, each with its full name, rather than typed in by hand. The list follows whichever agent the Foreman runs on, including when that's left blank and it uses the builder's. To see it, open Settings and look at the Foreman group. If that agent's models can't be read, you get a box to type in with one line saying why. If you pick a different Foreman agent, it tells you to save first and open Settings again to see that agent's models.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "80a02d3c5aa0baf7cf1f3d4ea1677153e6afb917",
    "thread_id": "01a15b3e-2440-75d1-9cd3-da6d52b7472b",
    "seconds": 25,
    "usage": {
      "input_tokens": 151604,
      "cached_input_tokens": 109696,
      "cache_write_input_tokens": 0,
      "output_tokens": 809,
      "reasoning_output_tokens": 10
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T21:36:26.132Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs foremanModels selects Claude, Codex or Cursor models; templates/panel.html foremanModelList and settingEditor render names. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanModels uses foremanAgentOf; foremanAgentChosen mirrors its fallback rules. The AC2 test exercises all three server fallbacks and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanModelList returns null on discovery failure, producing an input; foremanModelsWhy displays the reason. The AC3 test checks missing Cursor and the rendered explanation and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "foremanModelsWhy supplies the save-and-reopen message for a changed agent; the AC4 test exercises switching and restoring the saved agent and passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test log confirms 186 passed, zero failed and three skipped across the eight reported test files. No regression is evident in the implementation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/settings-foreman-0348.test.mjs:115",
        "issue": "The brief test requires the exact word 'offers' and requires foreman_model, codex debug models and agent models to appear in a particular order within one sentence. This tests document wording and sentence structure, which the review rules explicitly prohibit.",
        "suggested_fix": "Remove this assertion or replace it with independent checks of documented setting and command names that permit rewording and reordering.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The Foreman model picker works as requested, including agent defaults and a text box when models cannot be read. The reported tests pass. One documentation test must change because harmless edits to the brief would break it."
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
    "reviewed_sha": "bb6cc72204f64340e863fc837b7fd09193f00d99",
    "thread_id": "01a15b3e-2440-75d1-9cd3-da6d52b7472b",
    "seconds": 14,
    "usage": {
      "input_tokens": 241873,
      "cached_input_tokens": 195072,
      "cache_write_input_tokens": 0,
      "output_tokens": 1318,
      "reasoning_output_tokens": 10
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T21:36:53.451Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs foremanModels supplies the chosen agent's models; templates/panel.html foremanModelList and settingEditor render their display names. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanModels uses foremanAgentOf, and foremanAgentChosen mirrors its blank-setting fallback. The AC2 test checks Codex, Cursor and Claude fallbacks and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanModelList falls back to an input when models are unavailable, and foremanModelsWhy displays the reason. The AC3 test exercises discovery failure and the rendered explanation and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "foremanModelsWhy provides the save-and-reopen instruction when switching to an agent whose models were not loaded. The AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The fresh test log reports 186 passed, zero failed and three skipped across the eight reported files. The only test change removes the brittle documentation assertion."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/settings-foreman-0348.test.mjs:115",
        "issue": "The documentation test previously required particular wording and ordering within one sentence. It now checks only the setting and command names independently.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The Foreman model picker meets all acceptance criteria, including default agent selection and an explained text-entry fallback. The brittle documentation test is fixed, and all reported tests pass. Ready for the owner's merge decision."
  }
}
```

</details>

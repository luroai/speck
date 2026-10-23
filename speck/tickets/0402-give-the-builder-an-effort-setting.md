---
id: "0402"
title: "Give the builder an effort setting"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-give-the-builder-an-effort-setting.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0401"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T11:39:09.124Z"
approved: "2026-10-23T11:47:06.187Z"

---
# 0402 · Give the builder an effort setting

**Status:** 👍 approved

## Problem
Settings offers how hard the reviewer and the Foreman think. The builder has no effort control, so a Claude Code or Codex build can't be set to high, max or another effort from the panel.

## Outcome
The builder has an effort setting, offered and passed the same way as the reviewer's and the Foreman's.

## Acceptance criteria
1. In Settings, when the builder is Claude Code or Codex, an effort list sits beside the builder's model list, offering the same efforts that agent takes (including ones Codex lists for its model, such as `ultra`). Cursor and a model provider get no effort list, as today for the reviewer.
2. Saving stores `builder_effort` for this machine, as 0387 stores the other role settings. Blank means the builder's own default.
3. A Claude Code build speck run starts or resumes is given that effort as `--effort` when `builder_effort` is set. A Codex build speck run starts with its own command is given it as Codex takes effort today for the Foreman. A Cursor or provider build is not given it.
4. Changing the builder's model redraws the effort list for that model, as changing the reviewer does for `reviewer_effort`. No test that passed before this change fails, except a check that the builder has no effort, which is changed to check criterion 1.

## Out of scope
- Putting effort into the model name for Cursor, which already carries it.
- Naming the default model in the role lists: 0403.

## Notes
- Asked for 2026-10-23 from the builder row ("Opus High/Max/Ultra"). Reviewer and Foreman already show effort for agents that take one (0400); the builder row deliberately has none (`builder_effort` is absent from `EDITABLE` in `scripts/settings.mjs`).
- Checked 2026-10-23: Claude Code's reviewer path uses `--effort {effort}` (`scripts/reviewers.mjs`). Codex Foreman uses `-c model_reasoning_effort=…` (`scripts/foreman-agent.mjs`). Claude Code builds get `--model` from `withBuilderModel` in `scripts/build-model.mjs` and no effort today.
- Waits for 0401: both change Settings in `templates/panel.html` and `scripts/settings.mjs`.
- Failing before this build: none
- Self-check: the brief and README gained a fact about builder_effort, so a test now checks them. Kept as for the reviewer: an effort saved for one builder that the next doesn't offer (Codex's ultra, then Claude Code) stays saved, shown as "(not offered)", and is still passed.
- Existing tests changed: 0400's "the builder has no effort" check now checks criterion 1, and 0257, 0258 and 0386's pinned lists of settings now include builder_effort.

## In plain words
In Settings, the builder now has an effort list beside it, as the reviewer and the Foreman already do, while the builder is Claude Code or Codex. It offers the efforts that agent takes, including the ones Codex lists for the chosen model, such as ultra, and is saved for this computer only. Every build that speck run starts or resumes then thinks that hard. Cursor and model providers get no effort list, as before.

To see it, open Settings and look at the builder row: pick a Codex model and the list changes to that model's efforts. Keep an eye on one thing: if you save an effort only Codex offers and then switch the builder to Claude Code, the effort stays set, shown as "not offered", until you change it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 197,392
- Elapsed since build started: 8 min
- Changed lines: 55 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Clear a builder effort the new builder doesn't take, as switching clears builder_model: speck/ideas/2026-10-23-clear-a-builder-effort-the-new-builder-doesn-t-take.md.
- Known limit, as for foreman_effort: `speck lint` doesn't check a builder_effort typed into speck/config.yml by hand. `speck config set` and the panel do.

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
    "reviewed_sha": "9badfe3c75494c68181f6e7682bc2832c410051e",
    "session": "fresh",
    "thread_id": "01a16895-46aa-7d72-ae57-9f9ffb3c734b",
    "builder_response": "- Tests run: test/settings-builder-effort-0402.test.mjs test/settings-roles-0400.test.mjs test/config-0386.test.mjs test/panel-0257.test.mjs test/panel-0258.test.mjs\n- Existing tests changed, each because it pinned the builder having no effort setting: 0400's \"the builder has no effort\" now checks criterion 1 (the builder's effort sits in its row) and its fixture gains a builder_effort row; 0257's settings groups and count, 0258's EDITABLE list and 0386's list of your own settings now include builder_effort.\n- Pictures of the Settings view's builder row with its effort list, light and dark, are kept with the review pack.\n- Known and kept as the reviewer's own effort behaves: an effort saved for one builder that the next doesn't offer (Codex's ultra, then Claude Code) stays saved and is shown as \"(not offered)\".\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 196628,
      "cached_input_tokens": 138624,
      "cache_write_input_tokens": 0,
      "output_tokens": 764,
      "reasoning_output_tokens": 79
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T11:46:45.404Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html adds builder_effort to ROLE_PAIRS and derives model-specific choices through builderEffortModels and settingChoices. Passing 0402 AC1 tests exercise Claude Code and Codex choices, including ultra, placement beside the builder list, and hiding for Cursor and providers."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/machine.mjs includes builder_effort in MACHINE_SETTINGS; scripts/settings.mjs makes it editable and scripts/config.mjs validates it as an effort. Passing 0402 AC2 tests exercise machine saving, blank values, invalid-value rejection and the Settings save request."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/build-model.mjs withBuilderModel adds or replaces Claude's --effort; scripts/codex-build.mjs supplies model_reasoning_effort on starts and resumes. ticket-builder.mjs and hand-back.mjs isolate settings when a different builder runs. Passing 0402 AC3 tests exercise start and resume commands and exclusion from Cursor and provider commands."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html ROLE_AFFECTS redraws builder_effort when the builder/model selection changes. The passing 0402 AC4 test checks different Codex models and the default selection. Recorded results show 163 passing tests, zero failures and three skips across the selected files; existing test changes update settings inventories and the superseded no-effort assertion."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The builder now has an effort control for Claude Code and Codex, saved for this machine and passed to build commands. The tests exercise the settings, model changes and command arguments. I found no blocking issues or unrelated changes."
  }
}
```

</details>

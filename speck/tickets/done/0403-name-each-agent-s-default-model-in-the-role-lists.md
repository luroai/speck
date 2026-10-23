---
id: "0403"
title: "Name each agent's default model in the role lists"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-name-each-agent-s-default-model-in-the-role-lists.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0402"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T11:54:26.908Z"
approved: "2026-10-23T12:00:39.638Z"
finished: "2026-10-23T12:03:37.601Z"

---
# 0403 · Name each agent's default model in the role lists

**Status:** ✅ done

## Problem
Each role's model list has an entry such as "Claude Code · default". That word means nothing next to real names like Opus and Sonnet, so you can't tell which model a blank setting will run, or which one to pick to get the default back.

## Outcome
Each role's list shows every model by name, with "(default)" on the agent's default, and that entry selected when none is set.

## Acceptance criteria
1. Builder, Reviewer and Foreman lists show each of the agent's models by name (for example "Claude Code · Opus"). There is no separate entry labelled only "default", such as "Claude Code · default".
2. The agent's default model is labelled with " (default)" after its name, for example "Claude Code · Opus (default)". When that role's model setting is blank, that entry is selected. Choosing it, or leaving it selected, leaves the model blank on save, so it still means the agent's own default. Choosing another model, then choosing the "(default)" entry again, sets the default back the same way.
3. The default model is the one the agent marks as default when it lists models (Cursor's `(default)`), the provider's default model for a model provider, and for Claude Code the newest Sonnet (`sonnet`). When the agent lists no models, only that named default is offered, still with " (default)" on it.
4. No test that passed before this change fails, except a check that a blank model is labelled "default" with no model name, which is changed to check criteria 1 and 2.

## Out of scope
- The builder's effort setting: 0402.
- Making a long list easier to search: the inbox note from 0400.

## Notes
- Asked for 2026-10-23 from the builder list showing "Claude Code · default", then clarified: show the real models, and mark the default one, e.g. "Claude Code · Opus (default)", so you can see which to pick to restore the default.
- Assumption: Claude Code's own default, when no `--model` is passed, is Sonnet. Cursor marks `(default)` in `agent models`; providers have `defaultModel` in `scripts/providers.mjs`.
- Checked 2026-10-23: `roleEntries` in `templates/panel.html` pushes `${a.name} · default` for `${a.id}|` (blank model). `parseCursorModels` in `scripts/agents.mjs` strips `(default)` and does not keep which model it was.
- Waits for 0402: both change the role lists in `templates/panel.html`.
- Failing before this build: none
- Codex marks no default when it lists its models, and the criteria need one named: the build takes the first model Codex lists, as it lists them in its own order with the one it picks first (gpt-6.1-sol here, also the model in this machine's ~/.codex/config.toml). An agent whose default can't be named (its list couldn't be read, or Cursor marked none) shows as "<agent> (default)".
- A model saved by the default's own name, such as builder_model: sonnet, shows as the default's entry rather than "(not offered)".
- Self-check: no changes

## In plain words
The Builder, Reviewer and Foreman lists in Settings no longer have a vague "default" entry. Every model is shown by name, and the one each agent runs when you don't pick one says "(default)", for example "Claude Code · Sonnet (default)". When you haven't chosen a model, that entry is selected, and picking it again after trying another puts you back on the agent's own default.

To see it, open Settings and open the Builder or Reviewer list. For Codex, speck takes the first model Codex lists as its default, as Codex doesn't mark one: if you've set a different model in Codex's own settings, the label may not match what Codex runs. When an agent's models can't be read, its entry shows just "(default)" without a name.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 145,644
- Elapsed since build started: 6 min
- Changed lines: 58 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-10-23-name-codex-s-default-from-its-own-settings.md (label the model in Codex's own settings as its default).
- The older per-role model lists, shown only when the server doesn't send your agents' models, still offer "(default)" without a name; left as they are.

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
    "reviewed_sha": "61aa8b42a8a76cc1ff34e3da0a579892f705cb77",
    "session": "fresh",
    "thread_id": "01a168a1-b70c-7b72-adc9-199d1a049c97",
    "builder_response": "- Tests run: test/settings-roles-0403.test.mjs test/settings-roles-0400.test.mjs (plus the commands.checks files, which speck test --files runs)\n- Round 1. Changed existing checks: three in test/settings-roles-0400.test.mjs that a blank model is labelled \"Codex · default\" (AC4's exception); its fixture gives no default_model, so they now expect \"Codex (default)\".\n- Decision in Notes: Codex marks no default, so the first model it lists is taken as its default.\n- Pictures of the Settings view's Builder and Reviewer lists, light and dark, are kept with the review pack.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 144770,
      "cached_input_tokens": 103168,
      "cache_write_input_tokens": 0,
      "output_tokens": 874,
      "reasoning_output_tokens": 160
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T12:00:24.984Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html roleEntries names models and replaces the separate default entry. Passing test '0403 AC1' checks all three role lists."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "roleEntries uses a blank model value for the named default; roleEditor saves that blank value. The three passing '0403 AC2' tests cover selection, restoring and saving the default, and existing explicitly named defaults."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/settings.mjs defaultModelOf selects Sonnet, the provider default, Cursor's marked default and, following the ticket's Notes, Codex's first listed model. scripts/agents.mjs preserves Cursor's marker. Three passing '0403 AC3' tests exercise these paths and unavailable-model fallbacks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test run reports 129 passed, 0 failed and 3 skipped. The existing test changes replace only the obsolete default labels allowed by this criterion. No unrelated implementation changes were found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The role lists now name the default model and let users restore it while keeping the saved model setting blank. The targeted tests pass. Codex follows the ticket's stated convention of treating its first listed model as the default; unavailable defaults use the documented fallback label."
  }
}
```

</details>

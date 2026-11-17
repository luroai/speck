---
id: "0700"
title: "Stop calling Sonnet Claude Code's default model"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-17
started: "2026-11-17T19:13:59.448Z"

---
# 0700 · Stop calling Sonnet Claude Code's default model

**Status:** 🔍 reviewing

## Problem
The Builder, reviewer and level lists offer "Claude Code · Sonnet (default)", and picking it saves a blank model, which leaves the choice to Claude Code. speck assumes Claude Code's own default is Sonnet (0403, `defaultModelOf` in `scripts/settings.mjs`), but it depends on the account: on a Max plan it's Opus. So someone who picks Sonnet gets every build on Opus, at several times the cost, while the panel says Sonnet. It happened in a project on 17 November: ticket 0002 showed "Claude Code · default model" and was built with claude-opus-5-5.

## Outcome
Picking a Claude model in any list saves that model, and nothing claims to know Claude Code's default.

## Acceptance criteria
1. In the Builder's list, each level's list and every other list that offers Claude Code's models, each of Fable, Opus, Sonnet and Haiku saves its own name (`fable`, `opus`, `sonnet`, `haiku`) as the model, and none of them is labelled "(default)".
2. Those lists also offer "Claude Code · its own default", which saves a blank model, and its words don't name a model.
3. A saved blank Claude model is shown wherever the panel shows a builder or level, as "Claude Code · its own default" (in the Level menu and a ticket's Builder fact too), never as Sonnet or another model by name.
4. A list whose saved Claude model is `sonnet` shows Claude Code · Sonnet as its choice, and one whose saved model is blank shows Claude Code · its own default.
5. Codex's, Cursor's and model providers' defaults are named as today. No test that passed before this change fails.

## Out of scope
- Reading Claude Code's real default from the account or its settings.
- Changing settings people have already saved.

## Notes
- Found 2026-11-17. `defaultModelOf` returns `'sonnet'` for claude; `roleEntries` in `templates/panel-settings.js` then makes the blank entry stand in for Sonnet.
- Checked 2026-11-17: Claude Code takes `--model sonnet` and the other aliases (as `scripts/build-model.mjs` passes builder_model), and with no `--model` it uses the account's own default, which was Opus on this machine.
- Failing before this build: none
- Existing tests changed: six tests in 0403, 0407, 0661 and 0666 asserted that Claude Code's blank model is Sonnet (the defect this ticket fixes). Their Claude Code expectations and fixtures now match AC1–AC4. Their checks for Codex, Cursor and providers are unchanged, and 0403's "saved by the default's own name" test now checks Codex's default, since Claude Code no longer has a named one.
- Self-check: a saved blank Claude model with Claude Code not one of your agents read "Claude Code (default)"; it now reads "Claude Code · its own default" too, with a test.

## In plain words
Choosing Sonnet for the builder, the reviewer or a build level now really means Sonnet: the choice is saved as Sonnet, so builds run on it rather than on whatever Claude Code would pick for your account. Each list now offers Fable, Opus, Sonnet and Haiku by name, plus a separate "Claude Code · its own default", which leaves the choice to Claude Code and doesn't pretend to know which model that is. A ticket's Builder fact and the Level menu use the same words.

To see it, open Settings and look at the Builder's list or a build level's list. Settings saved earlier with no model now read "its own default". If you meant Sonnet, choose Sonnet again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-up, no idea note): the test fixtures in test/panel-builder-0669.test.mjs and test/settings-0409.test.mjs still give Claude Code `default_model: 'sonnet'`, which the server no longer sends. The page ignores it, so they pass, but they could drop it.

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
    "reviewed_sha": "ef0b20fa9601930670cf8f14544da9f1da8d7212",
    "session": "fresh",
    "thread_id": "01a1eaf5-6dcb-7972-a035-c8ce77bb056f",
    "builder_response": "- Tests run: test/settings-0700.test.mjs test/settings-0407.test.mjs test/settings-levels-0661.test.mjs test/settings-levels-0666.test.mjs test/settings-roles-0403.test.mjs (plus the commands.checks files speck adds). Before that, `speck test --related test/settings-0700.test.mjs` ran every test file naming a changed file: 4182 passed, 6 failed, all six asserting Sonnet as Claude Code's default (listed below), now updated.\n- Change: the server no longer names a default model for Claude Code (`defaultModelOf` in scripts/settings.mjs). The page ignores one even if given (`defaultSlug` in templates/panel-settings.js), labels Claude Code's blank model \"Claude Code · its own default\" (including when Claude Code isn't one of your agents, and in Build levels' list without your agents' models), and the board's Level menu and Builder fact say \"its own default\" for a blank Claude model (`buildWords` in templates/panel.js).\n- AC5 and existing tests: six existing tests (0403 AC2 x2, 0403 AC3, 0407 AC2, 0661 AC2, 0666 AC1) asserted the defect itself, that Claude Code's blank model is Sonnet. They can't keep passing alongside AC1–AC4, so only their Claude Code expectations and fixtures changed. Their Codex, Cursor and provider checks are unchanged. 0403's \"a model saved by the default's own name shows as the default entry\" now checks Codex's default.\n- Pictures: Settings > Build levels, a level's Builder list, light and dark.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 155992,
      "cached_input_tokens": 108288,
      "cache_write_input_tokens": 0,
      "output_tokens": 690,
      "reasoning_output_tokens": 15
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47704,
      "cached": 108288,
      "write": 0,
      "output": 690
    },
    "cost_usd": 0.1131368,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-17T19:22:20.281Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-settings.js roleEntries and levelEntries offer explicit Claude model slugs; roleEditor and levelFields save those slugs. Passing 0700 AC1 tests check all four labels and Sonnet saving; existing 0661/0666 tests cover level choices and saving."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-settings.js defaultWords labels the blank Claude entry 'its own default'. Passing 0700 AC2 test checks the entry and that selecting it saves a blank model."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-settings.js defaultWords, roleWords and levelEntries handle blank Claude models; panel.js buildWords handles ticket facts and Level menus. Passing 0700 AC3 tests cover these displays, including unavailable Claude and unloaded model lists."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-settings.js defaultSlug excludes Claude, so asEntry preserves explicit sonnet. Passing 0700 AC4 test verifies saved Sonnet and blank choices, including older server data naming Sonnet as default."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "settings.mjs defaultModelOf retains Codex, Cursor and provider handling. Passing 0700 AC5 and existing 0403 tests verify their defaults. Recorded targeted run: 196 passed, zero failed, three skipped. Existing expectation changes address this ticket's defect."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Claude model choices now save the model selected. Blank Claude models are clearly shown as Claude Code’s own default, without assuming Sonnet. Other agents’ defaults retain their existing names. The relevant tests pass, and I found no blocking concerns."
  }
}
```

</details>

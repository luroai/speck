---
id: "0279"
title: "Choose the model that builds tickets"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0278"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T18:42:22.421Z"
approved: "2026-10-17T18:46:50.430Z"

---
# 0279 · Choose the model that builds tickets

**Status:** 👍 approved

## Problem
There's no setting for the builder's model: builds run on whatever model `build_command` starts the builder with, which for Claude Code is your own default. You can choose the reviewer's model in the Settings view but not the builder's.

## Outcome
A `builder_model` setting chooses the model every build runs on, and the Settings view lets you pick it from the builder's models.

## Acceptance criteria
1. A new setting, `builder_model`, is in the config template, blank by default, with a comment saying what it does, and `speck config set` accepts it. Blank leaves the model to the builder's own default, as today.
2. When `builder_model` is set and the builder is `claude`, every build `speck run` starts or resumes runs on that model: the command it runs passes it as `--model <value>`. When it's blank, the command is exactly as today.
3. The Settings view shows `builder_model` in "Building and reviewing", under `builder`, with an explanation. With `builder: claude` it offers "(default)", `fable`, `opus`, `sonnet` and `haiku`, each saying it means the newest model of that kind. With `builder: codex` it offers Codex's models as 0276 does for the reviewer, and with any other builder a text box.
4. A saved value that isn't in the list still shows, marked as not in the list, and isn't changed unless you change it.
5. When the builder isn't `claude` and `builder_model` is set, `speck run` says in one line, when it starts, that `builder_model` is only passed to Claude Code builds, and starts builds as today.

## Out of scope
- A different model per ticket: `speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`.
- The builder's effort.
- Builds started by hand with `/speck-build`, which run on the session's own model.

## Notes
- Checked 2026-10-17: `claude --model <model>` takes an alias (`fable`, `opus`, `sonnet`) for the newest model of that kind, or a full model name (`claude --help`, Claude Code 2.1.301).
- `build_command` is read in `scripts/run.mjs` (`DEFAULT_BUILD_COMMAND`, and `resumeArgv` in `scripts/hand-back.mjs` for resumed builds).
- Failing before this build: none
- Self-check: a `builder_model` that YAML reads as a number (`builder_model: 5`) is now passed as `--model 5` rather than ignored.

## In plain words
You can now choose which model builds your tickets. In the panel's Settings view, under "Building and reviewing", a new `builder_model` setting sits just below the builder. With Claude Code as the builder it offers Fable, Opus, Sonnet and Haiku, each meaning the newest model of that kind, or "(default)" to keep whatever Claude Code uses on its own. Every build that `speck run` starts, resumes or hands back then runs on the model you picked. To see it, pick a model, save, and start `speck run`: the build's log records the command with the model in it. One thing to keep an eye on: only Claude Code builds use the setting for now. If you build with another agent and set it, `speck run` says so in one line when it starts and builds as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 223,519
- Elapsed since build started: 4 min
- Changed lines: 87 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Pass `builder_model` to Codex builds as well: `speck/ideas/2026-10-17-pass-builder-model-to-codex-builds.md`.
- Known limit: with `builder: claude`, `--model` is added to `build_command` whatever program it starts, so a wrapper script that doesn't take `--model` would need `builder_model` left blank.

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
    "reviewed_sha": "c601b2a4d9cd4a22e469a123c0344231d6d60078",
    "thread_id": "01a14b2f-8f91-7692-8e87-176635b2e4cd",
    "seconds": 22,
    "usage": {
      "input_tokens": 222711,
      "cached_input_tokens": 181248,
      "cache_write_input_tokens": 0,
      "output_tokens": 808,
      "reasoning_output_tokens": 106
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T18:46:32.673Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/config.yml adds a blank builder_model with an explanatory comment; scripts/config.mjs accepts it as text. Passing AC1 tests verify setting and clearing it, and unchanged commands for blank values."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs applies withBuilderModel before launch, resumeKilled and handBackQueue use the command. Passing AC2 tests exercise model replacement, numeric values, actual run launches, and resumeArgv for resumed and handed-back builds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/settings.mjs places editable builder_model directly under builder and supplies Claude or Codex models. templates/panel.html renders the list or text fallback. Passing AC3 server and page tests cover placement, explanations, options and saving."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html settingEditor preserves saved values outside the offered list and labels them 'not offered'. Passing AC4 test confirms the value remains unchanged when another setting is saved."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/build-model.mjs leaves other builders' commands unchanged; scripts/run.mjs prints builderModelNote once at startup. Passing AC5 integration test verifies the single notice and unchanged build arguments."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The setting selects the model for Claude builds, including resumed builds, and appears in Settings with the appropriate model choices. Existing saved values are preserved, and other builders receive a clear notice. The reported tests passed; no blocking issues found."
  }
}
```

</details>

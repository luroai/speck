---
id: "0313"
title: "Count builder_model in the same-model check for Codex builds"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0311"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:33:53.327Z"
blocked_at: "2026-10-19T05:37:30.583Z"

---
# 0313 · Count builder_model in the same-model check for Codex builds

**Status:** ⛔ blocked

## Problem
speck run passes `builder_model` to Codex builds (0289), but the same-model check (0280) counts it only for Claude Code. A Codex builder and a Codex reviewer on two different models are refused unless `allow_same_model_review` is on, while the same pair on Claude Code is allowed.

## Outcome
The same-model check compares the models of a Codex builder and reviewer as it does Claude Code's.

## Acceptance criteria
1. With `builder: codex`, `build_command` blank, `builder_model` set and a Codex reviewer with a different model, `speck lint`, `speck set <id> status ready` and saving in the Settings view accept it without `allow_same_model_review`.
2. With the same model on both, or either left blank, it's refused as today unless `allow_same_model_review` is true.
3. When `build_command` is set, `builder_model` isn't counted for any builder, since speck doesn't know what the command runs.
4. The `allow_same_model_review` explanation in the Settings view no longer says `builder_model` counts only for Claude Code.

## Out of scope
- Cursor builders.

## Notes
- From `speck/ideas/2026-10-18-same-model-check-counts-builder-model-on-codex-builds.md` (inbox, from 0289). The check is in `scripts/lint.mjs` and `scripts/settings.mjs`.
- Failing before this build: none
- AC3 read as: builder_model counts only where speck gives it to the build. For Claude Code that is every build, as speck adds `--model` to build_command whatever it is (`withBuilderModel`), so a Claude builder is unchanged; for Codex only when build_command is blank. Counting it for no Claude build with build_command set would refuse the default Claude Code setup with a claude-subagent reviewer on two different models.
- AC4 already held: the Settings view's `allow_same_model_review` explanation never said builder_model counts only for Claude Code. The refusal message did, and now says Codex builds count when build_command is blank. Its test guards it.
- Self-check: saving a switch of the builder to codex in the Settings view now checks the models with the blank build_command the switch gives it, rather than the old one, so a Codex reviewer on a different model is accepted there too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
Criterion 3 says that when build_command is set, builder_model isn't counted for any builder, but speck always adds builder_model to a Claude Code build_command, so it does know what Claude builds run. Should Claude builders keep counting it, with only Codex (and other builders) not counting it when build_command is set, or should it stop counting for Claude too, which would refuse the usual Claude builder with a claude-subagent reviewer on two different models unless allow_same_model_review is on? I recommend keeping it for Claude, and rewording criterion 3 to say so.
Recommended: keep counting it for Claude builds
Changes what you'd notice: yes
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d46b9838f3535910391c9d159a753fda5feecda3",
    "thread_id": "01a152a9-aa66-7252-abe2-26a9b3f10a2a",
    "seconds": 31,
    "usage": {
      "input_tokens": 128112,
      "cached_input_tokens": 89344,
      "cache_write_input_tokens": 0,
      "output_tokens": 1044,
      "reasoning_output_tokens": 74
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:37:23.940Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "sameModelProblem counts builder_model for native Codex builds; passing 0313 AC1 tests exercise lint, set ready, Settings saves and switching builders."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0313 AC2 tests exercise identical models, case differences, blank models, the override, and refusals through set ready and Settings."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "scripts/same-model.mjs still counts builder_model for Claude with any build_command. A direct call with a Claude builder, custom command and distinct models returns null (allowed). The new AC3 test covers only Codex, despite the criterion saying 'any builder'."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/settings.mjs SETTING_GROUPS explains allow_same_model_review without a Claude-only restriction. The passing 0313 AC4 test checks that restriction is absent."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/same-model.mjs",
        "issue": "Criterion 3 explicitly excludes builder_model for any custom build command, while the implementation and builder-added Notes preserve counting it for Claude. The rationale is supported by withBuilderModel, but it changes the stated acceptance requirement and needs an owner decision.",
        "suggested_fix": "Obtain an owner decision: either amend AC3 to preserve Claude behaviour and cover that exception with a test, or implement and test AC3 as written.",
        "state": "open"
      }
    ],
    "escalation_question": "Should criterion 3 preserve counting builder_model for Claude custom commands, since speck adds --model to them, and exclude it only for Codex custom commands?",
    "summary": "The Codex change works on the tested paths, and the reported run has no failures. Approval needs one product decision: the builder preserved Claude behaviour that criterion 3 explicitly says to change."
  }
}
```

</details>

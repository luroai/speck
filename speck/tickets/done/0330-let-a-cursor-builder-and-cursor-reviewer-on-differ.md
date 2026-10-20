---
id: "0330"
title: Accept a Cursor build reviewed by Cursor on a chosen model                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:00:50.848Z"
approved: "2026-10-20T12:05:01.055Z"
finished: "2026-10-20T12:09:46.233Z"

---
# 0330 · Accept a Cursor build reviewed by Cursor on a chosen model

**Status:** ✅ done

## Problem
Someone who only has Cursor (on a work laptop, say) can build with one model and review with another, as Cursor offers many. But the same-model check counts `builder_model` only for Claude Code and Codex builds (0280, 0313), so a Cursor builder with a Cursor reviewer is always refused unless `allow_same_model_review` turns the check off for the whole project.

## Outcome
A Cursor builder and a Cursor reviewer pass the same-model check when the reviewer has a model of its own, and are refused only when both are given the same model or the reviewer's model is left blank.

## Acceptance criteria
1. With `builder: cursor`, `build_command` blank, `builder_model` set and `reviewer: cursor` with a different `reviewer_model` (compared ignoring case), `speck lint`, `speck set <id> status ready` and saving in the Settings view accept it without `allow_same_model_review`.
2. With `builder: cursor`, `build_command` blank and `builder_model` blank, so the build runs on Cursor's `auto`, and `reviewer: cursor` with `reviewer_model` set to anything but `auto`, the same three accept it without `allow_same_model_review`.
3. It's refused as today, unless `allow_same_model_review` is true, when `builder_model` and `reviewer_model` are the same, when `reviewer_model` is blank or `auto`, or when `build_command` is set, as speck then doesn't know what model the command runs.
4. The refusal message no longer says `builder_model` is passed only to Claude Code and Codex builds.
5. No test that passed before this change fails.

## Out of scope
- Showing the builder's or reviewer's model in the review pack. The pack leaves models out by design: it's for someone who doesn't read code (`scripts/pack.mjs`).
- Requiring a different model provider (for example a Claude model building and a GPT model reviewing). Two models from one provider count as different, as for Claude Code and Codex.

## Notes
- Mirrors 0313, which did the same for Codex. The check is `sameModelProblem` in `scripts/same-model.mjs`; `cursorBuilds` in `scripts/build-model.mjs` already says when speck starts the build with its own Cursor command, and `cursorStartWords` in `scripts/cursor-build.mjs` passes `builder_model`, or `auto` when it's blank.
- AC2 is the user's decision (2026-10-20): Cursor choosing the builder's model is fine as long as the reviewer's model is chosen and the review runs in its own session. Auto could pick the reviewer's model, and the user accepts that: same model in a separate session is acceptable, a different model is better.
- A ticket that records `builder: cursor` while `speck/config.yml` names another builder is built on `auto` (0312: `builder_model` is passed only to the configured builder's tickets). It counts as `auto` under AC2.
- Checked 2026-10-20: Cursor's CLI takes `--model <model>` and lists models with `--list-models` (`agent --help`, installed CLI).
- Failing before this build: none
- Self-check: the brief's same-family sentence and the Settings view's allow_same_model_review explanation said only that both models must be set, which is wrong for a Cursor build on auto; added a sentence to each, with a test of the brief's facts. A set build_command (including a missing one) refuses, as AC3 asks.
- Pictures: none, because the only change anyone sees in the panel is one added clause in a setting's explanation text, with no change to layout or look.

## In plain words
If you build and review with Cursor, you no longer have to switch the same-model safety check off for the whole project. Pick a model for the reviewer and speck accepts it, as long as it isn't the builder's model and isn't Cursor's automatic choice. You can leave the builder's model blank, so Cursor picks it. speck still refuses when both are given the same model, when the reviewer's model is blank or automatic, or when you've set your own build command, since speck can't tell what model that runs. To see it, set Cursor as both builder and reviewer, give the reviewer a model and mark a ticket ready. Worth knowing: with the builder on automatic, Cursor could still pick the reviewer's model. You've said that's acceptable, as the review runs in its own session.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The documentation self-check requires the exact prose opening 'Config rejects a `builder` and `reviewer` from the same family' and requires both facts on that same line.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 278,984
- Elapsed since build started: 4 min
- Changed lines: 34 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-10-20-same-model-check-counts-claude-s-own-build-command.md. With `build_command` set to Claude Code's own command, `speck run` still builds Cursor and Codex tickets with their own commands and `builder_model` (0324), but the check refuses them as if the command were the user's own.
- Known limit: the refusal's suggested fix ("Set builder_model and reviewer_model to two different models") doesn't mention that a Cursor builder can leave `builder_model` blank.

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
    "reviewed_sha": "23f0b830252d229cbdac1e93b7f485bb4495048f",
    "thread_id": "01a15932-0909-7ff2-9a5b-fb40598f8bf9",
    "seconds": 27,
    "usage": {
      "input_tokens": 96613,
      "cached_input_tokens": 56960,
      "cache_write_input_tokens": 0,
      "output_tokens": 793,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:04:00.511Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/same-model.mjs builderModel and sameModelProblem count Cursor's configured model and compare ignoring case. Passing 0330 AC1 tests exercise lint, set ready and Settings saves."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderModel uses auto for a blank Cursor builder model, including another configured builder's ticket. Passing 0330 AC2 tests cover lint, set ready and Settings saves."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0330 AC3 tests cover matching models, case differences, blank/auto reviewer models, custom or missing build_command, and allow_same_model_review. CLI and Settings refusal paths are also exercised."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "sameModelProblem's refusal now includes Cursor among supported builds. The passing 0330 AC4 test checks Cursor and Codex refusals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0330-tests.txt records 129 tests, 126 passed, 3 skipped and no failures. Existing 0313 regression tests remain unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/same-model-0330.test.mjs:118",
        "issue": "The documentation self-check requires the exact prose opening 'Config rejects a `builder` and `reviewer` from the same family' and requires both facts on that same line. Rewording or wrapping the paragraph would fail the suite without changing any documented fact. This violates the explicit rule against tests that pin document wording or structure.",
        "suggested_fix": "Remove the prose-dependent selector and same-line requirement. Either check only stable technical facts across the document or leave the explanation to document review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The Cursor model checks meet the ticket's requirements, and the recorded tests pass. One test must change before approval: it would reject harmless rewording or wrapping of the product brief."
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
    "reviewed_sha": "6a4e2110fead2a69f49e5e621694d4d79a3f4f95",
    "thread_id": "01a15932-0909-7ff2-9a5b-fb40598f8bf9",
    "seconds": 19,
    "usage": {
      "input_tokens": 180300,
      "cached_input_tokens": 136960,
      "cache_write_input_tokens": 0,
      "output_tokens": 1278,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:04:39.392Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/same-model.mjs counts Cursor's builder_model with blank build_command and compares model names ignoring case. Passing 0330 AC1 tests exercise lint, set ready and Settings saves."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderModel treats a blank Cursor builder model as auto, including tickets belonging to another configured builder. Passing 0330 AC2 tests exercise lint, set ready and Settings saves."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0330 AC3 tests cover matching models, case differences, blank/auto reviewer models, set or missing build_command, and the allow_same_model_review override. CLI and Settings refusals are exercised."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "sameModelProblem's refusal includes Cursor among supported builds. The passing 0330 AC4 test checks Cursor and Codex refusal messages."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest /tmp/speck-0330-tests.txt records 129 tests: 126 passed, 3 skipped and none failed, including the existing 0313 regression tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/same-model-0330.test.mjs:119",
        "issue": "The documentation test previously required an exact sentence opening and facts on the same line. It now checks only the technical model value `auto` anywhere in the brief, so harmless prose edits no longer break it.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The Cursor model checks meet all acceptance criteria, and the recorded tests pass. The documentation test has been corrected. No blocking concerns remain."
  }
}
```

</details>

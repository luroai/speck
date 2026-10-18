---
id: "0311"
title: "Clear builder_model when the builder is switched"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:32:27.950Z"
approved: "2026-10-18T22:39:22.841Z"

---
# 0311 · Clear builder_model when the builder is switched

**Status:** 👍 approved

## Problem
Switching the builder, in the Settings view or with `speck config set builder`, leaves `builder_model` as it was. Switching from Claude Code to Codex with `builder_model: opus` left set means every Codex build is started with a model Codex doesn't have.

## Outcome
When the builder is switched, a `builder_model` the new builder doesn't offer is cleared, and you're told.

## Acceptance criteria
1. Switching the builder in the Settings view clears `builder_model` in the same save when the new builder's models (as `speck agents` lists them) don't include it, and the view says it was cleared.
2. `speck config set builder <name>` does the same, saying in one line that `builder_model` was cleared and why.
3. A `builder_model` the new builder does offer is kept.
4. When the new builder's models can't be read, `builder_model` is cleared, since it can't be checked.

## Out of scope
- `reviewer_model` when the reviewer is switched.

## Notes
- From `speck/ideas/2026-10-18-clear-builder-model-when-the-builder-is-switched.md` (inbox, from 0293). Settings are saved in `scripts/settings.mjs` and `scripts/config.mjs`.
- Failing before this build: none
- Self-check: a builder named like a built-in (`__proto__`) took the object prototype as its display name in the reason; it's now named as given, with a test.

## In plain words
When you switch the builder, in the panel's Settings or from the command line, speck now checks the builder model you had set. If the new builder doesn't offer that model, or speck can't find out which models it offers, the model setting is emptied so builds use the new builder's own default, and you're told why: a line under Save in the panel, or one line from the command. A model the new builder does offer is kept.

To see it, set a builder model such as opus, then switch the builder to Codex: the model goes back to the default and the reason shows. Worth watching: switching can take a few seconds longer while speck asks the new builder for its models.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 panelSaveSettings adds an exception absent from the ticket: supplying builder_model in the same Save bypasses the check entirely.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 411,616
- Elapsed since build started: 7 min
- Changed lines: 91 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: the panel's older one-setting address (POST /api/settings/<key>/<value>), which the page no longer uses, reads the new builder's models while it waits, holding up the panel's server for up to the agent's time limit. The Settings view's Save reads them without waiting.

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
    "reviewed_sha": "bb1740420f8e80509bfeca1e2655291342d47a50",
    "thread_id": "01a1512a-6edb-79e0-a028-05c7b38840ef",
    "seconds": 20,
    "usage": {
      "input_tokens": 153820,
      "cached_input_tokens": 106624,
      "cache_write_input_tokens": 0,
      "output_tokens": 810,
      "reasoning_output_tokens": 78
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:38:37.373Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/settings.mjs panelSaveSettings skips validation whenever builder_model appears in the same Save. The AC1 tests pass for a builder-only change but do not cover changing both settings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/config.mjs setBuilder clears unsupported models and prints the reason on one line. The CLI AC2 test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "clearsBuilderModel preserves names included in the offered models. The AC3 test passed for synchronous and asynchronous Settings saves and the CLI."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The AC4 tests passed for builder-only changes and unavailable model lists, but panelSaveSettings bypasses clearing when builder_model is supplied in the same Save, even when models cannot be read."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs",
        "issue": "panelSaveSettings adds an exception absent from the ticket: supplying builder_model in the same Save bypasses the check entirely. A user can change opus to sonnet and switch to Codex in one Save, leaving Codex configured with an unsupported Claude model. The same bypass applies when the new builder's models cannot be read.",
        "suggested_fix": "When switching builders, check the effective builder_model, including any value submitted in that Save. Clear it with the existing explanation if unsupported or unverifiable, and preserve it if offered. Add tests covering simultaneous changes for all three outcomes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Switching only the builder works in Settings and the command line, with a clear explanation when the model is removed. However, changing the builder and model together bypasses the check and can still leave builds using an unsupported model. Fix that gap before merge."
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
    "reviewed_sha": "e750accf24e80c753e16dc146d096eb49d728c45",
    "thread_id": "01a1512a-6edb-79e0-a028-05c7b38840ef",
    "seconds": 13,
    "usage": {
      "input_tokens": 255600,
      "cached_input_tokens": 202624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1386,
      "reasoning_output_tokens": 89
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:39:13.727Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs panelSaveSettings checks the model that would be saved and clears unsupported values in the same commit. templates/panel.html sendSettings displays the reason. Passing AC1 tests cover the commit, view message and simultaneous changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/config.mjs setBuilder clears unsupported builder_model values in the same write and prints a single explanation line. The CLI AC2 test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "clearsBuilderModel preserves offered models. Passing AC3 tests cover Settings and CLI, including a model supplied alongside the builder change."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "offeredModels and offeredModelsAsync return null when models cannot be read; clearsBuilderModel then requests clearing. Passing AC4 tests cover Settings, CLI and simultaneous builder/model changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/settings.mjs",
        "issue": "Simultaneous builder and builder_model changes previously bypassed model validation.",
        "suggested_fix": "Implemented: validate the effective submitted model and clear it when unsupported or unverifiable. The new regression test covers clearing, preserving and unavailable model lists.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The previous gap is fixed. Settings and the command line now clear unsupported or unverifiable models when switching builders, explain why, and retain supported models. All four criteria pass; the recorded test run has no failures."
  }
}
```

</details>

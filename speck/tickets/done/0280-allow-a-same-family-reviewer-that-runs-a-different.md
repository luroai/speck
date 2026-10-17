---
id: "0280"
title: "Allow a same-family reviewer that runs a different model"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0279"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T18:49:03.573Z"
approved: "2026-10-17T18:52:58.729Z"
finished: "2026-10-17T18:55:00.951Z"

---
# 0280 · Allow a same-family reviewer that runs a different model

**Status:** ✅ done

## Problem
`allow_same_model_review` doesn't compare models: it compares agents. A Claude builder with a Claude reviewer counts as "the same model" whatever models they run, so an Opus builder can't be reviewed by Fable without turning the setting on, while its name says it's about the same model.

## Outcome
A reviewer from the builder's own family is allowed when the two run different models. The setting is needed only when they'd run the same model, or when that can't be told.

## Acceptance criteria
1. With the builder and reviewer in the same family, and `builder_model` and the ticket's reviewer model both set to different values, `speck lint`, `speck set <id> status ready` and saving `reviewer` in the panel all accept it without `allow_same_model_review`.
2. With the builder and reviewer in the same family, and both models set to the same value, or either one blank (so it's that agent's default and could be the same), the same refusal as today applies unless `allow_same_model_review` is true.
3. The refusal says which models it compared, or that one wasn't set, and what to change.
4. A builder and reviewer from different families are accepted as today, whatever their models.
5. The explanation of `allow_same_model_review` in the Settings view says that it's needed only when the builder and reviewer are in the same family and would run the same model, or when either model is left at its default.

## Out of scope
- Treating two names for one model as the same, such as an alias and the full model name it currently stands for. They count as different.

## Notes
- The check is `modelFamily` in `scripts/core.mjs`, used in `scripts/lint.mjs` and `scripts/settings.mjs`. The ticket's reviewer model falls back to `reviewer_model` in `speck/config.yml`, as `speck reviewer-settings` resolves it.
- Needs `builder_model` from 0279.
- Failing before this build: none
- Self-check: the panel checks the settings as they'd be once saved, so saving builder_model or reviewer_model to match the other is refused too, not only reviewer; a builder_model given to a builder other than claude counts as unset, as builds don't get it; updated the README, the brief and the config template, with a test that they name builder_model.

## In plain words
You can now have a Claude build reviewed by a Claude reviewer without turning on the "same model" setting, as long as the builder's model and the reviewer's model are both chosen and are different, for example Opus building and Fable reviewing. If they're the same model, or either is left at its default, speck still refuses unless you turn the setting on, and the message now says which models it compared and what to change.

To see it, pick different builder and reviewer models in the panel's Settings view, then choose the Claude subagent as the reviewer: it saves. Choosing the same model for both is refused. Worth knowing: a short name and a full model name for the same model count as different, so speck can't catch that pairing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 160,917
- Elapsed since build started: 4 min
- Changed lines: 67 (limit 5000)
- Follow-ups: `speck config set` on the command line doesn't check the same-family rule when changing reviewer, builder_model or reviewer_model (as before this ticket); `speck lint` and `speck set ready` still catch it on each ticket. Noted here only, as a known limit.

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
    "reviewed_sha": "00cbdd61db1bf0ce634f3e49fea465236e84c126",
    "thread_id": "01a14b35-55c7-7090-90f9-02f5a43a20fd",
    "seconds": 21,
    "usage": {
      "input_tokens": 160163,
      "cached_input_tokens": 110848,
      "cache_write_input_tokens": 0,
      "output_tokens": 754,
      "reasoning_output_tokens": 69
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T18:52:49.686Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/same-model.mjs permits different explicit models and resolves the ticket’s reviewer model through reviewerSettings. Passing AC1 tests cover lint, set ready and panel saves, including saving both models together."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "sameModelProblem refuses equal or unset models. lintTicket and panelSaveSettings respect allow_same_model_review. Passing AC2 tests exercise these refusals and the override."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "sameModelProblem identifies both models or the unset model and suggests different models, another reviewer family or the override. The passing AC3 test checks lint and panel messages."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "sameModelProblem returns no problem for different families before comparing models. The passing AC4 test covers matching, blank and different models through lint and panel saves."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/settings.mjs SETTING_GROUPS explains the same-family restriction for equal or default models. The passing AC5 test checks the explanation returned by panelSettings."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change allows reviewers from the builder’s family when both models are explicitly set and differ. Equal or unknown models remain blocked unless explicitly allowed, with clear guidance. The panel also prevents model changes from bypassing the rule. All 156 executed tests passed; three were skipped. No blocking concerns found."
  }
}
```

</details>

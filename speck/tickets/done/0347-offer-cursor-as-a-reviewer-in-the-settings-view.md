---
id: "0347"
title: "Offer Cursor as a reviewer in the Settings view"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-offer-cursor-as-a-reviewer-in-the-settings-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T21:23:05.085Z"
approved: "2026-10-20T21:30:57.528Z"
finished: "2026-10-20T21:33:13.079Z"

---
# 0347 · Offer Cursor as a reviewer in the Settings view

**Status:** ✅ done

## Problem
Since 0332, `reviewer: cursor` needs no command, but the panel's Settings view doesn't offer it as a reviewer, and with a Cursor reviewer its `reviewer_model` is a box to type in, where the builder's model is a list of Cursor's models. Someone setting speck up in Cursor, with its many models, has to know each model's exact name.

## Outcome
The Settings view offers Cursor as a reviewer, and offers its models for `reviewer_model` in a list, as it does for a Cursor builder's `builder_model`.

## Acceptance criteria
1. The Settings view offers `cursor` among the reviewer choices when Cursor is installed and signed in, as `speck agents` reports it.
2. With `reviewer: cursor` saved, `reviewer_model` is a list of the models Cursor lists, each shown by its display name, as `builder_model` is for a Cursor builder.
3. When Cursor's models can't be read, `reviewer_model` is a box to type in, with why in one line, as for the builder.
4. Choosing `cursor` in the view while another reviewer is saved says to save it, then open Settings again to pick from its models, as it does for Codex.
5. No test that passed before this change fails.

## Out of scope
- `reviewer_effort` for Cursor, whose model names carry the effort.
- The Foreman's model (0348).

## Notes
- From the user (2026-10-20): the Cursor reviewer's and the Foreman's model should be lists like the builder's.
- `reviewerModels` in `scripts/settings.mjs` lists models only for `claude`, `claude-subagent` and `codex`; `builderModels` reads Cursor's with `agentModelsAsync('cursor')`. The view's lists are `reviewerModelList` and `builderModelList` in `templates/panel.html`. The reviewer choices come from `REVIEWER_AGENTS` (builder's note on 0332).
- Relies on nothing outside this repo: Cursor's models are read the way the builder's already are.
- Failing before this build: none
- 0288 AC3's fixture had Cursor never ready, and asserted no "Not offered" line with every other reviewer ready; with cursor now a reviewer, its all-ready case passes Cursor as ready too, keeping the same check.
- Self-check: the brief now says `reviewer: cursor` lists Cursor's models and that a Cursor that can't list them gives a box, with a test; Cursor's models give reviewer_effort speck's own efforts rather than an empty list; the panel reads Cursor's models once when it's both builder and reviewer.

## In plain words
Cursor can now be picked as the reviewer in the panel's Settings, when it's installed and signed in. With Cursor saved as the reviewer, the reviewer's model is a list of Cursor's models, each with its name, rather than a box where you had to type the exact name. If Cursor's models can't be read, it's a box again, with a line saying why. If you pick Cursor while another reviewer is saved, it tells you to save first, then open Settings again to choose a model. To see it, open Settings, choose cursor as the reviewer, save, and open Settings again. Cursor lists many models, so the list is long.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 476,046
- Elapsed since build started: 8 min
- Changed lines: 28 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (tidy-up, not sent to the inbox): the brief's Settings paragraph still says `builder_model` is a box to type in for any builder other than claude and codex, though since 0288 a Cursor builder gets a list of its models.

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
    "reviewed_sha": "cbd7a55b66e65bbafdb1da8a9fa10f0dc89f3ef6",
    "thread_id": "01a15b35-d0fd-7f40-8ea6-6c4ea13e37fc",
    "seconds": 27,
    "usage": {
      "input_tokens": 182044,
      "cached_input_tokens": 148480,
      "cache_write_input_tokens": 0,
      "output_tokens": 748,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T21:27:22.385Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs choicesOf and REVIEWER_AGENTS offer Cursor through the existing readiness filter. Passing 0347 AC1 tests ready, unavailable and saved Cursor reviewers."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewerModels reads agentModelsAsync('cursor'); reviewerModelList preserves display names. Passing 0347 AC2 exercises CLI model discovery and the rendered selector."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0347 AC3 exercises failed Cursor discovery and verifies a text input with a single-line explanation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "modelsWhy provides the save-and-reopen instruction. Passing 0347 AC4 changes the reviewer from Codex to Cursor and checks the rendered message."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified test output reports 126 passed, zero failed and three skipped across 129 tests. The existing readiness fixture adjustment preserves its assertion; no regression is evident in the changes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Cursor is offered as a reviewer when available, with its models shown by display name. If models cannot be read, Settings provides a text box and explanation. The relevant tests pass, and I found no blocking issues."
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
    "reviewed_sha": "84f16e2e487557dba65bd6b150797dd4ae111f18",
    "merge": true,
    "thread_id": "01a15b35-d0fd-7f40-8ea6-6c4ea13e37fc",
    "seconds": 13,
    "usage": {
      "input_tokens": 292068,
      "cached_input_tokens": 189568,
      "cache_write_input_tokens": 0,
      "output_tokens": 1186,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T21:30:55.318Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs choicesOf and readyReviewers offer Cursor according to agent readiness. Passing 0347 AC1 covers available, unavailable and saved Cursor choices; updated 0258 AC1 retains an exact reviewer-list assertion."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewerModels reads Cursor's models through agentModelsAsync; reviewerModelList preserves display names. Passing 0347 AC2 exercises discovery and the rendered model selector."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0347 AC3 exercises unavailable Cursor models and verifies a text input with a single-line explanation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html modelsWhy supplies the save-and-reopen instruction. Passing 0347 AC4 verifies it after switching from Codex to Cursor."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Fresh test output reports 135 passed, zero failed and three skipped. The previously failing 0258 assertion now includes Cursor while preserving its exact-list check; this directly reflects the ticket's intended change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Cursor reviewer selection, model names and fallback guidance still work after merging main. The older test now expects the deliberately expanded reviewer list without weakening its checks. All tests run for this round passed; no blocking issues remain."
  }
}
```

</details>

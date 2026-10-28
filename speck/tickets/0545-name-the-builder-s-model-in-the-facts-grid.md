---
id: "0545"
title: "Name the builder's model in the facts grid"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-name-the-builder-s-model-in-the-facts-grid.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:43:19.731Z"
approved: "2026-10-28T09:54:11.427Z"

---
# 0545 · Name the builder's model in the facts grid

**Status:** 👍 approved

## Problem
An open Build ticket's facts grid names the reviewer by its model while it reviews (such as `gpt-6.1-sol`), but the builder only by its agent's name (such as Claude). Someone watching a build can see which model reviews but not which one builds without looking it up in Settings.

## Outcome
The facts grid's Builder cell names the model the build runs on when speck knows it.

## Acceptance criteria
1. When a ticket's builds run on a known model, its Builder cell shows the agent's name and that model, such as `Claude · opus` or `Codex · gpt-6.1-sol`. The model is `builder_model` from the settings, or, for a model provider you added in Settings, the model speck uses from it.
2. When no model is known (`builder_model` is blank, so the agent uses its own default), the Builder cell shows only the agent's name, as today.
3. `speck status --json` gives each ticket's builder model as `builder_model`, or null when none is known, and the panel reads it from there.
4. The Reviewer cell, and the cell while a round is running, are unchanged. A long model name fits the cell on a phone-width panel without breaking its layout (checked by review).
5. No test that passed before this change fails.

## Out of scope
- The models a finished build actually ran on (`builder_models`, from its spend record).
- Showing the model anywhere else, such as a closed card or the Shipped lane.

## Notes
- From 0462's build: the board gives a ticket's builder and builder_label but no builder model.
- Decided 2026-10-27: with no model set, show only the agent's name.
- Today: the cell is `workerOf` in `templates/panel-model.js`; the board's builder fields are set in `scripts/speck.mjs` (`builder`, `builder_label`); `builder_model` is read by `modelOf` in `scripts/build-model.mjs`; providers you add are in `scripts/custom-providers.mjs` (first model is the default).
- Failing before this build: none
- Self-check: added cases for a ticket built by another builder than the settings' (no builder_model), a build_command of your own (Codex, Cursor and providers get no model), a builder name that's no agent (`constructor`) and a builder_model of only spaces. Moved the board's builder fields into `boardBuilders` in build-model.mjs, as speck.mjs is at its 600-line limit, and dropped `providerLabelHere`, which nothing used after that.
- Not from this build: `0384 AC3: the panel shows the round as running through every exit 12` in test/review-wait-0384.test.mjs fails on main too, most runs on this machine today (timing).

## In plain words
When you open a ticket that's being built, the Builder box in its facts now names the model the build runs on beside the agent, such as "Claude · opus", or a provider you added with the model speck uses from it. If you haven't picked a model, so the agent uses its own, it shows just the agent's name, as before. To see it, choose a builder model in Settings and open a ticket in the Build lane. A long model name is cut short with "…"; hover over it to read it all.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 186,433
- Elapsed since build started: 11 min
- Changed lines: 40 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups skipped as already covered: the flaky `0384 AC3` running-round test, which failed on main during this build, is ticket 0540.

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
    "reviewed_sha": "c1d60d2b3f97947156ffabdd0619381b2aced2d7",
    "session": "fresh",
    "thread_id": "01a181ed-a4db-7950-aff6-0aae928b1ce5",
    "builder_response": "- Tests run: `speck test --related test/panel-0545.test.mjs` (the ticket's own file, plus the 108 existing test files that name a changed file, and the commands.checks files).\n- One failure in that run, not from this change: `0384 AC3: the panel shows the round as running through every exit 12` (test/review-wait-0384.test.mjs). It fails on main too, without this branch (3 runs out of 3 there today), and passes some runs here: a timing test. Noted in the ticket's Notes.\n- speck.mjs was at its 600-line limit (test/split-0078.test.mjs), so the board's builder, builder_label and the new builder_model come from `boardBuilders` in scripts/build-model.mjs. builder_label now reads the providers known in the board's repo rather than the current directory's; `providerLabelHere` was then unused and is removed.\n- Pictures of the Builder cell in both looks, with a short and a long model name, are with the review pack.\n",
    "seconds": 42,
    "usage": {
      "input_tokens": 185601,
      "cached_input_tokens": 138496,
      "cache_write_input_tokens": 0,
      "output_tokens": 832,
      "reasoning_output_tokens": 55
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47105,
      "cached": 138496,
      "write": 0,
      "output": 832
    },
    "cost_usd": 0.1163796,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-28T09:53:58.525Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/build-model.mjs ticketBuilderModel follows ticket-builder.mjs configFor and providerStartWords model selection. Passing 0545 AC1 tests cover built-in agents, providers and rendered Builder cells."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0545 AC2 test covers missing, blank and whitespace models, another builder's setting, custom commands and agent-only cell text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "statusData spreads boardBuilders into each ticket. Passing 0545 AC3 test checks statusData and actual status --json output, including a custom provider's default."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "workerOf retains the Reviewer branch unchanged; passing 0545 AC4 test covers running reviewers with and without a model. Reviewed panel-cards.css:292–294: constrained grid columns, min-width:0 and ellipsis prevent long names breaking narrow layouts; factCell preserves the full tooltip."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded related run: 1239 passed, three skipped, one timing failure in 0384. The failing assertion checks roundRunning after exit 12, outside the changed behaviour; no regression attributable to this change was found. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Builder cell now shows the configured model when known, including provider defaults, and keeps the agent name alone otherwise. Reviewer display stays unchanged, and long names remain contained. Tests cover the new behaviour; the reported timing failure is unrelated. Ready for the owner's merge decision."
  }
}
```

</details>

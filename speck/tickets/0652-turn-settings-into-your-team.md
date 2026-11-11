---
id: "0652"
title: "Turn Settings into your team"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0646","0650","0651"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:32:26.514Z"

---
# 0652 · Turn Settings into your team

**Status:** 🔍 reviewing

## Problem
Settings is a list of agent, model and effort pickers per role. You think of the work as a team: who manages, who builds, who reviews and who checks the app, and who takes over when one runs out.

## Outcome
Settings opens on Your team: a card for each member, with its character, its job, what it runs on and its bench, above your subscriptions.

## Acceptance criteria
1. Settings opens with Your team: a card for Virgil (named with `speck_name`), the Builder, the Reviewer and QA, each with its character, its job in one line, the agent, model and effort it runs on, and its bench in order.
2. A card's agent, model, effort and bench can be changed there, saved with Save as those settings are today, with the same checks and the same machine-only saving for your own settings.
3. Your subscriptions (0646) sits under the cards, and the rest of Settings (shipping, limits and the app settings) under that, unchanged.
4. A card whose agent is limited says so and which bench agent stands in.
5. It fits a phone-width panel in the light and the dark look, with no setting lost from today's Settings.

## Out of scope
- Copying a team to another project.

## Notes
- Mockup: the Your team board in https://claude.ai/artifact/2F85xNeCwn9KGxRn3ZbYZQ, option D characters.
- From `speck/ideas/2026-11-10-set-up-your-team-instead-of-settings.md`. Keep the panel thin.
- Failing before this build: none
- Also failing on the base code, found while running related tests (not in the recorded quick result): `0285 AC3: Settings has a Foreman group, first, …` and `0285 AC3: a refused switch shows speck run's own message, as before` in test/foreman-0285.test.mjs. Since 0646 the view's /api/usage fetch takes a fake answer meant for another request. Left as they are.
- The mockup board couldn't be opened from this session, so the cards were laid out afresh from the ticket.
- Tests that pinned the old layout (the Your engineering manager group under Auto-build, Your agents and Your subscriptions after the switches, the face beside speck_name, the list of editable settings) were updated to the new layout, each marked 0652.
- Self-check: a bench naming a built-in such as `constructor` showed "[object Object]" through the agent-name lookup; fixed, with a test. README and docs/brief.md said Settings had a Your engineering manager group under Auto-build; updated to Your team.
- speck (2026-11-11 15:55 UTC) made draft fix ticket 0656: Fix the two 0285 Auto-build switch panel tests failing on main. Why: Two Auto-build switch tests in Settings fail on main itself since 0646 added a usage request the fake page answers out of turn, and 0652's build spent part of its 22 minutes proving they weren't its own; the rest went on updating about ten older Settings layout tests, taking pictures and running wide test sweeps on a machine with a load average near 70.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "76c10bad160745afdf017e153511ab05c2ae86d1",
    "session": "fresh",
    "thread_id": "01a1cb5e-5ca8-77f1-80e1-7d14c84761b0",
    "builder_response": "- Tests run: `speck test --related` with test/settings-team-0652.test.mjs (the ticket's own) and the existing test files it changed: test/panel-0593.test.mjs, test/foreman-fix-0286.test.mjs, test/panel-0257.test.mjs, test/panel-0258.test.mjs, test/settings-0397.test.mjs, test/settings-0407.test.mjs, test/settings-agents-0399.test.mjs, test/speck-name-0485.test.mjs, test/speck-name-0575.test.mjs, test/subscriptions-0646.test.mjs, test/panel-0368.test.mjs, test/settings-0396.test.mjs, test/panel-0427.test.mjs, plus every related test file it brought in.\n- Three failures in that run, none from this change:\n  - The two `0285 AC3` tests in test/foreman-0285.test.mjs fail on the base code as well (I checked them against an export of the base commit): since 0646 the view's /api/usage fetch takes the fake page's next answer. They're noted in the ticket and left unchanged.\n  - `0630 AC3` (test/full-suite-0630.test.mjs) failed once under a load average of 24 to 44, then passed on its own here and on the base code.\n- Existing tests changed: each pinned the old layout (the Your engineering manager group under Auto-build, Your agents and Your subscriptions after the switches, speck's face beside speck_name, the exact EDITABLE list, the count of settings). Each now checks the same thing in the new layout, marked 0652. In test/panel-0368.test.mjs, the check for an empty Your engineering manager group is gone, because the view no longer draws an empty group: a card appears only when its member has settings.\n- Pictures: Settings at phone width, light and dark, kept with `speck picture`.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 306079,
      "cached_input_tokens": 238976,
      "cache_write_input_tokens": 0,
      "output_tokens": 1049,
      "reasoning_output_tokens": 214
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 67103,
      "cached": 238976,
      "write": 0,
      "output": 1049
    },
    "cost_usd": 0.1685936,
    "tests": {
      "failing": 3,
      "second_try": []
    },
    "saved_at": "2026-11-11T16:09:29.357Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel-settings.js roleEntries(), roleWords() and the QA effort control display QA's blank model and effort as defaults. scripts/app-check.mjs qaConfig() instead inherits watch_model and watch_effort while all QA settings are blank. The AC1 tests cover only inherited agent identity, not inherited model or effort."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "settings-team-0652 tests exercise Save requests, machine-only persistence and rejected bench/QA values; all passed. Existing saving and validation paths remain in use."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "renderSettings() places teamGroup() and subsGroup() before the remaining sections. The AC3 test verifies section order and retained shipping and limits controls; passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/team.mjs teamNow() and teamShown() calculate limited agents and eligible stand-ins; limitWords() displays them. AC4 tests cover ordering, readiness, held agents and reviewer restrictions; passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "AC5 tests verify retained settings with and without model catalogues and check 320 px layout in light and dark appearances; passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "With all QA settings blank, QA actually inherits the manager's model and effort, but its card presents an agent default model and blank/default effort. For example, watch_model=opus and watch_effort=high run QA on opus/high while its card does not show those effective values. This fails the requirement to show what each member runs on.",
        "suggested_fix": "Show the inherited manager model and effort explicitly while all QA settings are blank, preserving blank saved values and explaining when setting any QA value switches to QA's own defaults. Add a test with nonblank watch_model and watch_effort.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The team cards, subscriptions placement, saving and phone layouts are covered by passing tests. One misleading detail needs fixing: QA can inherit the manager's model and effort while its card shows defaults instead."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "4537a81372e728bfe985d640bd0b5507785af1b2",
    "session": "continued",
    "thread_id": "01a1cb5e-5ca8-77f1-80e1-7d14c84761b0",
    "builder_response": "- Tests run: test/settings-team-0652.test.mjs, test/panel-0593.test.mjs, test/foreman-fix-0286.test.mjs, test/panel-0257.test.mjs, test/panel-0258.test.mjs, test/settings-0397.test.mjs, test/settings-0407.test.mjs, test/settings-agents-0399.test.mjs, test/speck-name-0485.test.mjs, test/speck-name-0575.test.mjs, test/subscriptions-0646.test.mjs, test/panel-0368.test.mjs, test/settings-0396.test.mjs, test/panel-0427.test.mjs, test/foreman-0285.test.mjs (its two AC3 tests also fail on the base code, as said in round 1) and test/full-suite-0630.test.mjs (passes now).\n- F1: fixed. While all four QA settings are blank, as chosen in the view, QA's card has a line under qa_agent, `qaInheritLine()` in templates/panel-settings.js: \"With QA's settings blank, QA runs as <name>'s agent does: <agent> · <watch_model or its default model>, <watch_effort or its default effort>. Set any of them to give QA its own, where blank is its agent's default.\" It's redrawn when watch_agent, watch_model, watch_effort, the builder or any QA setting changes, and goes once any QA setting is set. Saved values are unchanged: nothing extra is sent on Save. Test: `0652 AC1 (round 1 F1)`, with watch_model opus and watch_effort high.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 449733,
      "cached_input_tokens": 376064,
      "cache_write_input_tokens": 0,
      "output_tokens": 1676,
      "reasoning_output_tokens": 267
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6566,
      "cached": 137088,
      "write": 0,
      "output": 627
    },
    "cost_usd": 0.0331108,
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-11-11T16:11:06.954Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "qaInheritLine() now shows inherited model and effort, and the new F1 regression test passes with agent_models present. However, SETTING_AFFECTS.builder and SETTING_AFFECTS.watch_agent omit qa_agent, so changing either separate agent picker when agent_models is absent leaves that inheritance line stale."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "settings-team-0652 AC2 tests passed, exercising Save requests, machine-only persistence and validation refusals through panelSaveSettings()."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "renderSettings() places Your team and subscriptions before the remaining sections. The passing AC3 test checks section order and retained shipping and limits controls."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "teamNow(), teamShown() and limitWords() implement limit and stand-in reporting. Passing AC4 tests cover readiness, bench order, held agents and reviewer restrictions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests check retained settings with and without model catalogues and the 320 px layout in both appearances."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "The inheritance display is fixed for combined agent/model pickers, but remains stale with separate pickers. When agent_models is absent, changing watch_agent or builder uses SETTING_AFFECTS, whose corresponding arrays omit qa_agent. Consequently qaInheritLine() continues naming the previous inherited agent until another redraw.",
        "suggested_fix": "Include qa_agent in the separate-picker redraw dependencies for watch_agent and builder. Extend the regression test to remove agent_models, change the manager's agent and an inherited builder agent, and verify QA's inheritance line updates.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The QA card now explains its inherited model and effort. One fallback path remains incomplete: when model lists are unavailable, changing the manager's agent can leave QA displaying the previous agent. The other criteria remain covered by passing tests."
  }
}
```

</details>

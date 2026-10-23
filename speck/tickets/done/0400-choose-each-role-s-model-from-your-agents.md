---
id: "0400"
title: "Choose each role's model from your agents"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-find-the-agents-and-models-on-this-machine.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0399"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:50:07.524Z"
approved: "2026-10-23T11:03:13.682Z"
finished: "2026-10-23T11:06:10.330Z"

---
# 0400 · Choose each role's model from your agents

**Status:** ✅ done

## Problem
Builder, Reviewer and Foreman each have an agent list and a separate model list, which offer agents you haven't set up and make you choose twice.

## Outcome
Each role picks one model from your agents' models.

## Acceptance criteria
1. Builder, Reviewer and Foreman each have one list, made up only of your agents' models and grouped by agent, such as "Codex · GPT-6.1 Sol" or "DeepSeek · V4 Pro", with each agent's own default as an entry. An agent that isn't one of yours doesn't appear.
2. Choosing an entry sets the role's agent and model together, for example `reviewer: codex` with `reviewer_model: gpt-6.1-sol`, saved for this machine as 0387 saves them. Effort is offered beside it only for an agent that takes one.
3. The reviewer list has the Claude subagent as one entry under Claude Code, named for running in the builder's session. The Foreman list has an entry for using the builder's agent, which is today's blank Foreman.
4. A choice the same-model check refuses is refused when saved, saying why, as today. A role whose saved agent is no longer one of yours says so and asks you to choose again.
5. No test that passed before this change fails, except checks of the separate agent and model lists, which are changed to check these criteria.

## Out of scope
- Reading an API provider's models from its own API: the models in speck's provider list are used (0393).

## Notes
- Checked 2026-10-23: Settings shows foreman, builder and reviewer as their own lists, each with a model list under it filled for the chosen agent (0369, 0381), and DeepSeek among them whether or not its key is set.
- The user chose on 2026-10-23 to keep the Claude subagent reviewer as an entry under Claude Code.
- Waits for 0399.
- Failing before this build: none
- Self-check: a model provider is still left out of each role's list while Claude Code isn't installed, saying why, as before; clearing this machine's value for a role clears its model's too, as one list holds both; the README's sentence about the separate lists now describes the one list.

## In plain words
In Settings, the builder, the reviewer and the Foreman each have one list now, instead of a list of agents and a separate list of models. The list holds only the models of agents you've set up, grouped by agent, such as "Codex · GPT-6.1 Sol", with each agent's own default too. Picking one sets the agent and its model together, for your machine only. How hard it thinks (effort) appears beside the list only for Claude Code and Codex, which use it. The reviewer's list also has the Claude subagent, and the Foreman's has "the builder's agent".

To see it, open Settings and look at builder, reviewer and Foreman. If a role uses an agent you've since removed, it says so and asks you to choose again. Worth keeping an eye on: with Cursor set up, the list is very long, and a model your agent doesn't list can no longer be typed in Settings.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Cancelling a builder switch restores only the agent, leaving the newly chosen model pending.; F2 A machine override of only the model can no longer be cleared.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 741,079
- Elapsed since build started: 13 min
- Changed lines: 198 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Idea: speck/ideas/2026-10-23-make-a-long-model-list-easy-to-pick-from.md (Cursor's ~230 models make each list long).
- Idea: speck/ideas/2026-10-23-choose-a-model-your-agent-doesn-t-list.md (no box to type an unlisted model any more).
- Tidy-up: a Settings answer without `agent_models` (an older server, or Your agents unreadable) still draws the separate agent and model lists, so that code stays; it could go once nothing relies on it.
- Known limit: Cursor's model names from its CLI carry odd spacing and zero-width characters, shown as Cursor gives them.

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
    "reviewed_sha": "b7758f09fa39a3c68863d186745805bad21486e4",
    "session": "fresh",
    "thread_id": "01a1686a-7b63-7491-9288-8d47a932d899",
    "builder_response": "- Tests run: test/settings-roles-0400.test.mjs (with the commands.checks files, which speck test --files runs too)\n- Round 1. Approach: the Settings answer gains `agent_models`, your agents' models in order (only yours, Codex and Cursor read only when yours). When the page has it, each role (builder, reviewer, foreman) draws one select of \"<agent>|<model>\" entries in optgroups by agent; the separate model rows aren't drawn, and reviewer_effort/foreman_effort sit beside the role's list, hidden for an agent that takes no effort. A view without `agent_models` (an older server, or Your agents unreadable) keeps today's separate lists, which is why the earlier tests of the separate lists still pass unchanged.\n- Kept from 0393: a provider isn't offered while Claude Code isn't installed, saying why.\n- Pictures: two of the Settings view on this machine's real panel, light and dark.\n",
    "seconds": 57,
    "usage": {
      "input_tokens": 275385,
      "cached_input_tokens": 220416,
      "cache_write_input_tokens": 0,
      "output_tokens": 1699,
      "reasoning_output_tokens": 191
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T11:00:28.187Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs yourModels and templates/panel.html roleEntries build grouped lists from your agents. Passing AC1 tests exercise filtering, defaults, labels and provider availability."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Passing AC2 tests cover normal saves and effort visibility, but independent fake-page checks reproduced a mismatched agent/model after cancelling a builder switch and no Clear button for a model-only machine override."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "roleEntries provides the Claude subagent under Claude Code and the blank Foreman entry. The passing AC3 test exercises both and verifies blank Foreman saving."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise the real server's same-model refusal, refusal messages beside the combined control, and warnings for saved agents absent from your agents."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test run reports 120 passed, 0 failed and 3 skipped. Existing tests were not changed. The newly identified edge cases are not covered by that run."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:2929",
        "issue": "Cancelling a builder switch restores only the agent, leaving the newly chosen model pending. Reproduced by switching Claude/sonnet to Codex/gpt-6.1-sol with a custom build command and declining confirmation: the control becomes claude|gpt-6.1-sol and Save remains enabled. A subsequent save can write the Codex model against Claude.",
        "suggested_fix": "Restore the builder's agent and model together when confirmation is declined, including associated pending state. Add a regression test for cancelling a combined selection.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:2205",
        "issue": "A machine override of only the model can no longer be cleared. The model row is hidden, while the combined role row offers Clear only when the agent itself comes from machine settings. This state arises naturally when choosing another model of the existing agent, because only the changed model is saved. An independent fake-page check confirmed zero Clear buttons.",
        "suggested_fix": "Make the combined control expose clearing whenever either component has a machine override, and clear the applicable overrides together. Test the model-only override case as well as the existing both-overridden case.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The combined model lists work in the main flows, and all reported tests pass. Two settings bugs need fixing: cancelling a builder switch leaves the wrong model pending, and a machine-specific model choice can lose its Clear button."
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
    "reviewed_sha": "27eb9bea9fcf4fda32c1820918faab7f7dc6a57c",
    "session": "continued",
    "thread_id": "01a1686a-7b63-7491-9288-8d47a932d899",
    "builder_response": "- Tests run: test/settings-roles-0400.test.mjs (with the commands.checks files). I also ran the 56 existing settings, panel-02xx/03xx and builder-* test files once, as the fixes touch shared code: 423 pass, 0 fail.\n- F1: fixed. sendSettings' cancel of a hand-set build_command replacement now drops the pending builder_model with the builder (withRoleModel('builder')), so the list goes back to claude|sonnet and Save is disabled. Test: \"0400 AC2 F1\".\n- F2: fixed. settingRow now treats a role as this machine's own when either its agent or its model is; the Clear button clears whichever of the two come from this machine (fromMachine), the list then shows the project's entry in words (roleCleared → disabled box), and the explanation names the project's and this machine's entries. Keep puts both back. Test: \"0400 AC2 F2\" (model-only override), and the earlier self-check test covers both overridden.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 460944,
      "cached_input_tokens": 395776,
      "cache_write_input_tokens": 0,
      "output_tokens": 3051,
      "reasoning_output_tokens": 238
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T11:02:51.749Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "settings.mjs yourModels and panel.html roleEntries provide grouped lists containing your agents' models and defaults. Passing AC1 tests cover filtering, labels and provider availability."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests cover combined machine saves and effort visibility. New F1/F2 regression tests cover cancellation and model-only clearing. Independent fake-page checks also passed cancellation, Clear, Keep and the clear-save payload."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "roleEntries supplies the Claude subagent under Claude Code and the builder's-agent Foreman entry. The passing AC3 test verifies their placement and blank Foreman saving."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise the server's same-model refusal, messages beside the combined control, and warnings asking users to replace agents no longer in their list."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied round run reports 122 passed, 0 failed and 3 skipped. Existing tests were not weakened; both previous findings now have behavioural regression coverage."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Cancelling a builder switch previously left the newly chosen model pending.",
        "suggested_fix": "Implemented: cancellation restores the agent and model together. The regression test and independent reproduction pass.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "A machine override of only the model previously lost its Clear button.",
        "suggested_fix": "Implemented: the combined row exposes Clear when either component is overridden and clears applicable machine values. Clear, Keep and saving were independently verified.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Each role now offers one grouped list of your agents' models and saves the agent and model together. Both previously identified settings bugs are fixed and covered by regression tests. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>

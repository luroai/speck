---
id: "0547"
title: "Keep setup's defaults without asking"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-keep-setup-s-defaults-for-shipping-and-limits.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-28T09:44:51.832Z"

---
# 0547 · Keep setup's defaults without asking

**Status:** 🔍 reviewing

## Problem
Setup goes through every shipping, parallel and ticket-limit setting one at a time. For someone setting speck up for the first time, that's a lot of questions about things they don't yet have a view on, and it slows down getting to the first ticket. Seen setting up in Cursor on 2026-10-20.

## Outcome
Setup leaves the shipping, parallel and ticket-limit settings at speck's defaults and doesn't ask about them, while still asking about the agents and their models.

## Acceptance criteria
1. Section 7 of the `speck-setup` skill no longer asks about `ship_mode`, `auto_ship`, `auto_ship_risk`, `max_parallel_builds`, `max_parallel_tests` or the three `limits` settings, and setup runs no `speck config set` for them: they stay at the values `speck init` wrote.
2. Instead, setup tells the user in one or two sentences that these settings are at speck's defaults, that `auto_ship` is off so nothing ships without them, and that they can change any of them later in the panel's Settings view or with `speck config set` (checked by review).
3. When the user says in section 3, step 3 that their base branch needs pull requests, setup still offers pull request mode (`ship_mode: pr`) as that step and the "Pull request mode" paragraph describe today. Otherwise `ship_mode` stays `local`.
4. Setup still asks about the builder, the reviewer and speck's watch agent and their models (sections 5 and 6), as today. When speck was already set up, setup leaves these settings as they are and doesn't list them for changing.
5. No test that passed before this change fails, apart from tests that setup goes through those settings one at a time, which change to check the above.

## Out of scope
- Changing any of speck's defaults.
- The panel's Settings view.

## Notes
- The user's idea, 2026-10-20: "Setup should just carry out the defaults for now, rather than asking what the user wants for each setting. Still ask about the specific models."
- Reverses part of 0269, which added section 7's one-at-a-time questions.
- Decided 2026-10-27: say in a line that the settings exist and where to change them; keep pull request mode only when the base branch needs it; leave `max_parallel_builds` at its default too.
- Failing before this build: none
- Self-check: no changes
- No pictures: the change is to the setup skill only, nothing anyone sees in the panel.

## In plain words
Setting speck up now asks fewer questions. It no longer goes through shipping, how many builds and test runs happen at once, or how big a ticket can be, one setting at a time. It leaves them at speck's defaults and says so in a sentence or two: nothing ships without you, and you can change any of them later in the panel's Settings view. It still asks which agents build, review and watch, and their models, and it still offers pull requests when your main branch needs them.

To see it, run setup in a fresh project and check that it goes from the agents straight to finishing. Worth a look: running setup again on a project that already has speck still asks about the agents, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Round 1 read AC4's "when speck was already set up" as covering the agent settings too; disputed (it refers to section 7's old re-run listing) and the reviewer accepted it in round 2. If re-running setup should skip the agent questions as well, that's its own ticket.
- Follow-ups: none sent to the inbox.

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
    "reviewed_sha": "59df726ee875f04b306a9accfbff661bf4bac320",
    "session": "fresh",
    "thread_id": "01a181ea-8080-7cd0-a2f9-9eb1d0759fdc",
    "builder_response": "- Tests run: test/setup-0547.test.mjs test/config-show-0269.test.mjs, with --related (every test file that names skills/speck-setup/SKILL.md, plus the commands.checks files).\n- Section 7 of the setup skill is rewritten: it names the eight settings, leaves them at what speck init wrote, runs no speck config set for them, and tells the user in one or two sentences where to change them later. The \"When speck was already set up\" listing is gone.\n- Section 3 step 3 still offers pull request mode; its last sentence now says ship_mode otherwise stays local (it used to defer to section 7). The unattended-agents clash bullet no longer points to section 7.\n- test/config-show-0269.test.mjs: the AC1 skill test no longer requires `speck config show` in the setup skill (setup no longer reads it), as AC5 allows; it still checks each setting is named.\n",
    "seconds": 44,
    "usage": {
      "input_tokens": 139051,
      "cached_input_tokens": 94464,
      "cache_write_input_tokens": 0,
      "output_tokens": 988,
      "reasoning_output_tokens": 136
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 44587,
      "cached": 94464,
      "write": 0,
      "output": 988
    },
    "cost_usd": 0.1085004,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T09:50:35.037Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 7 explicitly leaves all eight settings unchanged without asking. Passing setup-0547 tests check their names and absence of setting commands, except the permitted PR command."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Section 7 instructs setup to explain the defaults, that auto_ship is off, and both ways to change settings later in one or two sentences."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 3 step 3 retains the conditional offer of speck config set ship_mode pr with user agreement. Otherwise it specifies local. The corresponding 0547 test passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Section 5 retains agent and model selection, covered by the passing 0547 AC4 test. However, it has no exception preserving existing agent settings when speck was already installed; section 1 says to carry on through these steps. The test does not exercise that requirement."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded related-test run reports 279 passed, zero failed and three skipped. The changed 0269 assertion reflects removal of the settings questionnaire; the branch changes no defaults or panel code."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md:96",
        "issue": "AC4 requires existing agent and model settings to be preserved without listing them for changing when speck was already set up. Section 5 still offers builder, reviewer and watch-agent selection unconditionally, including commands that replace their settings. The existing-install exception in section 7 covers only shipping, parallel and limit settings.",
        "suggested_fix": "Add an explicit existing-install path that preserves agent and model settings and skips offering replacements in sections 5 and 6. Extend the AC4 test to check this path rather than only the presence of configuration commands.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Setup now skips the shipping and limit questionnaire, keeps the pull request option and explains where settings can be changed later. The reported tests pass. One requirement remains unmet: running setup again still offers to replace existing agent and model choices."
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
    "reviewed_sha": "59df726ee875f04b306a9accfbff661bf4bac320",
    "session": "continued",
    "thread_id": "01a181ea-8080-7cd0-a2f9-9eb1d0759fdc",
    "builder_response": "- Tests run: none new this round (no code changed); the round-1 output stands: test/setup-0547.test.mjs test/config-show-0269.test.mjs with --related.\n- F1: disputed. AC4's second sentence, \"When speck was already set up, setup leaves these settings as they are and doesn't list them for changing\", is about the shipping, parallel and limit settings, not the agents:\n  - \"doesn't list them for changing\" names exactly what the old section 7 \"When speck was already set up\" paragraph did (\"Show all eight with their values ... in one list, and ask which, if any, the user wants to change\"). Section 5 never listed the agent settings for changing, so there is nothing there for the sentence to stop.\n  - AC4's first sentence says setup still asks about the builder, the reviewer and the watch agent and their models \"as today\", and the ticket's Outcome says setup leaves the shipping, parallel and limit settings at the defaults \"while still asking about the agents and their models\". Skipping section 5 on a re-run would change agent setup, which neither the Outcome, the Problem nor the user's note in Notes (\"Still ask about the specific models\") asks for.\n  - The branch now covers that sentence in section 7 (\"When speck was already set up, leave these settings as they are too, and don't list them for changing\"), and test/setup-0547.test.mjs \"0547 AC1, AC4\" checks the old \"Show all eight\" listing is gone.\n  If you still read it the other way, please escalate it as a product question rather than requesting the change, since it would change what setup asks on a re-run.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 240727,
      "cached_input_tokens": 185984,
      "cache_write_input_tokens": 0,
      "output_tokens": 1678,
      "reasoning_output_tokens": 136
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 10156,
      "cached": 91520,
      "write": 0,
      "output": 690
    },
    "cost_usd": 0.036364,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T09:51:16.093Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 7 explicitly leaves all eight settings unchanged without asking or setting them. Passing 0547 AC1 tests check the settings and absence of configuration commands, except the permitted PR command."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Section 7 instructs setup to explain in one or two sentences that defaults apply, auto_ship is off, and settings can be changed through the panel's Settings view or speck config set."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 3 step 3 retains the conditional pull request mode offer and requires agreement before running speck config set ship_mode pr. Otherwise ship_mode stays local. The corresponding 0547 test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Sections 5 and 6 retain agent and model choices, covered by the passing 0547 AC4 test and related tests. Section 7 preserves existing shipping, parallel and limit settings without listing them for changing; the passing AC1/AC4 test checks removal of the old listing. This interpretation matches the ticket's outcome and the previous section 7."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The unchanged implementation has a recorded related-test result of 279 passed, zero failed and three skipped. The modified 0269 test reflects removal of the questionnaire. No defaults or panel implementation changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md:96",
        "issue": "The earlier finding interpreted AC4's existing-install exception as applying to agent settings. The ticket's outcome and the old section 7 listing support the builder's interpretation: the exception concerns shipping, parallel and limit settings. I accept the dispute.",
        "suggested_fix": "No change required.",
        "state": "dispute_accepted"
      }
    ],
    "escalation_question": "",
    "summary": "Setup skips the shipping and limit questionnaire while retaining agent and model choices and the pull request option. All criteria pass, and the recorded tests have no failures. My earlier objection misread the existing-install requirement; no blocking concerns remain."
  }
}
```

</details>

---
id: "0381"
title: "Put each agent's model beside its family"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-put-the-reviewer-s-model-beside-its-family.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0368","0369","0370","0371","0372","0373","0374"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T22:31:49.142Z"

---
# 0381 · Put each agent's model beside its family

**Status:** 🔍 reviewing

## Problem
Settings shows each agent and its model as two rows: the builder, the reviewer and the Foreman. The model looks like a separate setting, so it is hard to see that the second list is the model for the family in the first.

## Outcome
The builder, the reviewer and the Foreman each have their agent and the model it runs on as two dropdowns on one Settings row.

## Acceptance criteria
1. In Settings, each of these pairs sits on one row: `builder` with `builder_model`, `reviewer` with `reviewer_model`, and `foreman` with `foreman_model`. The first dropdown offers the agents that setting offers today. The second offers that agent's models.
2. Choosing an agent in a row's first dropdown fills that row's model dropdown before you save, as 0369 does for the builder, the reviewer and the Foreman. The reviewer's first dropdown still offers `codex`, `claude`, `claude-subagent`, `cursor`, and a reviewer command already set up. The Foreman's first dropdown still offers a blank value.
3. Saving still writes each pair as two settings in `speck/config.yml`. A value that isn't offered stays marked and can't be picked again. The loading line, and a type-in box with why when the models can't be listed, still show for the model dropdown. The builder's note about who builds tickets from now on still shows.
4. `reviewer_effort` and `foreman_effort` stay on their own rows. Changing either dropdown on a row leaves the rest of Settings where it was, as 0370 does.
5. No test that passed before this change fails, except a check that one of these pairs is two setting rows, which is changed to check criterion 1.

## Out of scope
- Putting an effort on the same row as its agent.
- What the review sentence on a ticket says: 0382.

## Notes
- Asked for 2026-10-22 for the reviewer, then for the builder and the Foreman the same way.
- The reviewer's first dropdown keeps `claude-subagent` and a command from `reviewer_options`. The builder's offers `claude`, `codex` and `cursor`. The Foreman's offers blank plus `claude`, `codex` and `cursor`. Blank still means the Foreman follows the builder, as today.
- Checked 2026-10-22: `renderSettings` in `templates/panel.html` draws one `.setting` row per key, so each agent and its model are separate rows (`scripts/settings.mjs`). Once 0369 has shipped, choosing the agent fills that agent's model list before saving.
- Waits for 0368 to 0374. They change `templates/panel.html`, and 0369 also changes `scripts/settings.mjs`. 0375 waits for this, so it ships in 0.13.0.
- Failing before this build: none
- Self-check: at the narrowest width the model's info button wrapped onto its own line beside the agent's, so their tap targets overlapped (0277's check). The model's list and its info button now stay together on one line, the info button never shrinking.
- Changed an existing check (criterion 5): 0370's AC1 tests treated each agent and its model as separate rows, so a redraw of the model failed the agent's "unchanged" check. They now check the agent's own part of the row, leaving out the model drawn inside it.

## In plain words
In Settings, the builder, the reviewer and the Foreman each now have one row with two dropdowns: the agent first, then the model it runs on. Before, the model was a separate row underneath and looked like a setting of its own. Everything else works as before: picking a different agent fills in its models straight away, Save writes both settings, and the effort settings keep their own rows.

To see it, open Settings in the panel and look at the Foreman and "Building and reviewing" groups. On a wide screen the two dropdowns sit side by side. On a phone the model's dropdown sits under the agent's, still in the same row.

Worth keeping an eye on: only the agent's name shows on the left now. The model's dropdown has its own info button, which explains it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "1dacfa106af8058081fcd04144378c760b061292",
    "thread_id": "01a165c7-82f6-7591-9cdd-61771dec5b34",
    "seconds": 28,
    "usage": {
      "input_tokens": 145890,
      "cached_input_tokens": 101376,
      "cache_write_input_tokens": 0,
      "output_tokens": 854,
      "reasoning_output_tokens": 80
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T22:42:44.635Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: pairSettings places each model control inside its agent's row. Passing 0381 AC1 checks all three pairs, control order, agent choices and model choices."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0381 AC2 changes each agent and verifies its model list updates before saving; it also checks the reviewer command, claude-subagent and blank Foreman options remain available."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "settingRow preserves the existing editors and save handling. Both passing 0381 AC3 tests cover separate setting keys in the save request, disabled unavailable models, loading feedback, the fallback text box and explanation, and the builder note."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0381 AC4 checks separate effort rows, retained controls, unchanged scroll position and preservation of unrelated nodes. redrawSettings preserves the nested model when replacing its agent row."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded test output confirms 134 passed, zero failed and three skipped. The 0370 test adjustment excludes nested model nodes from the agent's own-node check while retaining independent checks of model rows. No unrelated implementation changes appear in the ticket's commit."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Each agent’s model now appears beside its agent selector. Model updates, saving, fallback messages and separate effort settings are preserved. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>

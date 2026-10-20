---
id: "0334"
title: "Offer an all-Cursor setup with models picked from the account's list"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0330","0331","0332","0333"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:16:00.587Z"

---
# 0334 · Offer an all-Cursor setup with models picked from the account's list

**Status:** 🔍 reviewing

## Problem
Setting speck up in Cursor on a work laptop took several hand edits to `speck/config.yml` (2026-10-20): the reviewer command, `allow_same_model_review` and model names the agent had to guess. Someone who uses Cursor, with its many models, should get a working all-Cursor setup from setup's questions alone.

## Outcome
When the builder is Cursor, setup offers an all-Cursor setup in one question, with every model chosen from the account's own list.

## Acceptance criteria
1. In `skills/speck-setup/SKILL.md`, section 5, when the user picks Cursor as the builder, the skill tells the agent to offer an all-Cursor setup: builds on Cursor's `auto`, the reviewer on Cursor with a model the user picks, and the Foreman on Cursor or another installed agent.
2. The skill tells the agent to offer models only from `speck agents --json`, by each one's `name`, and never to make up a model name.
3. The skill tells the agent to recommend a reviewer model from another provider than the builder's when the builder's model is set, and to say that with the builder on `auto` any reviewer model is accepted, as the review runs in its own chat.
4. The skill tells the agent to set it all with `speck config set` (`builder`, `reviewer`, `reviewer_model`, `foreman`, `foreman_model`), with no hand edit of `speck/config.yml` and no `allow_same_model_review`.
5. The installed copy, `.claude/skills/speck-setup/SKILL.md`, matches `skills/speck-setup/SKILL.md`.

## Out of scope
- Reading the models when the agent's sandbox blocks it (0335).

## Notes
- Needs 0330 (Auto building with a pinned reviewer model passes the same-model check), 0332 (`reviewer: cursor` with no command) and 0333 (`foreman: cursor`), so it's after all three, and after 0331, which changes the same skill.
- The skills are instructions to agents, not documents, so tests may check their wording (`docs/brief.md`, "Criteria about documents").
- Checked 2026-10-20: `agent models` lists names such as `claude-opus-5-5-high` and `gpt-5.6-sol-high`, where the effort is part of the name (user's work laptop and this machine).
- Failing before this build: none
- Self-check: also corrected two sentences in section 5 that the all-Cursor setup would contradict (a Cursor reviewer passing only when both models are set, and builder_model being used only by Claude Code builds).

## In plain words
When someone setting speck up picks Cursor to do the building, setup now offers to use Cursor for everything in one question: Cursor chooses the model for each build, the reviewer runs on Cursor with a model the user picks, and the agent that looks into stopped work runs on Cursor or another agent they have. The models on offer come from the user's own Cursor account, so nothing is guessed, and every setting is made through speck rather than by editing the settings file by hand. To see it, start setup in a project and choose Cursor as the builder. Worth watching: if Cursor's model list can't be read on a machine, setup asks the user to type the model's name instead.

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
    "reviewed_sha": "d5aa1bbc28d1104a2edd08cdf26de41e94b2b1c6",
    "thread_id": "01a1593f-2de1-7841-9242-53c4a3f6d8a4",
    "seconds": 21,
    "usage": {
      "input_tokens": 130249,
      "cached_input_tokens": 91648,
      "cache_write_input_tokens": 0,
      "output_tokens": 780,
      "reasoning_output_tokens": 167
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:18:15.982Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 5 offers the all-Cursor question, auto builds, a chosen Cursor reviewer model and a Cursor or other installed Foreman. AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Section 5 instructs agents to offer the relevant account model lists from speck agents --json, set selections by name and never invent names. AC2 test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The all-Cursor instructions recommend another provider when builder_model is set and explain that auto builds accept a pinned reviewer model in its own chat. AC3 test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The all-Cursor instructions list speck config set commands for all five settings, prohibit hand editing and leave allow_same_model_review unchanged. AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Direct comparison confirms the installed and source skills have identical contents. AC5 test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Setup now offers Cursor users automatic model selection for builds, a reviewer model chosen from their account and a configurable Foreman. The instructions meet all five criteria. The recorded test run has no failures; no blocking issues found."
  }
}
```

</details>

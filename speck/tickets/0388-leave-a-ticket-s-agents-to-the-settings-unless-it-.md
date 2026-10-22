---
id: "0388"
title: "Leave a ticket's agents to the settings unless it names them"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-22-change-your-own-settings-without-a-commit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0387"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:31:35.466Z"

---
# 0388 · Leave a ticket's agents to the settings unless it names them

**Status:** 🔍 reviewing

## Problem
`speck new` copies the builder, reviewer and reviewer model into each ticket, and the ticket keeps them. Switching reviewer means editing and committing every open ticket: on 2026-10-22, switching to Grok and back took three commits across ten tickets.

## Outcome
A ticket uses the builder and reviewer the settings give, unless it names its own.

## Acceptance criteria
1. A new ticket leaves builder, reviewer, reviewer_model and reviewer_effort blank.
2. A ticket with any of these blank is built with the builder, and reviewed with the reviewer, model and effort, that the settings give when its build starts and when each review round starts. Each round records the reviewer, model and effort it used, as today. A round whose reviewer or model differs from the last round's starts a fresh session with the full history.
3. A ticket that names any of them uses what it names, as today. `speck lint` and the same-model check judge the values the ticket would use.
4. Wherever the panel or `speck status` shows a ticket's builder or reviewer, it shows the one the ticket would use now.
5. No test that passed before this change fails.

## Out of scope
- Clearing these fields in existing tickets. They keep what they name, and `speck set <id> reviewer ""` clears one by hand.
- Where your own settings are kept: 0386 and 0387.

## Notes
- Checked 2026-10-22: `cmdNew` in `scripts/speck.mjs` sets builder, reviewer and reviewer_model from the config, and `templates/ticket.md` names `builder: claude` and `reviewer: codex`. `speck review` already falls back with `t.fm.reviewer || cfg.reviewer` (`scripts/review.mjs`), `ticketBuilder` falls back to the config's builder (`scripts/ticket-builder.mjs`), and `reviewerSettings` falls back for model and effort (`scripts/core.mjs`).
- Waits for 0387: both change how settings reach the panel.
- Failing before this build: none
- `ticketAgents` in `scripts/core.mjs` gives the builder, reviewer, model and effort a ticket would use: each field it names, or else the settings' (`loadConfig`, so this machine's own settings too). `speck status --json` (and so the panel), `speck review`, lint's same-model check and `buildPlan` use it.
- A Codex or command reviewer round compares the last round's recorded reviewer and model with this one's; when either differs it starts a fresh session with the full history (the round-1 prompt and every earlier verdict and response), says why in one line, and records `session: fresh`. Codex rounds now record `session` too. Rounds recorded without a reviewer or model aren't compared.
- Existing tests changed because they checked that tickets copy the agents, which criterion 1 removes: review.test.mjs "AC1: speck new copies the config values" (now checks the blank ticket is reviewed with the config's values), builder-switch-0293 AC5 (both: a blank ticket takes the new builder, a named one keeps its own, and the Settings note says so), and the Settings note's wording in settings-0370, settings-0381 AC3 and run-builder-0324 AC4. The note under the builder in Settings said "Tickets already made keep the builder they were made with", which this change makes untrue.
- The settings' explanations for builder and reviewer, the brief, and the build, review and ticket skills now say a blank ticket field uses the settings when the build or round starts.
- Self-check: the panel's builder note, the settings' explanations and the ticket skill claimed tickets copy the builder; changed to match.

## In plain words
New tickets no longer write down who builds and reviews them. They use whatever your settings say at the time: the builder when the build starts, and the reviewer, its model and effort when each review round starts. So switching reviewer in Settings now reaches every open ticket at once, with no edits or commits to tickets. A ticket that names its own builder or reviewer still keeps it. If the reviewer or its model changes partway through a ticket's review, the next round starts afresh and is given everything the earlier rounds saw. To see it, make a ticket, change the reviewer in Settings, and the ticket's card shows the new one. Worth knowing: tickets made before this change still name their agents, so they keep them until you clear them with `speck set <id> reviewer ""`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: open tickets made before this change still name their builder and reviewer, so they keep them until cleared by hand (out of scope).
- Tidy-up: the Settings line shown when build_command is one you've written yourself still says "whichever builder the ticket was made with"; "whichever builder the ticket names" would read better now.
- Known limit: a claude-subagent reviewer is started by the builder, so noticing a changed setting between its rounds relies on the review skill's instruction rather than on speck.
- No inbox notes: none needs its own ticket.

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
    "reviewed_sha": "de21b15598599056922e4fac1477afba0afb709c",
    "session": "fresh",
    "thread_id": "01a165fb-dc0e-76a1-b7ab-95ee9095db1a",
    "seconds": 32,
    "usage": {
      "input_tokens": 234601,
      "cached_input_tokens": 177920,
      "cache_write_input_tokens": 0,
      "output_tokens": 1012,
      "reasoning_output_tokens": 75
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:39:58.868Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdNew in scripts/speck.mjs leaves template agent fields blank; passing agents-0388 AC1 exercises ticket creation."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Settings resolution and session changes are tested, but runCodexReview does not save builder_response or the round-1 prompt. historyPrompt therefore cannot include every earlier Codex response when starting fresh."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticketAgents and ticketSameModelProblem resolve explicit values and settings fallbacks; passing agents-0388 AC3 tests cover overrides and lint rejection."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData resolves builder and reviewer through ticketAgents for the panel; passing agents-0388 AC4 checks settings changes reach status data."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported targeted run: 646 passed, zero failed, three skipped. Reviewed test changes match the requested behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs:339",
        "issue": "Fresh review sessions lose earlier builder responses from Codex rounds. For example, after two Codex rounds, changing the model for round 3 sends earlier verdicts but omits the response supplied before round 2: runCodexReview never records builder_response, which historyPrompt relies on. It also does not save the original round-1 prompt, losing its test output and initial response during reconstruction. The new tests only check for the history heading.",
        "suggested_fix": "Save Codex builder responses and the original round-1 prompt, as the command adapter does. Add a multi-round test with distinct responses and test output, then change model or reviewer and assert the fresh prompt contains that history.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "New tickets inherit current settings, and explicit ticket choices remain supported. However, switching reviewer or model can discard earlier explanations and test evidence from Codex reviews. Fix the history preservation before merge."
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
    "reviewed_sha": "1b805ed5c77033ee786dae64bf34133b0911eb5f",
    "session": "continued",
    "thread_id": "01a165fb-dc0e-76a1-b7ab-95ee9095db1a",
    "builder_response": "- Tests run: test/agents-0388.test.mjs test/review.test.mjs test/review-*.test.mjs test/reviewing.test.mjs test/resume-0044.test.mjs test/pack-0131.test.mjs test/changes-0356.test.mjs test/close.test.mjs test/codex-times-0342.test.mjs test/status-json.test.mjs test/plain-words-0130.test.mjs (plus the commands.checks files)\n- F1: fixed. runCodexReview (scripts/review.mjs) now saves the round-1 prompt it sends to `round-1.prompt.md` (roundOneFile, now exported from scripts/reviewers.mjs), as the command adapter does, and records `builder_response` on each Codex round that has one. New test \"0388 AC2: a fresh Codex session after a change gets every earlier response, verdict and the round-1 test output\" runs three Codex rounds with distinct test output and responses, changes the model before round 3, and checks the fresh prompt holds the round-1 test output, all three responses and both earlier verdicts.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 359062,
      "cached_input_tokens": 293632,
      "cache_write_input_tokens": 0,
      "output_tokens": 1539,
      "reasoning_output_tokens": 75
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:41:05.826Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/ticket.md leaves all four fields blank; cmdNew preserves them. Passing agents-0388 AC1 exercises creation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketAgents, buildPlan and review adapters resolve settings fallbacks. Passing AC2 tests cover fresh sessions, continued sessions and metadata. The new three-round test verifies preservation of earlier responses, verdicts and round-1 test output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticketAgents preserves explicit overrides; ticketSameModelProblem checks resolved values. Passing AC3 tests exercise overrides and lint's same-model rejection."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData resolves builder and reviewer for status JSON and the panel. Passing AC4 test verifies the displayed reviewer follows settings changes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Round 2 reports 328 passing tests, zero failures and three skips; round 1 also reported no failures. Changes remain within ticket scope."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs:340",
        "issue": "Fresh sessions previously lost earlier Codex builder responses and the original round-1 evidence. runCodexReview now saves both, and the new three-round regression test checks their inclusion after a model change.",
        "suggested_fix": "Implemented: preserve the original prompt and record builder_response on Codex rounds.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "New tickets follow current agent settings unless they name their own choices. Reviewer or model changes start a fresh session with the required history. The history gap is fixed, and the reported tests pass."
  }
}
```

</details>

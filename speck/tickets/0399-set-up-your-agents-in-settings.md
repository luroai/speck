---
id: "0399"
title: "Set up your agents in Settings"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0397","0398"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:34:29.683Z"
approved: "2026-10-23T10:47:03.107Z"

---
# 0399 · Set up your agents in Settings

**Status:** 👍 approved

## Problem
There's nowhere in Settings to see which agents you have, add one, or give an API provider its key, apart from the DeepSeek key field 0393 added.

## Outcome
Settings has a "Your agents" group where you see, add and remove your agents.

## Acceptance criteria
1. Settings has a "Your agents" group after Auto-build. It lists each of your agents (0398) with whether it's installed and signed in, or for a provider whether its key is set, and a way to remove it. Removing one a role uses is refused, saying which role.
2. "Add an agent" offers each agent speck knows that isn't in your list. Claude Code, Codex and Cursor can be added when they're installed; one that isn't installed says how to install it. Each API provider, such as DeepSeek, is offered too.
3. Adding an API provider asks for its key in a field that never shows a saved key, and the provider joins your list once the key is saved. The key can be replaced from the agent's row. Adding or removing an agent, or saving a key, makes no commit.
4. The group updates in place, without the view jumping or losing the keyboard focus, and fits a 320 px wide window.
5. No test that passed before this change fails, except checks of 0393's DeepSeek key field, which are changed to check criterion 3.

## Out of scope
- Choosing each role's model: 0400.

## Notes
- Builds on 0398's list and commands, 0389's keys and 0393's key field.
- Waits for 0397, which changes Settings in `templates/panel.html`, and for 0398.
- Failing before this build: none
- Self-check: a provider removed with its key still kept can be added back without pasting the key again; the README's sentence about 0393's key field, which this replaces, now describes the Your agents group.

## In plain words
Settings now has a "Your agents" group just under Auto-build. It lists the agents you use on this machine, says whether each is installed and signed in (or, for DeepSeek and other providers, whether its key is saved), and lets you remove one. speck won't remove the agent your builder, reviewer or Foreman runs on, and says which role uses it. "Add an agent" lists the rest: you can add an installed one, one that isn't installed tells you how to install it, and a provider asks for its key and joins your list once the key is saved. You can replace a provider's key from its own row. None of this makes a commit.

To see it, open Settings and look under Auto-build, then press "Add an agent". The old "API keys" box that appeared when you picked DeepSeek is gone: its key field now lives in the Your agents group. Worth knowing: removing a provider keeps its key on this machine, so you can add it back without pasting the key again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 206,601
- Elapsed since build started: 13 min
- Changed lines: 336 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Skipped, as it duplicates 0400: the builder, reviewer and Foreman lists still offer agents that aren't yours.
- Known limit: removing a provider from your agents keeps its key; `speck keys remove` deletes it.

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
    "reviewed_sha": "7754194d99020c344071a93e7cb9130b83140f2b",
    "session": "fresh",
    "thread_id": "01a1685e-4988-74d0-932d-19ebdc57c800",
    "builder_response": "- Tests run: test/settings-agents-0399.test.mjs test/settings-provider-0393.test.mjs test/panel-0257.test.mjs test/panel-0277.test.mjs test/panel-0371.test.mjs\n- Round 1. 0393's \"API keys\" box is replaced by the Your agents group (AC5 allows changing 0393's key-field checks to check AC3); 0257, 0277 and 0371 were run because the new rows sit in Settings and share its CSS rules. The agent rows use their own `arow` class so they aren't counted as config settings.\n- README's sentence describing 0393's old key field was replaced, since it no longer held.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 205615,
      "cached_input_tokens": 145152,
      "cache_write_input_tokens": 0,
      "output_tokens": 986,
      "reasoning_output_tokens": 295
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T10:46:47.463Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html renderSettings and agentRow place Your agents after Auto-build and show status and removal controls. panelAgentRequest uses removeAgent's role protection. Passing 0399 AC1 tests cover placement, statuses and refusals naming the roles."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "yourAgentsView supplies known agents and installation hints; addRows offers agents outside the list and provider key fields. Passing 0399 AC2 tests cover installation requirements, adding installed agents and re-adding a provider whose key is retained."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "keyLine uses empty password fields; saveKey clears submitted keys after saving. panelKeyAddRequest saves the key and adds the provider. Passing 0399 AC3 tests check replacement, absence of secrets in responses and unchanged git HEAD and status."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "drawAgents retains the group container and restores keyboard focus with preventScroll. The passing AC4 page test checks retained surrounding nodes and focus transitions; the passing real-browser test checks overflow at 320 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded run has 153 passes, no failures and three skips. Changed 0393 checks cover the replacement key interface; additional Settings regression files passed. No unrelated changes or weakened tests found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now shows your agents, their availability and provider key status, with controls to add, remove and replace keys. Agents used by a role cannot be removed. The relevant tests pass, including the narrow-window browser check. No blocking concerns found."
  }
}
```

</details>

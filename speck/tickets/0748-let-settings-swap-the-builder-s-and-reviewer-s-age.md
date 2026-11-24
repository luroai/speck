---
id: "0748"
title: "Swap the builder's agent with the reviewer's in Settings"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-let-settings-swap-the-builder-and-reviewer-families.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:22:27.734Z"

---
# 0748 · Swap the builder's agent with the reviewer's in Settings

**Status:** 🔍 reviewing

## Problem
Now that each setting saves by itself, swapping the builder and reviewer between agents, such as a Claude Code builder with a Codex reviewer to the other way round, can't be done: each half is refused on its own, as for a moment both would be the same family. The refusal doesn't say how to get there.

## Outcome
A change to the builder or reviewer that clashes with the other offers to swap the other one in the same step.

## Acceptance criteria
1. When you pick a builder agent that is the reviewer's family, and so would be refused, Settings asks whether to also set the reviewer to the builder's old agent, and on yes saves both at once; on no, nothing is saved and the row goes back.
2. The same works the other way round, picking a reviewer that is the builder's family.
3. A change that clashes in a way a swap doesn't fix (such as same-model review with `allow_same_model_review` off and only one agent) is refused as today, saying why.
4. No test that passed before this change fails.

## Out of scope
- Models and efforts within one agent.

## Notes
- From 0731's own note: its refusal used to say "pick it as the reviewer in the same Save", which 0731 removed.
- Decision: offer the swap in one step, rather than only explaining the way round.
- Failing before this build: none
- Self-check: a swap offer the page can't use (malformed, or no confirm dialog) was treated as a "no" and hid the refusal's reason; now the refusal is shown as it came, with a test.
- Pictures: none, because the change shows nothing new on the page: the question is the browser's own yes-or-no dialog, as the auto_ship question is.

## In plain words
You can now swap the builder and the reviewer between two agents in Settings, such as from a Claude Code builder with a Codex reviewer to the other way round. Pick the new agent for one of them: when it's the same family as the other, Settings asks whether to swap the other to the first one's agent and model, and on yes saves both at once. Say no and nothing changes. To see it, open Settings with a Claude Code builder and a Codex reviewer, and pick a Codex model for the builder. Each role keeps its own effort setting, so check it after a swap.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: a swap leaves each role's effort as it was, so a builder's effort set for one agent stays when it becomes the other.

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
    "reviewed_sha": "4ce03bab8b8adfcf0d1d42b626268d208d442d5d",
    "session": "fresh",
    "thread_id": "01a20ff5-f511-7883-9cf8-c3a7098f520d",
    "builder_response": "- Tests run: `speck test --related test/settings-swap-0748.test.mjs` (the ticket's own file, and every existing test file naming a changed file: 4386 tests, 0 failing). It ran past the builder's 10-minute shell limit, so it was run in the background and waited for to the end.\n- The server (`saveRepoSettings`, via the new `scripts/settings-swap.mjs`) works out the swap and adds it to the refusal as `swap`; the page asks, and on yes saves the picked role and the swapped one in one save, rechecking it as any save is. AC4: no existing test changed.\n- No pictures: the only new thing seen is the browser's own confirm dialog.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 145100,
      "cached_input_tokens": 101120,
      "cache_write_input_tokens": 0,
      "output_tokens": 787,
      "reasoning_output_tokens": 198
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43980,
      "cached": 101120,
      "write": 0,
      "output": 787
    },
    "cost_usd": 0.105942,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T23:48:56.501Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings-swap.mjs swapOffer computes the reviewer replacement; templates/panel-settings.js askSwap and sendSettings confirm, retry both roles together, or restore the original row. AC1 server and page tests cover acceptance and cancellation; all passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "swapOffer handles reviewer changes symmetrically and converts a claude-subagent reviewer to a claude builder. AC2 server and page tests exercise the reverse swap; both passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "swapOffer returns null when swapping cannot resolve the clash; saveRepoSettings preserves the existing refusal. AC3 tests cover unresolved clashes, absent offers and malformed offers; all passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported related-test run completed with 4,383 passing, three skipped and zero failing tests. Existing tests were unchanged. The committed change is confined to the Settings swap implementation, its tests and ticket."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now offers to swap the builder and reviewer when a selected agent clashes with the other role. Accepting saves both together; declining restores the row. Both directions and refusal cases are covered by passing tests. No blocking issues found."
  }
}
```

</details>

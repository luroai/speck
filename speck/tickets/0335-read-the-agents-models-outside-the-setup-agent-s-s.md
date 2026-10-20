---
id: "0335"
title: "Read the agents' models outside the setup agent's sandbox"                # one outcome, no "and"
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
after: ["0334"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:21:43.432Z"

---
# 0335 · Read the agents' models outside the setup agent's sandbox

**Status:** 🔍 reviewing

## Problem
In Cursor's agent chat, `agent models` failed with an SSL error, because Cursor's sandbox blocked the network, while it worked in the user's own terminal and when Cursor ran it again outside its sandbox (2026-10-20). Setup runs `speck agents --json` from inside that chat, so it can't list Cursor's models there, and the agent guesses model names instead.

## Outcome
When the setup agent's sandbox stops speck reading the agents' models, setup reads them another way rather than guessing.

## Acceptance criteria
1. In `skills/speck-setup/SKILL.md`, section 5, when `speck agents --json` gives an agent no `models` and its `models_why` names a network, SSL or certificate failure, the skill tells the agent to run `speck agents --json` again outside its own sandbox, asking the user first if its tool needs their approval for that.
2. If that's not possible or still fails, the skill tells the agent to ask the user to run `agent models` (or the agent's own listing command) in their own terminal and paste the list, and to offer models from what they paste.
3. The skill says this happens inside an agent's sandbox, and that `speck run` builds aren't affected, as they don't run in it.
4. The installed copy, `.claude/skills/speck-setup/SKILL.md`, matches `skills/speck-setup/SKILL.md`.
5. No test that passed before this change fails.

## Out of scope
- Changing how `speck agents` itself reads the models (`scripts/agents.mjs`).

## Notes
- After 0334, which changes the same section of the same skill.
- Checked 2026-10-20: `models_why` holds the SSL error's text when `agent models` fails. Through a local proxy serving a self-signed certificate, `agent models` exited 1 with `Failed to load models: [internal] self-signed certificate; …`, and `speck agents --json` gave Cursor no models and `models_why: Cursor couldn't list its models (Failed to load models: [internal] self-signed certificate; …).` A refused connection gives `Failed to load models: [unavailable] connect ECONNREFUSED …` the same way.
- Failing before this build: none
- Self-check: named Cursor's listing command by its entry's `command` (`agent` or `cursor-agent`), and let the all-Cursor bullet's empty-list fallback point to the sandbox steps rather than asking the user to type a name.
- Pictures: none needed: the change is to a skill's text, which nobody sees in the panel.

## In plain words
When you set speck up from an agent's chat that walls off the network, as Cursor's does, setup could fail to read which models your Cursor or Codex account offers, and the agent then guessed model names. Now it tries again outside its walled-off space, asking you first if its tool needs your say-so, and if that still doesn't work it asks you to run the model list in your own terminal and paste it, then offers only those models. To see it, run setup from Cursor's chat and pick Cursor: you should be offered real model names or asked to paste the list, never a made-up one. Builds that `speck run` starts aren't affected.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none.

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
    "reviewed_sha": "eed36c743218709fba2763e8c52f227a3952fcc9",
    "thread_id": "01a15943-a8c4-7581-8987-cafa7eabcca7",
    "seconds": 30,
    "usage": {
      "input_tokens": 83764,
      "cached_input_tokens": 51456,
      "cache_write_input_tokens": 0,
      "output_tokens": 591,
      "reasoning_output_tokens": 29
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:23:18.351Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 5 explicitly checks missing models and network, SSL or certificate errors, then instructs retrying outside the sandbox with approval where required. Test 0335 AC1 passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Section 5 instructs requesting the agent's listing command output from the user's terminal and offering only pasted model names. It identifies Cursor's command and codex debug models. Test 0335 AC2 passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 5 explains that the setup tool's sandbox can block networking and explicitly says speck run builds aren't affected because they don't run in that sandbox. Test 0335 AC3 passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Direct comparison confirmed the installed and source skills match. Test 0335 AC4 also passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0335-tests.txt confirms 121 tests: 118 passed, three skipped and zero failed. The change leaves scripts/agents.mjs untouched."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Setup now explains how to retry model discovery outside its sandbox and, if needed, use a model list pasted from the user's terminal. The installed skill matches, the reported tests passed, and no blocking issues were found."
  }
}
```

</details>

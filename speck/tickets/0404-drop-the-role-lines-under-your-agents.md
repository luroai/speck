---
id: "0404"
title: "Drop the role lines under Your agents"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-drop-the-role-lines-under-your-agents.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0403"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:03:55.061Z"

---
# 0404 · Drop the role lines under Your agents

**Status:** 🔍 reviewing

## Problem
Each agent in Your agents has a line such as "The builder and Foreman use it." or "The reviewer uses it." That repeats what the role lists already show, and adds clutter.

## Outcome
Your agents no longer says which roles use each agent.

## Acceptance criteria
1. In Settings, under Your agents, no agent row shows a line that names the roles using that agent, such as "The builder and Foreman use it." or "The reviewer uses it."
2. Each agent still shows its name, whether it is installed and signed in (or for a provider whether its key is set), and Remove. Removing an agent a role uses is still refused, saying which role, as 0399 does.
3. No test that passed before this change fails, except a check that an agent row names the roles using it, which is changed to check criterion 1.

## Out of scope
- Changing which agents are listed, or how Remove works, beyond dropping the role lines.

## Notes
- Asked for 2026-10-23 from the Your agents rows. The lines come from `agentRow` in `templates/panel.html` (`The ${ROLE_WORDS(roles)} use(s) it.`), fed by `roles` on each agent from `yourAgentsShown` in `scripts/your-agents.mjs`.
- Waits for 0403: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: no changes. The server still sends each agent's roles, as 0399's Remove refusal and its AC1 test use them; only the panel stops showing them, and the now unused ROLE_WORDS went with it.

## In plain words
In Settings, the rows under Your agents no longer have a line such as "The reviewer uses it." under each agent. Each row still shows the agent's name, whether it's installed and signed in (or whether a provider's key is set) and its Remove button. To see it, open Settings and look at Your agents. Removing an agent that a role still uses is refused as before, and the refusal still says which role, so that's now the place you'll learn it.

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
    "reviewed_sha": "68bae4d6700eb8a80e26340e192cb4621ce4dd5a",
    "session": "fresh",
    "thread_id": "01a168a7-ee51-7240-909f-69ab525f4b1c",
    "builder_response": "- Tests run: test/settings-agents-0404.test.mjs test/settings-agents-0399.test.mjs (plus the commands.checks files)\n- The server still sends each agent's roles (0399's Remove refusal and its AC1 answer test use them); only the panel stops showing the role line, and ROLE_WORDS, now unused, is removed.\n- No existing test checked the role line, so none was changed for AC3.\n- Pictures of Your agents in light and dark are kept with the review pack.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 86685,
      "cached_input_tokens": 61568,
      "cache_write_input_tokens": 0,
      "output_tokens": 500,
      "reasoning_output_tokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T12:07:00.180Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html agentRow no longer renders role descriptions; the unused ROLE_WORDS helper is removed. Passing test '0404 AC1: no row under Your agents says which roles use its agent' exercises the page script with single-role and multiple-role agents, including a provider."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "agentRow retains names, agentWords status, Remove, readiness explanations and provider key controls. Both 0404 AC2 tests passed, checking displayed details and refusal to remove the reviewer’s agent. Existing 0399 tests also cover removal refusal for builder and Foreman."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0404-tests.txt: 127 tests, 124 passed, 3 skipped, 0 failed. Existing tests were unchanged. The production diff only removes role-line rendering and its unused helper; removal logic and server role data remain unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The role descriptions are removed from Your agents. Agent names, status, key controls and Remove remain available, and removing an agent used by a role is still refused with an explanation. The relevant tests pass, and no blocking concerns were found."
  }
}
```

</details>

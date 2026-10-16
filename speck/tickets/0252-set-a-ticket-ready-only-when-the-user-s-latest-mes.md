---
id: "0252"
title: "Set a ticket ready only when the user's latest message says to"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T13:40:42.427Z"

---
# 0252 · Set a ticket ready only when the user's latest message says to

**Status:** 🔍 reviewing

## Problem
Setting a ticket ready is the user's gate (Gate 1), but `/speck-ticket` only says to set it ready "if the user explicitly approves", without saying what counts. On 2026-10-16 an agent read the user's choice of a tagline as a yes to its own offer to "update 0251 and set it ready", and set it ready. `speck run` started building it at once, and auto-ship covered its risk, so it could have shipped without the user seeing it. Nothing breaks a user's trust in speck faster.

## Outcome
Every speck skill that can set a ticket ready says plainly that an agent does so only when the user's latest message tells it to set that ticket ready, and that nothing else counts.

## Acceptance criteria
1. Step 9 of `/speck-ticket` says an agent sets a ticket ready only when the user's latest message explicitly tells it to set that ticket ready (for example "set 0251 ready"), and lists what doesn't count: choosing an option, approving or changing wording, answering a question, agreeing to a proposal that bundles setting it ready with other steps, or something the user agreed earlier in the conversation.
2. Step 9 also says an agent never offers to set a ticket ready as part of a proposal with other steps: it asks "Shall I set <id> ready?" as a question on its own, after any other change is done.
3. The speck section that `speck init` writes to `AGENTS.md`, and `/speck-setup` where it has the user approve the first ticket, state the same rule in one sentence.
4. `/speck-build`'s fix-ticket step, which sets a priority-0 fix ticket ready without asking so it builds next, is unchanged.
5. No test that passed before this change fails, apart from tests that check wording this ticket deliberately changes, which check the new wording instead.

## Out of scope
- A hard guard in `speck set` or the panel that stops an agent setting a ticket ready: a separate decision, since users also tell their agent "set them ready".
- Gate 2 (shipping), which `/speck-ship` already reserves for the user.

## Notes
- Wording to start from: "Set a ticket ready only when the user's latest message tells you to set that ticket ready. Nothing else counts: not choosing an option, approving wording, answering a question or agreeing to a plan. When in doubt, ask." British English.
- Also update this repo's own copies installed from `skills/` (`.claude/skills/` and `.agents/skills/`) the way `speck init` does, if the tests expect them to match.
- Failing before this build: none
- `.claude/skills/` and `.agents/skills/` are symlinks to `skills/`, so they need no separate update. This repo's own AGENTS.md speck section was brought in line with what `speck init` writes.
- Self-check: no changes

## In plain words
Agents working with speck now set a ticket ready only when your latest message tells them to set that ticket ready. Picking an option, approving wording, answering a question or agreeing to a plan that includes it no longer counts, and an agent asks "Shall I set this ticket ready?" on its own, after any other change is done. Projects get the same rule in their agent guide the next time speck is installed or updated there, and the setup guide repeats it. Fix tickets for a broken main branch are still set ready automatically, as before. Worth watching: this is guidance to the agent, not a hard lock, so the panel and the command line still let anyone set a ticket ready.

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
    "reviewed_sha": "ec7ff0afaa9d060c868cb50b6640019194e15719",
    "thread_id": "01a144f2-f72f-7ae2-a722-1210e44e36af",
    "seconds": 24,
    "usage": {
      "input_tokens": 87700,
      "cached_input_tokens": 52352,
      "cache_write_input_tokens": 0,
      "output_tokens": 684,
      "reasoning_output_tokens": 9
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T13:42:39.771Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 9 requires an explicit instruction in the user's latest message, gives the example and lists all five exclusions. Passing test '0252 AC1' checks this wording."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Step 9 prohibits bundled proposals and requires the standalone question after other changes are done. Passing test '0252 AC2' checks each requirement."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/install.mjs AGENTS_SECTION and skills/speck-setup/SKILL.md's first-ticket approval step contain the same one-sentence rule. Both '0252 AC3' tests passed; the installer test exercises syncAgentsSection. The repository's AGENTS.md also matches."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "git diff main shows no change to skills/speck-build/SKILL.md. Passing test '0252 AC4' verifies the existing instruction to set a priority-0 fix ticket ready without asking."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded output in /tmp/speck-0252-tests.txt confirms 191 tests passed with no failures. Existing tests were not modified. The diff is limited to the requested instructions, installer wording, ticket records and new wording tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The instructions now require the user's latest message to explicitly request setting a ticket ready and prohibit bundling that request with other changes. Setup and generated project guidance carry the same rule. The fix-ticket exception remains unchanged. All 191 reported tests passed, and no blocking issues were found."
  }
}
```

</details>

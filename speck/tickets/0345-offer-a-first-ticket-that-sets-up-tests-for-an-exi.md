---
id: "0345"
title: "Offer a first ticket that sets up tests for an existing folder's code"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T21:23:07.590Z"

---
# 0345 · Offer a first ticket that sets up tests for an existing folder's code

**Status:** 🔍 reviewing

## Problem
In an existing folder with code but no tests, setup now sets `commands.test` to `node --test` (0331), but nothing sets up tests for the code that's there. So the first feature ticket builds the test setup itself: on the user's work laptop (2026-10-20), a ticket to add a keyboard shortcut took 20 minutes, most of it setting up a test runner and a fake page to test with, and moving the code into a module it could test.

## Outcome
In an existing folder with code but no tests, setup offers a first ticket that sets up tests for that code, so feature tickets stay small.

## Acceptance criteria
1. In section 3, step 4 of `skills/speck-setup/SKILL.md`, when the user has no tests and the folder holds code, such as scripts, an app or a dashboard, the skill tells the agent to offer a draft ticket that sets up tests for that code, after setting `commands.test`.
2. The skill says the offered ticket's criteria include that at least one test of the existing code runs and passes, and that `commands.test` runs the tests it adds.
3. The skill tells the agent to say in plain words why: without it, the first feature ticket has to build the test setup itself, which makes it slow.
4. The ticket is made as section 4, step 5 makes a new project's first ticket: after sections 5 and 6, left as a draft for the user to approve, and committed only if the user agrees. A folder that holds only documents gets no such offer.
5. The installed copy, `.claude/skills/speck-setup/SKILL.md`, matches `skills/speck-setup/SKILL.md`.

## Out of scope
- Section 4's first ticket for a new project, which already sets up a test runner.
- Asking fewer questions during setup (`speck/ideas/2026-10-20-keep-setup-s-defaults-for-shipping-and-limits.md`).

## Notes
- From the user's first ticket in Cursor on their work laptop, 2026-10-20: `commands.test` was `true`, so the builder switched it to `node --test` and wrote a fake-page test file so each criterion could fail first.
- The skills are instructions to agents, not documents, so tests may check their wording (`docs/brief.md`, "Criteria about documents").
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: section 8 now tells an existing project to read and approve the offered tests ticket first, rather than only pointing to `/speck-capture`.

## In plain words
When you set speck up in a folder that already has code but no tests, setup now offers to write a first ticket that adds tests for that code, and explains why: without it, your first real feature has to set up testing too, which makes it slow. The ticket is left for you to read and approve, and is only saved if you say yes. Folders that hold only documents aren't offered one. To see it, run setup in a folder with a script or small app and no tests. At the end, setup also reminds you to approve that ticket before your first feature.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "0e3c7ec5ad2fe43ddfd92310f5309dd129452106",
    "thread_id": "01a15b33-7a6a-7ab0-a884-2814db36eaf0",
    "seconds": 26,
    "usage": {
      "input_tokens": 154886,
      "cached_input_tokens": 119040,
      "cache_write_input_tokens": 0,
      "output_tokens": 831,
      "reasoning_output_tokens": 39
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T21:24:48.292Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 3, step 4 offers the draft ticket for code without tests once commands.test is set. Covered by passing test '0345 AC1'."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The new bullet requires a passing test of existing code and commands.test running the added tests. Covered by passing test '0345 AC2'."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The bullet explains that otherwise the first feature ticket must build the test setup itself, making it slow. Covered by passing test '0345 AC3'."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The bullet specifies creation after sections 5 and 6, draft status, user agreement before committing, and no offer for document-only folders. Both '0345 AC4' tests passed; section 4's existing first-ticket instructions remain unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Direct comparison confirmed the installed skill matches the source. The '0345 AC5' equality test also passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Setup now offers existing projects without tests a draft ticket to test their code, explains why it helps, and preserves user approval before committing. All criteria are met. The reported test run had 227 passes, three skips and no failures."
  }
}
```

</details>

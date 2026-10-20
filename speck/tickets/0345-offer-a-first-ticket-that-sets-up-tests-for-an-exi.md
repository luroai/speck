---
id: "0345"
title: "Offer a first ticket that sets up tests for an existing folder's code"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

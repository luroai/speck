---
id: "0095"
title: "Leave failures that were there before a build alone"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-keep-builders-to-their-own-ticket.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:12.991Z"

---
# 0095 · Leave failures that were there before a build alone

**Status:** 🔨 building

## Problem
A builder that finds tests already failing on `main` can "fix" them inside its own ticket, especially when a criterion asks for the suite to pass. On 2026-10-10, 0090 (add a licence) fixed an unrelated test, the reviewer accepted it, and the fix then conflicted with 0086. The build skill already says to keep to the ticket, but nothing tells the builder or reviewer how to treat failures that were there before.

## Outcome
Tests that already fail before a build starts are recorded and left alone: the builder doesn't fix them, and the reviewer treats a fix to one as out of scope.

## Acceptance criteria
1. The build skill has the builder run the test command in the new worktree before changing anything, and record the result in the ticket's Notes as `Failing before this build: <tests>` or `Failing before this build: none`.
2. The build skill says a test listed as failing before the build is never changed or fixed in that build, whatever the criteria say. The builder lists it as a follow-up in the Delivery log instead.
3. The reviewer prompt says a change that fixes a failure listed as there before the build is an out-of-scope, blocking finding, even when it makes a criterion pass.
4. The reviewer prompt says a criterion about the suite passing is judged against tests that passed before the build: failures listed as there before don't fail it.

## Out of scope
- Speck checking this itself (for example in `speck close`).
- How criteria are written (0096).

## Notes
- Skills and prompts are text: tests can check each instruction is there; the reviewer checks the wording.
- Failing before this build: none (`npm test` in the new worktree before any change: 798 tests, 795 pass, 3 skipped, 0 fail).
- Self-check: no changes. The new wording sits in pre-flight step 6 of the build skill and in the reviewer prompt's criteria and scope checks; `speck-review` builds its prompt from `templates/reviewer-prompt.md`, so both reviewers get it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

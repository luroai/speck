---
id: "0095"
title: "Leave failures that were there before a build alone"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
finished: "2026-10-10T19:51:09.503Z"

---
# 0095 · Leave failures that were there before a build alone

**Status:** ✅ done

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
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 259,408
- Elapsed since build started: 71 min
- Changed lines: 5 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "cb5f29256154a0ed859f7a953a0a47be660465c2",
    "thread_id": "01a1275c-8ebe-7390-ba0f-9bc855ac9857",
    "seconds": 22,
    "usage": {
      "input_tokens": 258790,
      "cached_input_tokens": 168192,
      "cache_write_input_tokens": 0,
      "output_tokens": 618,
      "reasoning_output_tokens": 92
    },
    "saved_at": "2026-10-10T19:49:21.387Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md, Pre-flight step 6, requires commands.test in the created worktree before build changes and records named failures or none in Notes. test/baseline-0095.test.mjs AC1 checks these instructions and their position before Tests first; builder output reports it passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Pre-flight step 6 explicitly forbids changing or fixing listed failures regardless of acceptance criteria and requires a Delivery log follow-up. baseline-0095.test.mjs AC2 checks both instructions; reported passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/reviewer-prompt.md scope check explicitly makes fixing a listed pre-existing failure an out-of-scope blocking finding, even if a criterion passes. baseline-0095.test.mjs AC3 checks this; reported passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/reviewer-prompt.md acceptance check judges suite-passing criteria against previously passing tests and excludes recorded pre-existing failures. baseline-0095.test.mjs AC4 checks this; reported passing."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The build and review instructions now record existing test failures, leave them for follow-up work and prevent reviewers from demanding unrelated fixes. All four criteria are covered by text checks reported passing. The branch changes stay within scope; no blocking concerns found. Tests were inspected but not rerun in the read-only environment."
  }
}
```

</details>

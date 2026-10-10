---
id: "0099"
title: "Tell a failing main apart from a failing ticket when shipping"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:10.812Z"
finished: "2026-10-10T19:39:39.067Z"

---
# 0099 · Tell a failing main apart from a failing ticket when shipping

**Status:** ✅ done

## Problem
`speck ship` runs the tests on the ticket's branch. When they fail because `main` itself is broken, it gives the same refusal as a broken ticket, so every waiting ship fails with a message that blames the ticket. On 2026-10-10 that's what stopped 0087, 0090 and 0091.

## Outcome
When a ship's tests fail, `speck ship` checks the base branch too, and says plainly when it's `main` that's failing, with an exit code of its own.

## Acceptance criteria
1. When the tests fail on the ticket's branch, `speck ship` runs the test command on the base branch as it is, in a temporary worktree, then removes that worktree.
2. If the base branch fails too, it refuses with exit code 14 and says the base branch's own tests are failing, so this isn't the ticket's fault and nothing was shipped.
3. If the base branch passes, it refuses as it does today, adding that the base branch's tests pass.
4. Either way, nothing else changes, as with every other refusal.

## Out of scope
- What happens next when `main` is failing (0101, 0102).

## Notes
- Today a test failure in `speck ship` exits 1.
- The base branch is tested at the commit the ship would merge into: the local base, or the remote's when ship has just fetched new commits. The temporary worktree gets `worktree_setup`, as a build's worktree does; if that fails, ship refuses with exit 1 as before and says it couldn't check the base branch.
- `0048 AC1: other refusals keep their codes` used a test command that fails on main too, which AC2 now makes exit 14. Its command now fails only on the ticket branch, so it still checks that a failed-tests refusal exits 1. The exit-14 message keeps the opening "Tests failed on the approved branch", so 0027 AC4's check stands unchanged.
- Self-check: no changes (the worktree_setup failure path and removing the worktree on every path were already covered by tests).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 testFailure's finally block runs git worktree prune for the entire repository.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,082,493
- Elapsed since build started: 60 min
- Changed lines: 34 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: main's tests run in a fresh worktree, so a test command that needs untracked files (a `.env`, say) that `worktree_setup` doesn't create fails there too and is reported as exit 14.
- Follow-ups skipped as duplicates: `/speck-build` doesn't yet say what to do on exit 14 (matches 0101 and 0102).

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
    "reviewed_sha": "f4b5d761c5c6d15849c51ed5d665787835de41b3",
    "thread_id": "01a1274f-1570-75d3-974d-c8706340e9fc",
    "seconds": 27,
    "usage": {
      "input_tokens": 375111,
      "cached_input_tokens": 273920,
      "cache_write_input_tokens": 0,
      "output_tokens": 734,
      "reasoning_output_tokens": 42
    },
    "saved_at": "2026-10-10T19:34:43.707Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship.mjs:testFailure creates a detached temporary worktree at catchUp || baseSha, runs setup and tests, and removes it in finally. test/ship-0099.test.mjs covers the second test run, separate directory, cleanup and setup failure; builder output reports these passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "testFailure returns SpeckError with code 14 and the required message when both runs fail. The AC2 tests exercise normal, automatic and non-worktree shipping; builder output reports all passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "testFailure keeps default exit code 1 and adds that main's tests pass. The AC3 test exercises branch failure with base success and asserts both code and message; builder output reports it passing."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The AC4 test checks branches, checkout contents, stash and worktree lists for ordinary fixtures, but testFailure also runs repository-wide git worktree prune, which can remove unrelated stale worktree records."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "testFailure's finally block runs git worktree prune for the entire repository. On a refused ship this can delete unrelated expired worktree registrations whose directories are missing, violating the requirement that nothing else changes. The current preservation test has no unrelated stale worktree, so it misses this side effect.",
        "suggested_fix": "Remove the global prune and keep cleanup scoped to the temporary worktree. If removal fails, handle that temporary registration specifically. Add a regression test with an unrelated stale worktree registration and assert it survives both refusal outcomes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change correctly distinguishes failing base tests from a ticket-only failure and returns the requested messages and exit codes. One cleanup step can also remove unrelated worktree records during a refusal; that must be fixed before merge. I inspected the code and tests; I did not rerun tests in the read-only environment."
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
    "reviewed_sha": "537b811585721938306c3c7fced4300a8d6b6bb8",
    "thread_id": "01a1274f-1570-75d3-974d-c8706340e9fc",
    "seconds": 19,
    "usage": {
      "input_tokens": 705365,
      "cached_input_tokens": 538624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1283,
      "reasoning_output_tokens": 42
    },
    "saved_at": "2026-10-10T19:37:42.908Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship.mjs:shipTicket passes catchUp || baseSha to testFailure, which runs setup and the configured tests in a detached temporary worktree and cleans it in finally. test/ship-0099.test.mjs AC1 tests cover separate execution, base contents, setup and setup failure; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/ship.mjs:testFailure returns exit code 14 with the required explanation when base tests also fail. AC2 tests cover normal shipping, --auto and worktrees disabled; supplied results pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship.mjs:testFailure returns the existing default exit code 1 and states that the base tests pass. The AC3 test asserts the exit code and both message components; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Cleanup now targets only the temporary directory and its recorded Git admin folder. The AC4 preservation test checks branches, checkout contents, stash, ticket status and worktree lists for both outcomes and checkout modes. New F1 regression tests cover preserving unrelated missing worktrees and cleanup when the temporary worktree is locked; supplied results pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "Previously, repository-wide worktree pruning could remove unrelated stale worktree registrations during a refusal. The global prune has been removed and cleanup is scoped to the temporary worktree, with regression coverage.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Shipping now distinguishes failing base tests from a ticket-only failure, with the requested messages and exit codes. The cleanup issue is fixed, and all four criteria pass. The supplied suite reports 806 passing tests, no failures and three skips; I verified the code and coverage without rerunning tests in the read-only environment."
  }
}
```

</details>

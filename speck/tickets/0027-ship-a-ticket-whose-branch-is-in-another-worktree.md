---
id: "0027"
title: "Ship a ticket whose branch is in another worktree"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T09:50:07.299Z"

---
# 0027 · Ship a ticket whose branch is in another worktree

**Status:** 👍 approved

## Problem
Several sessions often share one checkout. Today `speck ship` checks out the base branch in the folder it runs in, and git refuses to check out a branch that's already checked out in another worktree. So once builds run in their own worktrees (0028), shipping would fail while your main checkout sits on the base branch.

## Outcome
`speck ship` works for a ticket whose branch is checked out in another worktree, with the same result as today.

## Acceptance criteria
1. When the ticket branch is checked out in a worktree and the base branch is checked out in the main checkout, `speck ship <id>` (and `--auto`) run from either folder gives today's result: the ticket set to `done` on its branch, a merge commit on the base branch, the push, and the branch deleted locally and on the remote.
2. When the base branch is checked out in another worktree, that checkout ends up with the merged files. Ship refuses, changing nothing, if that checkout has uncommitted changes to tracked files. Untracked files there only block it if the merge would overwrite them. When the base branch isn't checked out anywhere, ship works in the folder it runs in, as today.
3. After a successful ship, the ticket's worktree is removed. When ship ran from inside that worktree, it says the folder is gone and prints the path of the base branch's checkout.
4. Every existing ship check still applies. A refused or conflicting ship leaves the worktree, both branches and both folders as they were.
5. Tickets built without a worktree ship exactly as today.

## Out of scope
- Creating worktrees (0028).

## Notes
- Self-check: added a plain error for a worktree folder that was deleted by hand (git still thinks the branch is checked out there). A worktree that can't be removed (locked) no longer stops the ship before the push. A test also showed `--auto` reads `auto_ship` from the folder it runs in, so from the ticket's own branch the builder could switch it on; that predates this ticket and is logged as a follow-up.
- Pre-check: AC2 didn't say what happens when the base branch isn't checked out anywhere. It now does.
- Checked 2026-10-09: git 2.53.0 here. Git refuses to check out a branch that's already checked out in another worktree (the reason for this ticket), and has `git worktree remove`.
- Comes before 0028, so builds only move into worktrees once they can ship from one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 a remote catch-up blocked by an untracked file in the base checkout left the ticket committed as done; F2 (minor) the locked-worktree clean-up didn't say to unlock first. Round 2 (codex): approved.

## Delivery log
- Review rounds: 2 (codex, `gpt-6.1-sol`), with 424,602 reviewer tokens.
- Elapsed: about 9 minutes from start to approval (from `speck pack`).
- Changed lines: 120 (excluding tests and `speck/`), against a limit of 5,000.
- Before this, shipping a ticket whose branch was in another worktree made the ship commit and then failed on `git checkout`, leaving it half shipped. That's fixed here.
- Follow-up ideas:
  - `auto_ship` is read from the folder ship runs in. From the ticket's own branch, a builder could switch it on in that branch's `speck/config.yml` and authorise its own ship. Read `auto_ship` and `auto_ship_risk` from the base branch instead.
  - Add "the order of operations: does every step after the first change sit inside the rollback?" to the self-check. F1 was exactly that.

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
    "reviewed_sha": "e0e1641c98097576bb1c4ef3e9b92bb1c98aaf25",
    "thread_id": "01a12017-4a85-7ac0-8592-c85bc503042a",
    "seconds": 47,
    "usage": {
      "input_tokens": 142871,
      "cached_input_tokens": 88576,
      "cache_write_input_tokens": 0,
      "output_tokens": 1186,
      "reasoning_output_tokens": 196
    },
    "saved_at": "2026-10-09T09:56:46.451Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket routes branch operations to work and merges to mergeAt. The 0027 AC1/AC3 and AC1 tests exercise shipping from both folders, --auto, merge commits, push and branch deletion; builder reports all passing."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "0027 AC2 tests cover tracked changes and ordinary untracked collisions, but shipTicket at scripts/speck.mjs:1146 does not handle an untracked collision during the remote fast-forward. It leaves the ticket branch changed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0027 AC1/AC3 tests verify worktree removal and output naming the surviving base checkout when invoked inside the removed folder."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "shipTicket commits the done status before the remote catch-up merge, which is outside the rollback handler. A refused catch-up therefore preserves the ship commit rather than restoring both branches and folders. Ordinary conflict and failed-test rollback are covered by the 0027 AC4 test."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Existing ship tests exercise single-checkout approval checks, closure, merge conflicts, remote catch-up, pushing and deletion. They remain unchanged and the supplied output reports them passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:1146",
        "issue": "A remote catch-up refusal leaves the ticket incorrectly committed as done. With main checked out separately, put an untracked file there whose path is added by a new remote main commit. remoteBaseCatchUp returns that commit; shipTicket creates the done commit, then the --ff-only merge refuses to overwrite the untracked file. git throws before the subsequent merge rollback handler runs, leaving the ticket branch and its folder changed despite shipping being refused. No test covers this combination.",
        "suggested_fix": "Include the remote catch-up operation in transactional error handling and restore the ticket branch, base branch and checkouts on refusal. Add a worktree regression test with a remote-added path colliding with an untracked base-checkout file, asserting original branch hashes, approved status and unchanged file contents.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "scripts/speck.mjs:1173",
        "issue": "The cleanup instructions for a locked worktree omit unlocking it. The suggested git worktree remove command will refuse again while it remains locked.",
        "suggested_fix": "For a locked worktree, include git worktree unlock before removal, and verify the suggested recovery sequence in the locked-worktree test.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The updated capability description matches the normal flow, but its promise that refusals leave both branches and folders unchanged is false for F1."
    },
    "escalation_question": "",
    "summary": "Shipping across worktrees works in the tested normal cases. One failure path needs fixing: an untracked file blocking incoming remote changes can leave an unshipped ticket marked done. Tests use real Git operations, but miss this case. Review was read-only; test results are from the builder."
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
    "reviewed_sha": "98a8828dc3e10e21fc072718ec32fe38a05371cd",
    "thread_id": "01a12017-4a85-7ac0-8592-c85bc503042a",
    "seconds": 28,
    "usage": {
      "input_tokens": 278689,
      "cached_input_tokens": 207744,
      "cache_write_input_tokens": 0,
      "output_tokens": 1856,
      "reasoning_output_tokens": 196
    },
    "saved_at": "2026-10-09T09:58:28.537Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket performs checks and closure in the ticket checkout, merges in the base checkout, then pushes and deletes branches. The 0027 AC1/AC3 and AC1 tests exercise both invocation folders and --auto; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The 0027 AC2 tests exercise tracked-change refusal, blocking and harmless untracked files, merged checkout contents and an unchecked-out base branch. The new AC2/AC4 (F1) test also verifies unchanged checkouts when untracked files block remote catch-up. All pass in supplied results."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The 0027 AC1/AC3 tests verify removal of the ticket worktree and output identifying the base checkout when invoked inside the removed folder. The locked-worktree test verifies recovery instructions and successful cleanup."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "shipChecks retains approval, review-history and post-review change checks. shipTicket now invokes undo() for both catch-up and ticket-merge refusals. Existing safeguard tests, the 0027 conflict/failed-test test and the new F1 rollback regression all pass in supplied results."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Existing single-checkout ship tests remain intact and cover closure, merge commits, conflict rollback, remote catch-up, push failures and branch deletion. Supplied results report them passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:1146",
        "issue": "Remote catch-up refusal previously left the ticket committed as done. The catch-up failure now invokes undo(), restoring both branches and checkouts. The new real-Git regression checks hashes, statuses, approved ticket status and preservation of the untracked file.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "scripts/speck.mjs:1186",
        "issue": "Locked-worktree recovery now prints unlock before remove. The updated test performs the recovery steps and verifies that the worktree and local branch are removed.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The worktree shipping description now matches the implementation and tested rollback behaviour."
    },
    "escalation_question": "",
    "summary": "Approved. Shipping works across worktrees, and the previously missed refusal now restores the ticket and both checkouts. Both findings are resolved. The tests exercise real Git operations; supplied results show all 125 passing. Tests were inspected but not rerun during this read-only review."
  }
}
```

</details>

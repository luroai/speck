---
id: "0265"
title: "Merge the remote's base branch in when it has diverged cleanly"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0264"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T09:07:33.967Z"
approved: "2026-10-17T09:26:02.028Z"
finished: "2026-10-17T09:32:51.866Z"

---
# 0265 · Merge the remote's base branch in when it has diverged cleanly

**Status:** ✅ done

## Problem
When the remote's base branch has a commit your local base branch doesn't (for example, a README edited on GitHub), and your local base branch has one the remote doesn't, `speck ship` refuses with "each have commits the other doesn't". speck run's ship queue then waits for a new local commit that may never come, so approved tickets sit unshipped with no sign why outside `run.log`. This held up 0257 overnight on 2026-10-16 and 2026-10-17.

## Outcome
`speck ship` combines the two base branches itself when they merge without conflicts, and refuses as today only when they conflict.

## Acceptance criteria
1. When the local base branch and the remote's base branch each have commits the other doesn't, and they merge without conflicts, `speck ship` merges the remote's base branch into the local base branch with a merge commit, says so in one line naming the commits it brought in, then carries on shipping as if they had never diverged.
2. When they would conflict, `speck ship` refuses as today, changing nothing: the local base branch, the working tree and the index are as they were.
3. Uncommitted changes in the checkout the base branch is in, and untracked files, are kept as they were through the merge in criterion 1. When they'd be overwritten by the merge, `speck ship` refuses, changing nothing, and says which files are in the way.
4. When the ship that merged the remote's base branch in then doesn't ship (for example, a test fails), the merge commit stays on the local base branch, so the next ship doesn't need to merge it again.

## Out of scope
- Rebasing or rewriting history on either branch.
- Showing ship refusals in the panel.

## Notes
- The check is `remoteBaseCatchUp` in `scripts/ship.mjs`, which already fetches the remote's base branch and fast-forwards when only the remote is ahead.
- The merge in criterion 1 counts as a new commit on the base branch for speck run's ship queue (`refsOf`), so a ticket refused earlier is tried again.
- `scripts/ship.mjs` is at 579 lines and the limit is 600 (0078 AC2), so code added there may need to move into a module of its own.
- Failing before this build: none
- Self-check: no changes

## In plain words
When someone edits the main branch on GitHub (a README tweak, say) while your own copy has commits GitHub doesn't, shipping no longer stops with a message that only shows up in the run log. speck now combines the two itself, says in one line which of GitHub's commits it brought in, and carries on shipping, so approved tickets don't sit waiting overnight.

To see it, edit a file on GitHub, make a commit on your own main, then ship an approved ticket: the ship output names the GitHub commit and the ticket lands.

It still stops, changing nothing, when the two sides changed the same lines, or when combining them would overwrite edits you haven't committed or files git doesn't track, and it names those files. If the ship fails afterwards, for example on a test, the combined commit stays, so the next try doesn't redo it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 With merge.autoStash=true, Git can stash overlapping uncommitted edits, advance the base branch, then restore the edits with conflicts.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 727,562
- Elapsed since build started: 18 min
- Changed lines: 82 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: ship's catch-up fast-forward and its merge of the ticket don't pass `--no-autostash` either: speck/ideas/2026-10-17-keep-merge-autostash-out-of-ship-s-merges.md.

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
    "reviewed_sha": "6fb51d74de31f84576ed7157ab49b75db66ede0f",
    "thread_id": "01a14920-5c6a-7040-80a3-19bbc8687380",
    "seconds": 22,
    "usage": {
      "input_tokens": 138280,
      "cached_input_tokens": 96896,
      "cache_write_input_tokens": 0,
      "output_tokens": 962,
      "reasoning_output_tokens": 207
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:10:41.520Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ship-remote.mjs remoteBaseCatchUp/mergeRemoteBase creates a two-parent merge and reports incoming commits. Both AC1 integration tests passed, including shipping and pushing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "mergeRemoteBase checks conflicts with merge-tree before updating the branch or checkout. The AC2 snapshot test passed."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The three AC3 tests passed for default Git settings, but ship-remote.mjs:36 inherits merge.autoStash, which bypasses the required refusal over overlapping local edits."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The remote merge precedes ship's rollback boundary. The AC4 test passed, verifying both merge parents remain on main after tests fail."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship-remote.mjs:36",
        "issue": "With merge.autoStash=true, Git can stash overlapping uncommitted edits, advance the base branch, then restore the edits with conflicts. This violates AC3's requirement to refuse with the branch, working tree and index unchanged. Git's installed merge documentation explicitly describes this behaviour; the tests only exercise default settings.",
        "suggested_fix": "Pass --no-autostash explicitly when applying this merge. Add a regression test enabling merge.autoStash with local edits overlapping a remote change, and verify refusal names the file and preserves the branch, working tree and index.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The normal merge, conflict refusal and failed-ship behaviour are covered by seven passing tests. One protection needs fixing: users with Git automatic stashing enabled could have their base branch advanced and local edits left conflicted instead of receiving a safe refusal."
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
    "reviewed_sha": "c62dad549d2c10e3791e80bf0fbf52a0d0a0703d",
    "thread_id": "01a14920-5c6a-7040-80a3-19bbc8687380",
    "seconds": 12,
    "usage": {
      "input_tokens": 231593,
      "cached_input_tokens": 181760,
      "cache_write_input_tokens": 0,
      "output_tokens": 1419,
      "reasoning_output_tokens": 207
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:21:32.437Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship-remote.mjs mergeRemoteBase creates a two-parent merge commit and reports incoming commits in one line. Both AC1 tests passed, verifying successful shipping and pushing with the base checked out or checked out nowhere."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "mergeRemoteBase checks conflicts using merge-tree before updating the branch or checkout. The passing AC2 test verifies refusal preserves branches, working trees and index."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "mergeRemoteBase now explicitly passes --no-autostash. Four passing AC3 tests cover preserving local edits and untracked files, refusing overlapping files with names and unchanged snapshots, and refusing safely with merge.autoStash=true."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/ship.mjs invokes remoteBaseCatchUp before recording the base for subsequent rollback. The passing AC4 test verifies the merge remains on the local base after shipping tests fail."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship-remote.mjs:36",
        "issue": "Git automatic stashing could previously bypass overwrite protection and leave local edits conflicted.",
        "suggested_fix": "Explicitly disable automatic stashing and cover the configured setting with a regression test. Both are now implemented; the regression test passed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Cleanly diverged base branches now merge automatically before shipping, while conflicts and obstructing local files cause a safe refusal. The automatic-stashing issue is fixed, all eight tests passed, and no blocking findings remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "a1b883de2b4442266ee1c58548ada11840f64e98",
    "merge": true,
    "thread_id": "01a14920-5c6a-7040-80a3-19bbc8687380",
    "seconds": 12,
    "usage": {
      "input_tokens": 353405,
      "cached_input_tokens": 288768,
      "cache_write_input_tokens": 0,
      "output_tokens": 1903,
      "reasoning_output_tokens": 207
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:25:59.730Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship-remote.mjs mergeRemoteBase still creates a two-parent merge and reports incoming commits in one line. Both AC1 tests passed, checking successful shipping and pushing with and without a checked-out base branch."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "mergeRemoteBase checks conflicts with merge-tree before changing the branch or checkout. The AC2 snapshot test and the updated conflicting-divergence test in test/ship.test.mjs passed; the latter retains its preservation assertions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The merge explicitly uses --no-autostash. All four AC3 tests passed, covering preservation of edits and untracked files, named refusals for obstructing files, unchanged snapshots, and merge.autoStash=true."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/ship.mjs still merges the remote before recording the base used for rollback. The AC4 test passed, verifying the merge commit remains after shipping tests fail."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship-remote.mjs:36",
        "issue": "Git automatic stashing could previously bypass overwrite protection and leave local edits conflicted.",
        "suggested_fix": "Implemented: --no-autostash remains explicit, and the passing regression test verifies safe refusal with merge.autoStash enabled.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge retains the approved behaviour. The test updates correctly accommodate automatic merging and the new temporary-file cleanup requirement without weakening assertions. All 39 tests in the three reviewed files passed; no blocking findings remain."
  }
}
```

</details>

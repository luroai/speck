---
id: "0046"
title: "Stop a refused ship from wiping uncommitted changes"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
type: bug                # blank, or bug
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T15:41:25.661Z"
finished: "2026-10-09T16:31:11.408Z"

---
# 0046 · Stop a refused ship from wiping uncommitted changes

**Status:** ✅ done

## Problem
`speck ship` checks that the base branch's checkout is clean, then runs the tests (over a minute here) before it merges. If anything edits a tracked file in that checkout during the tests and the merge then fails, ship's undo runs `git reset --hard` there and silently throws the edit away. On 9 October this wiped an uncommitted `speck/product.md` edit three times while 0045 tried to ship, and each failure was reported as a "conflict", which hid the real cause.

## Outcome
A refused ship never discards changes it didn't make, and says plainly when your own uncommitted changes are what's in the way.

## Acceptance criteria
1. If the base branch's checkout has uncommitted changes to tracked files when ship is about to merge (for example, made while the tests ran), ship refuses before merging, names those files, and leaves them exactly as they were, content and staged state alike. Nothing is shipped and both branches are as they were.
2. When a merge fails for any other reason, any uncommitted change that was in the base checkout or the ticket's worktree just before the merge is still there, unchanged, after ship's undo.
3. A merge that fails because it would overwrite local changes is reported as that, naming the files, not as a conflict. A real conflict is still reported as a conflict, naming the conflicting files.
4. Every existing ship refusal and its exit code is unchanged, and a ship that succeeds behaves as it does now.

## Out of scope
- Resolving conflicts or retrying the ship (0048).
- Untracked files, which ship already handles by naming them.

## Notes
- Data loss, so risk is high.
- The undo is in `shipTicket` in `scripts/speck.mjs` (`git reset -q --hard baseSha` in the base checkout, and `branchSha` in the ticket's worktree).
- A test can make the edit happen at the right moment by setting `commands.test` to a command that edits a tracked file in the base checkout.
- No external facts: everything is in this repo.
- Git refuses any merge over staged changes in the base checkout, so AC2's staged state is tested in the ticket's worktree; the base checkout's case is tested with unstaged changes.
- Self-check: without a worktree, a change that stops ship switching to the base branch now undoes the ship commit, keeping the change, instead of leaving the ship commit on the branch; and the fallback that saves changes to git's stash, when they can't go back in place, got a test.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 On a failed checkout without a worktree, reset --keep preserves working content but resets the index.; F2 The snapshot is taken before remote catch-up.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 737,156
- Elapsed since build started: 13 min
- Changed lines: 73 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: ship's own commit runs `git commit` after staging only the ticket, so anything the test run staged in the ticket's worktree goes into the ship commit too. It should commit only the ticket's paths.
- Follow-up idea: without a worktree, tests that leave tracked files changed now refuse the ship (AC1), where before they were carried onto the base branch. Worth a line in the ship skill's refusal guide.

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
    "reviewed_sha": "ce5db0073e42b3789f1452e3630faa0c37d60666",
    "thread_id": "01a1215a-919f-7c70-8dd8-44e4b631d38a",
    "seconds": 56,
    "usage": {
      "input_tokens": 266312,
      "cached_input_tokens": 190464,
      "cache_write_input_tokens": 0,
      "output_tokens": 1435,
      "reasoning_output_tokens": 295
    },
    "saved_at": "2026-10-09T15:50:01.983Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket checks changedFiles after tests and before the ship commit. The two AC1 tests exercise real Git checkouts and verify content, staged state, branch positions and approved status."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The preservation snapshot at scripts/speck.mjs:1308 precedes the remote catch-up, rather than the actual ticket merge. Changes introduced by the catch-up's post-merge hook are absent from that snapshot and are discarded by undo's hard reset. Existing AC2 tests introduce changes before the snapshot."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "listedIn/refused distinguish overwrite refusals, and shipTicket collects unmerged paths before undo. AC3 tests exercise local-change refusals during both catch-up and ticket merge; the conflict test verifies the conflicting filename."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Existing refusal checks and exit handling remain intact. The supplied passing suite includes existing ship refusal, remote, worktree and success tests; the new AC4 test covers successful shipping with and without a worktree. Tests were inspected but not rerun in this read-only review."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:1301",
        "issue": "On a failed checkout without a worktree, reset --keep preserves working content but resets the index. A post-commit hook that stages notes.txt and modifies shared.txt so checkout refuses therefore loses notes.txt's staged state. The self-check test covers only an unstaged edit. If an edit overlaps the ship commit itself, reset --keep can also refuse, leaving the ship commit in place.",
        "suggested_fix": "Preserve working content and index before attempting checkout, and use a rollback that restores both while undoing the ship commit. Add failed-checkout tests with staged and partially staged changes, including an edit to the moved ticket.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs:1308",
        "issue": "The snapshot is taken before remote catch-up. A successful fast-forward can run a post-merge hook that edits a tracked file in either checkout. If the subsequent ticket merge conflicts, undo hard-resets both folders and restores only the earlier snapshot, silently deleting that edit even though it existed immediately before the ticket merge.",
        "suggested_fix": "Capture and preserve changes introduced during catch-up before attempting the ticket merge, retaining the original branch positions for rollback. Add a regression test where remote catch-up's post-merge hook edits a tracked file and the ticket merge then conflicts; verify content and staged state survive.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The updated claim that failed merges restore all tracked uncommitted changes is not yet true for changes introduced during remote catch-up."
    },
    "escalation_question": "",
    "summary": "The change protects edits made while tests run and improves refusal messages. The tests exercise real behaviour, but two rollback gaps remain: a failed branch switch can lose staged state, and edits made during remote catch-up can still be deleted. These need fixing before merge."
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
    "reviewed_sha": "e6e3f31136429640141d7eeb8de394f703892b37",
    "thread_id": "01a1215a-919f-7c70-8dd8-44e4b631d38a",
    "seconds": 26,
    "usage": {
      "input_tokens": 467280,
      "cached_input_tokens": 364416,
      "cache_write_input_tokens": 0,
      "output_tokens": 2129,
      "reasoning_output_tokens": 295
    },
    "saved_at": "2026-10-09T15:53:51.362Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket checks changedFiles after tests, before committing or merging. Both AC1 tests verify refusal, filenames, preserved content and staged state, and unchanged branches."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipTicket snapshots both folders before merging and refreshes the snapshots after remote catch-up; undo restores them with --index. AC2 conflict tests and the new F2 regression verify preserved edits and staged state in both folders. Failed-checkout regressions cover staged changes and stash recovery."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "refused identifies local-change overwrite messages separately from conflicts; conflicting paths are collected before undo. AC3 tests cover overwrite refusals during catch-up and ticket merge, and the conflict test checks the filename."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Existing refusal checks and exit handling remain intact. Existing ship regression tests and the AC4 success test pass in the supplied 268-test output. Tests were inspected but not rerun during this read-only review."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Failed checkout previously lost staged state or could leave the ship commit in place.",
        "suggested_fix": "Completed: snapshot before checkout, undo the ship commit, and restore with --index or save the changes in the stash. Two new regression tests exercise these paths.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Changes introduced during remote catch-up were missing from the rollback snapshot.",
        "suggested_fix": "Completed: refresh both snapshots after successful catch-up. The new post-merge-hook regression verifies content and staged state survive a subsequent conflict.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The shipping description matches the implemented preservation, refusal messages and documented stash fallback."
    },
    "escalation_question": "",
    "summary": "Both rollback gaps are fixed and covered by meaningful regression tests. Refused shipping preserves edits and staged state, names files that block the merge, and provides stash recovery instructions when changes cannot be restored in place. All 268 supplied tests pass; no blocking findings remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "36c000d59d58e35e8c3eacc112245ee3d016bd20",
    "thread_id": "01a1215a-919f-7c70-8dd8-44e4b631d38a",
    "seconds": 28,
    "usage": {
      "input_tokens": 772038,
      "cached_input_tokens": 515968,
      "cache_write_input_tokens": 0,
      "output_tokens": 2823,
      "reasoning_output_tokens": 295
    },
    "saved_at": "2026-10-09T16:27:33.756Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket's post-test changedFiles check is unchanged from round 2. Both AC1 tests pass on the merged result, verifying named files, content, staged state and unchanged branches."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The reviewed snapshot and undo code is unchanged. AC2 tests and F1/F2 regressions pass, covering both folders, staged changes, failed checkout, remote catch-up and stash recovery."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Overwrite detection and conflict-file reporting remain unchanged. AC3 overwrite tests and the conflict-filename test pass on the merged result."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Shipping code and tests have no diff against the round-2 commit. Existing refusal, exit-code, remote and worktree regressions and AC4 success tests pass in the supplied 291-test run. Tests were not rerun during this read-only review."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Failed checkout previously lost staged state or could leave the ship commit in place.",
        "suggested_fix": "Resolved by the preserved snapshot and index restoration; both regression tests remain intact and pass after the merge.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Changes introduced during remote catch-up were missing from the rollback snapshot.",
        "suggested_fix": "Resolved by refreshing snapshots after catch-up; the post-merge-hook regression remains intact and passes.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The merged spec retains this ticket's shipping guarantees and stash fallback alongside main's panel capabilities. Removing the update-marker line matches main. The diff against main contains only this ticket's intended changes."
    },
    "escalation_question": "",
    "summary": "Approval stands after the merge. The reviewed shipping code and regression tests are unchanged, both earlier findings remain resolved, and the combined product description is accurate. All 291 supplied tests pass; no new blocking issues were found."
  }
}
```

</details>

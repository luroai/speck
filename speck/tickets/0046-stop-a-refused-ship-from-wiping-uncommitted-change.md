---
id: "0046"
title: "Stop a refused ship from wiping uncommitted changes"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0046 · Stop a refused ship from wiping uncommitted changes

**Status:** 🔍 reviewing

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
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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

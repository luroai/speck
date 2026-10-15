---
id: "0212"
title: "Recover a ship that was stopped partway"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0204"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T15:17:36.380Z"

---
# 0212 · Recover a ship that was stopped partway

**Status:** 🔍 reviewing

## Problem
To test a ticket merged with the base branch, `speck ship` moves the ticket's worktree onto the merged result and moves it back afterwards (0192). If the ship is killed in between, the worktree is left there, off the ticket's branch. The next ship then can't find the branch in any worktree, checks the main checkout instead and refuses with "You have uncommitted or untracked changes", and `speck run`'s queue waits for a new commit before trying again. On 2026-10-15 this held 0205 until it was put right by hand.

## Outcome
A ship that was stopped partway leaves nothing that stops the ticket's next ship, and the queue tries it again by itself.

## Acceptance criteria
1. When a ship is killed while the ticket's worktree is on the merged result, the next ship of that ticket, whoever starts it, first puts the worktree back on the ticket's branch, then ships as usual. Nothing committed on the branch is lost.
2. `speck run`'s queue tries a ticket again on its next check when its last ship was killed partway (its ship record has no end), without waiting for a new commit, and at most once per killed ship.
3. When a ticket's branch isn't checked out in its worktree and can't be put back, `speck ship` refuses with a message naming the ticket's worktree and saying how to fix it, never the "uncommitted or untracked changes" message about the main checkout.
4. A ship that isn't killed works as before, and the worktree is on the ticket's branch whenever a ship ends.
5. No test that passed before this change fails.

## Out of scope
- Ending a killed ship's tests (0174, shipped).
- What the panel shows for a failed push (0204).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- In `scripts/ship.mjs` the merged result is checked out detached in the ticket's worktree (around `git checkout -q --detach`), and `shipFolders()` falls back to the main checkout when no worktree has the branch. The queue's retry rule is in `scripts/ship-queue.mjs` (0193).
- Builds after 0204, which also changes `scripts/ship.mjs`.
- Failing before this build: none
- Self-check: no changes (checked a worktree whose folder is missing, a worktree on another branch or commit, a killed ship's merge git won't switch away from, and a ship killed again with nothing new; each has a test or keeps the old message).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

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
    "reviewed_sha": "2d19c8661b8e2f0cc122e19d732f1454642aa827",
    "thread_id": "01a14041-3eba-7cc3-8786-4af998e135ea",
    "seconds": 35,
    "usage": {
      "input_tokens": 105813,
      "cached_input_tokens": 62720,
      "cache_write_input_tokens": 0,
      "output_tokens": 1049,
      "reasoning_output_tokens": 253
    },
    "tests": {
      "failing": 0,
      "second_try": [
        "0177 AC3: answers within 1 second while a reading takes 5 seconds > 0177 AC3: while one reading takes 5 seconds, Stop build stops a running build within 1 second",
        "0177 AC3: answers within 1 second while a reading takes 5 seconds > 0177 AC3: while one reading takes 5 seconds, Ship ships an approved ticket, answering within 1 second",
        "0206 AC1 AC2: when opening the page itself is never answered, the 0149 test still ends its panel, and the others pass"
      ]
    },
    "saved_at": "2026-10-15T15:50:15.052Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipTicket calls putBranchBack before checking cleanliness. The AC1 tests exercise an actual SIGKILL, successful manual and automatic recovery, and preservation of branch ancestry."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ship-queue.mjs ended restores retry eligibility for an unfinished record and limits immediate retries by refs. The two AC2 tests exercise retry, repeated killing, new commits and ordinary refusal."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "shipFolders selects any detached worktree with the branch tip as its second parent before selecting the ticket's known worktree. An unrelated matching worktree can therefore bypass the required refusal for the ticket's actual worktree."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The ordinary success and failure paths have AC4 coverage, but shipFolders can now assign an unrelated detached worktree to linked, which shipTicket subsequently removes with --force."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied whole-suite output reports no remaining failures after rerunning three chance failures. Existing tests were not weakened in the diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship-folders.mjs",
        "issue": "shipFolders treats any detached merge whose second parent equals the ticket branch tip as the ticket's worktree, preferring it even over the known ticket worktree. That is also the shape of an ordinary merge made elsewhere. Shipping can consequently switch an unrelated worktree onto the ticket branch and then delete that worktree with git worktree remove --force, including its untracked files. It can also bypass the intended refusal when the actual ticket worktree is on another branch.",
        "suggested_fix": "Establish ownership before recovering or removing a worktree, using the known ticket path or persisted ship/worktree identity. Do not infer ownership solely from merge parents. Add a regression test with an unrelated detached merge worktree containing an untracked file, alongside the actual ticket worktree, and verify that the unrelated worktree and file remain untouched.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The tests cover recovery after a killed ship and automatic retries. However, recovery can mistake an unrelated worktree for the ticket's and forcibly delete it, including untracked files. Worktree ownership must be verified before this is ready to merge."
  }
}
```

</details>

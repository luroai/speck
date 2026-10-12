---
id: "0129"
title: "Count changed lines in a review pack from any checkout"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T18:43:49.832Z"

---
# 0129 · Count changed lines in a review pack from any checkout

**Status:** 🔍 reviewing

## Problem
`speck pack <id>` says "Changed lines: 0" whenever it's run from a checkout that isn't the ticket's branch, such as the base branch checkout when builds run in worktrees, or after the ticket has shipped. The user then reads a review pack that says nothing changed when plenty did (seen on speck-site ticket 0002: the pack says 0, its delivery log says 158).

## Outcome
The review pack reports the ticket's own changes, wherever it's run from, and never reports 0 because of where it's run.

## Acceptance criteria
1. Run from the base branch checkout while the ticket's branch exists (in its own worktree or not), `speck pack <id>` gives the changed-lines figure for the ticket's branch compared with the point where it left the base branch, excluding tests, lockfiles and `speck/` as today, and lists the sensitive files that branch touches.
2. Run from inside the ticket's own worktree, with its work committed, `speck pack <id>` gives the same changed-lines figure and sensitive files as in criterion 1.
3. For a ticket whose branch no longer exists (for example, shipped and tidied up), the pack shows the changed-lines figure from the ticket's delivery log and says it's the figure recorded at approval. If the delivery log has no figure, it says the count isn't available instead of showing a number.
4. When the ticket's branch no longer exists, the pack says it can't list the sensitive files touched, instead of saying none were touched.
5. No test that passed before this change fails.

## Out of scope
- The plain-English review pack: that's 0130 and 0131.
- Counting a shipped ticket's changes from git history.
- `speck diffstat`, which builds run inside the ticket's own worktree, where it counts correctly.

## Notes
- Cause: `changedLines` in `scripts/core.mjs` compares the current checkout's HEAD and working tree with the base branch, so from the base branch it measures nothing. Reproduced 2026-10-11 in speck-site: `speck pack 0002` on `main` prints "Changed lines (excluding tests and lockfiles): 0".
- The ticket's branch is found the same way `speck ship` finds it (`ticketBranch` in `scripts/ship.mjs`: `<branch_prefix><id>-…`).
- Failing before this build: none
- Built so the pack also reads the ticket (and its review rounds) from the ticket's branch when run elsewhere: the base branch's copy has no rounds until it ships, so without that the pack stops with "No review rounds recorded." before it reaches criterion 1's figure.
- Self-check: added a test that the base branch's own changes, merged into the ticket's branch, aren't counted as the ticket's (they weren't).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: run from outside the ticket's worktree, the pack counts only the branch's committed work, not uncommitted changes in that worktree (criterion 2 covers committed work).
- Follow-ups: none sent to the inbox.

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
    "reviewed_sha": "fa7acde115470d55fefa14eed87daea1710f38be",
    "thread_id": "01a13172-d146-7722-8476-5d94a6602534",
    "seconds": 38,
    "usage": {
      "input_tokens": 131855,
      "cached_input_tokens": 92800,
      "cache_write_input_tokens": 0,
      "output_tokens": 941,
      "reasoning_output_tokens": 124
    },
    "saved_at": "2026-10-12T18:50:08.983Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pack.mjs packSource reads the branch's ticket and branchChangedLines measures its committed changes. AC1 tests cover separate worktrees, an unchecked-out branch, base advances and merges."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "scripts/pack.mjs:43 uses changedLines inside the ticket worktree. After that branch is merged into base but retained, merge-base(base, HEAD) is HEAD, so committed changes disappear. The retained-branch test checks only the base checkout; the AC2 test checks only an unmerged branch."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "changeLines reads the delivery-log figure and labels it recorded at approval. Three AC3 tests exercise a recorded figure, no figure and a figure outside the delivery log."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "changeLines explicitly says sensitive files cannot be listed when the branch is absent. The AC4 test checks this and rejects the 'none touched' message."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0129-tests.txt totals: 1142 tests, 1139 passed, zero failed, three skipped. Existing tests were not modified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pack.mjs:43",
        "issue": "A merged but retained ticket branch reports different results depending on the checkout. From its own clean worktree, changedLines compares HEAD with itself and reports zero with no sensitive files; from base, branchChangedLines recovers the ticket's changes. This violates criterion 2 and preserves the original misleading behaviour for this case.",
        "suggested_fix": "Use the same branch comparison origin in both checkouts, while preserving any intended handling of uncommitted work. Extend the retained-branch merge test to compare the figure and sensitive files from both checkouts.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The pack now counts unmerged ticket branches from other checkouts and uses recorded figures after branch deletion. The reported suite passes, but a merged branch that is kept still reports zero from its own worktree. That checkout inconsistency needs fixing before merge."
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
    "reviewed_sha": "60a2f50f96536a9e416e565c925a8ca46010f130",
    "thread_id": "01a13172-d146-7722-8476-5d94a6602534",
    "seconds": 20,
    "usage": {
      "input_tokens": 219377,
      "cached_input_tokens": 173568,
      "cache_write_input_tokens": 0,
      "output_tokens": 1456,
      "reasoning_output_tokens": 124
    },
    "saved_at": "2026-10-12T18:52:01.209Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "packSource reads the branch's ticket and branchChangedLines counts its committed changes using forkPoint. Passing AC1 tests cover both worktree arrangements, base advances, merged base changes and a retained merged branch."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "packSource now passes the same forkPoint to changedLines inside the ticket worktree. The passing AC2 test compares both checkouts; the extended retained-branch test also compares their counts and sensitive files after merging."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "changeLines reads only the delivery log and labels its figure as recorded at approval. Passing AC3 tests cover a recorded figure, a missing figure and an unrelated figure elsewhere."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "changeLines explicitly reports that sensitive files cannot be listed after branch deletion. The passing AC4 test verifies this and rejects the 'none touched' message."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified updated /tmp/speck-0129-tests.txt: 1142 tests, 1139 passed, zero failed and three skipped. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pack.mjs:43",
        "issue": "The earlier checkout inconsistency for a merged but retained ticket branch is fixed: both paths now use forkPoint, and the regression test compares both the count and sensitive files.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The pack now reports the ticket's changes consistently from either checkout, including when its merged branch is retained. After branch deletion, it uses the approval record and clearly states what information is unavailable. All criteria pass, and the previous blocking issue is resolved."
  }
}
```

</details>

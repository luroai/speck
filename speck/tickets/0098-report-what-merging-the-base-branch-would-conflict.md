---
id: "0098"
title: "Report what merging the base branch would conflict on"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:13.481Z"

---
# 0098 · Report what merging the base branch would conflict on

**Status:** 🔍 reviewing

## Problem
To decide whether a conflict is safe to resolve without another review, the shipping agent needs to know what kind of conflict it is. Working that out by reading conflict markers is slow, and agents would each do it differently.

## Outcome
`speck merge-check <id>` reports, as JSON, whether merging the base branch into a ticket's branch would conflict, and what kind of conflict each file has, without changing anything.

## Acceptance criteria
1. `speck merge-check <id>` prints one JSON object and leaves the ticket's branch, worktree and index exactly as they were. It refuses plainly, changing nothing, when the ticket has no branch or its worktree has uncommitted changes.
2. A merge that would apply cleanly reports `"clean": true` and no files.
3. Each conflicted file is reported with one class: `added-lines` when, in every conflict in the file, both sides only added lines to what the base had; `lockfile` for a lockfile (as speck's size check recognises them); `ticket` for a file under `speck/`; otherwise `logic`.
4. For each file it also reports the number of conflicts and their line ranges in the merged file.

## Out of scope
- Resolving anything (0101).
- Merges into the base branch itself.

## Notes
- The same change made on both sides doesn't conflict in git, so it needs no class of its own.
- Built on `git merge-tree --write-tree` (git 2.38 or later), which merges in the object store only: no ref, worktree or index changes, though it can leave unreferenced objects for git's usual garbage collection.
- Class order when more than one fits: `lockfile`, then `ticket`, then `added-lines`, then `logic`. A lockfile is rebuilt rather than kept on both sides, and a file under `speck/` needs speck's own handling, however its lines conflict.
- Line ranges and counts come from the merge as `git merge` would write it in this repo (its own `merge.conflictStyle`), markers included. Classes come from a diff3 merge, which shows the base's lines: a conflict is added-lines when both sides keep every base line in it, in order. A file both sides added (no base version) or a conflict with no markers (deleted on one side, binary) is `logic`, with 1 conflict and no line ranges.
- Merges run in the branch's worktree when it has one (else where the command runs), since git reads `.gitattributes` from the checkout it runs in. Conflict markers are read at each file's `conflict-marker-size`, as `git check-attr` reports it there.
- Untracked files don't count as uncommitted changes, since the check reads only commits.
- Self-check: added a test for a missing base branch and for unrelated histories (both already refused plainly)

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
    "reviewed_sha": "ec20159dc3660c84bb8607c35ca031df945aa26f",
    "thread_id": "01a12753-38ad-7370-a728-c1ac09159aab",
    "seconds": 36,
    "usage": {
      "input_tokens": 476113,
      "cached_input_tokens": 376576,
      "cache_write_input_tokens": 0,
      "output_tokens": 1095,
      "reasoning_output_tokens": 148
    },
    "saved_at": "2026-10-10T19:39:23.462Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdMergeCheck uses merge-tree without updating refs or the index. AC1 integration tests check unchanged snapshots and refusals for missing branches and staged or unstaged changes; builder output reports these passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC1 AC2 clean-merge integration test checks clean:true and files:[] using real Git commits; builder output reports it passing."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "classify and integration tests cover the usual classes, but conflictsIn only recognises seven-character markers. With conflict-marker-size=9, added-lines conflicts are incorrectly classified as logic."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "conflictsIn hard-codes seven-character markers. A read-only parser check with two nine-character conflict blocks returned []; the report would therefore give one conflict and no ranges."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/merge-check.mjs:25",
        "issue": "The conflict parser ignores Git's conflict-marker-size attribute. A file using nine-character markers loses all its ranges, reports one conflict even when several exist, and can be incorrectly classified as logic. Existing tests only exercise the default marker size.",
        "suggested_fix": "Recognise the marker size Git uses for each file in both merge outputs. Add a real Git integration test with a committed .gitattributes conflict-marker-size setting, multiple added-lines conflicts, and assertions for classification, count and ranges.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The command reports ordinary merges without changing the checkout, and its tests exercise real Git behaviour. It needs one fix before merge: files using a custom conflict marker size receive incorrect conflict details. Tests were inspected; the full suite was not rerun in this read-only review."
  }
}
```

</details>

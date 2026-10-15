---
id: "0208"
title: "Catch a new build worktree's first ticket change at once"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-catch-a-new-build-worktree-s-first-ticket-change-at-once.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0206"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T15:06:31.257Z"

---
# 0208 · Catch a new build worktree's first ticket change at once

**Status:** 🔍 reviewing

## Problem
A ticket changed in a build's worktree straight after the worktree is made doesn't always reach the panel within a second: under load it can take up to 15 seconds. `speck start` writes a build's first status just after making its worktree, so the panel can show a new build late.

## Outcome
A ticket change in a new build's worktree reaches open pages within a second every time.

## Acceptance criteria
1. A ticket changed in a build's worktree within a second of the worktree being made reaches every open page's stream within 1 second, including when the worktree's `speck/tickets` folder appears while the panel is starting its watches.
2. After starting new watches, the panel looks at the board again once, so a change made before they started isn't missed.
3. Changes in worktrees that already existed reach open pages as they do today.
4. No test that passed before this change fails.

## Out of scope
- Sending only what changed (0188, shipped).
- The other tests that fail by chance (0207).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Likely cause (from 0187's ship, unconfirmed): the panel watches a folder that doesn't exist yet through its parent. If it appears between the panel's check and the watch starting, its creation is missed until the next look, every 5 seconds, and an edit in that gap shows only at the 15-second re-read.
- `scripts/board-feed.mjs`. Builds after 0206, which builds after 0198: both may change the test helpers in `test/support/panel.mjs` or `test/panel-0187.test.mjs`.
- Failing before this build: none (speck test reused the passing run from commit 315f9e6).
- Cause found: git makes a worktree's folder in `.git/worktrees` before writing its `gitdir` file, and only `gitdir` lists the worktree. A look in that gap watched nothing in the new worktree, and nothing watched changed again until the 5-second look, which started the watches but read nothing, so an edit showed at the 15-second re-read. The fix watches such a folder for its `gitdir`, and reads the board once after any look that starts new watches.
- Self-check: no changes

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
    "reviewed_sha": "e74e0325f863e20c335a6643df51be8eec2e7c05",
    "thread_id": "01a14020-354a-74e1-a150-837f70564645",
    "seconds": 38,
    "usage": {
      "input_tokens": 167080,
      "cached_input_tokens": 126720,
      "cache_write_input_tokens": 0,
      "output_tokens": 997,
      "reasoning_output_tokens": 192
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T15:14:12.514Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/board-feed.mjs: boardWatcher.wanted() still has a discovery race between worktreeList() and checking gitdir. The passing AC1 tests do not force this interleaving."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "boardWatcher.sync() calls changed() once after starting watches; the passing 0208 AC2 test checks both new-watch and no-new-watch cases."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0208 AC3 test exercises changes in an existing worktree and the main checkout; the stream broadcast mechanism remains unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0208-tests.txt confirms 1,938 passed, zero failed and three skipped. Existing tests were not modified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/board-feed.mjs",
        "issue": "wanted() lists worktrees before scanning their metadata directories. If gitdir appears after Git's listing has omitted the new worktree but before existsSync checks it, the worktree is absent from trees and its metadata directory is excluded from watching because gitdir now exists. When the parent directory's creation event triggered this sync, there need be no further parent event, leaving discovery until the five-second poll. The first status change can therefore still miss the one-second deadline.",
        "suggested_fix": "Watch metadata directories for worktrees not discovered in the listing even when gitdir already exists, and ensure discovery is retried after establishing those watches. Add a deterministic regression test that creates gitdir between worktreeList() and the metadata scan, then changes the ticket and verifies prompt delivery.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change fixes the tested startup gaps and the full suite passes. One timing gap remains: a worktree can become discoverable between two checks and receive neither kind of watch, so its first update can still arrive late. Add coverage and close that gap before merging."
  }
}
```

</details>

---
id: "0032"
title: "Document that builds can run in parallel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:52:06.864Z"

---
# 0032 · Document that builds can run in parallel

**Status:** 👍 approved

## Problem
`product.md` says builds run one ticket at a time and the brief lists parallel builds as out of scope, but with one worktree per build, running tickets in parallel is now how speck is used, and it's much faster. Nothing yet proves that tickets built side by side both ship cleanly.

## Outcome
The docs say several tickets can be built at once, and the tests show that parallel builds ship one after the other, with a conflict refused cleanly.

## Acceptance criteria
1. A test starts two tickets with `speck start`, each in its own worktree, gets both to `approved` with changes to different files, then ships the first and then the second. Both end up `done` and merged on the base branch, and both worktrees and branches are removed.
2. A test does the same with two tickets that change the same lines of one file. The second ship refuses with the existing "hit a conflict" error, and its ticket stays `approved`, with its branch, its worktree and the base branch exactly as they were before that ship.
3. `speck/product.md` no longer says builds run one ticket at a time. Its Known limits say several tickets can be built at once, each in its own worktree, that there's still no dependency scheduling, and that a ticket whose changes conflict with one shipped before it is refused at ship and must be rebuilt on the latest base branch.
4. `docs/brief.md` no longer lists running several tickets in parallel as out of scope. Dependency graphs stay out of scope.

## Out of scope
- Scheduling or starting builds automatically, or stopping two tickets that touch the same files from running together (planned for the panel's queue).
- Any change to how `speck ship` behaves. If either test shows parallel ships don't work, block with the failure rather than redesigning shipping here.

## Notes
- The conflict error's current text starts "Merging <branch> into <base> hit a conflict, so nothing was shipped".
- Independent of 0030 and 0031, so it can be built alongside 0030.
- No external facts beyond git, which the ship tests already use.
- The AC1 and AC2 tests passed before any change: `speck ship` already handles parallel builds, as the ticket expected, so no code changed. The AC3 and AC4 doc tests failed first.
- Self-check: no changes. The new Known limits claim that nothing orders builds by `after:` was checked against `scripts/speck.mjs`, which never reads that field.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 194,266
- Elapsed since build started: 4 min
- Changed lines: 2 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea (review F1, minor): in the 0032 AC1 test, the `merge-base --is-ancestor` assertion compares stdout, which is empty either way, so it can't fail. Assert the git exit status instead, ideally against the saved approval commit's hash. The other AC1 assertions already prove the merge.

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
    "reviewed_sha": "eb81ce0d9f6f59b666d2081b01fd5ffc4b629829",
    "thread_id": "01a1204d-d846-7f73-a7c2-44ea54d3a76e",
    "seconds": 40,
    "usage": {
      "input_tokens": 193474,
      "cached_input_tokens": 136960,
      "cache_write_input_tokens": 0,
      "output_tokens": 792,
      "reasoning_output_tokens": 47
    },
    "saved_at": "2026-10-09T10:56:14.944Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/speck.test.mjs: parallelRepo starts both ready tickets in separate worktrees. The 0032 AC1 test ships both, checks done status, merged file contents, branch deletion and worktree removal. Builder output reports it passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The 0032 AC2 test changes identical lines, verifies the conflict error, and compares branch hashes, checkout state and worktree count before and after refusal. It also checks the second ticket remains approved. shipTicket in scripts/speck.mjs aborts and resets both branches. Builder output reports the test passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "speck/product.md Known limits contains all required claims, exercised by the passing 0032 AC3 documentation test. The CLI has no dependency scheduling, and existing shipTicket rollback supports the conflict claim."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md removes parallel tickets from the v0.1 exclusions and retains dependency graphs. The 0032 AC4 test checks both statements and is reported passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "test/speck.test.mjs",
        "issue": "The AC1 ancestry assertion compares stdout with an empty string, but git merge-base --is-ancestor produces empty stdout for both success and failure. Because gIn discards exit status, this assertion cannot detect missing ancestry. Other assertions still establish the required merged contents and cleanup.",
        "suggested_fix": "Assert the Git command's exit status is zero, ideally using the saved approval commit hash.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The documentation accurately describes existing parallel worktree builds and sequential shipping. No shipping implementation changed."
    },
    "escalation_question": "",
    "summary": "The docs now explain that several tickets can be built at once. The new tests exercise successful sequential shipping and safe conflict refusal. All four criteria are met. One redundant test assertion should be strengthened. I inspected the repository and code; I did not rerun tests because they create files and this review is read-only."
  }
}
```

</details>

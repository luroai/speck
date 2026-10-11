---
id: "0116"
title: "Handle a ship that needs help inside the build"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T11:19:50.797Z"

---
# 0116 · Handle a ship that needs help inside the build

**Status:** 👍 approved

## Problem
0101 added the `speck-integrate` skill for a ship queue to start, but the queue (0102–0105) was cancelled when speck moved to one build at a time. Nothing starts the skill, so its handling of conflicts and of a failing base branch never runs.

## Outcome
`/speck-build` handles a ship that needs help itself, using `speck-integrate`'s steps, and the separate skill is gone.

## Acceptance criteria
1. When `speck ship <id> --auto` exits with 13 (a conflict), the build skill resolves it with `speck-integrate`'s steps: `speck merge-check`, resolving each file by its class, running the tests and a merge round before shipping again. After two merges that still conflict, it blocks the ticket with the files in its question, as today.
2. When it exits with 14 (the base branch's own tests fail), the build skill changes no code. It creates one fix ticket (`--type=fix`) describing the failure in plain words, unless an open fix ticket already covers it, sets it ready, then stops and tells the user, leaving its own ticket `approved`.
3. The build skill asks the user only when two tickets contradict each other or a merge round blocks, in plain words without git terms, with the options and its recommendation.
4. `speck init` no longer installs `speck-integrate`, and re-running it removes the copy an earlier version installed. The brief no longer describes the skill or the ship queue.
5. No test that passed before this change fails.

## Out of scope
- Shipping a simple merge without review (`speck/ideas/2026-10-11-ship-a-simple-merge-without-another-review.md`).

## Notes
- Assumption for AC2: the fix ticket is set ready without asking, so it builds next, ahead of everything else at priority 0. This fits "set them ready and walk away". The other choice is to leave it as a draft for you.
- Failing before this build: none
- Removing the skill retires the tests written for it: `test/integrate-0101.test.mjs` is deleted (its checks on the conflict, base-branch and asking steps now live, against the build skill, in `test/build-0116.test.mjs`), `test/core.test.mjs` counts 7 skills instead of 8, and `test/setup-0107.test.mjs` no longer skips `speck-integrate`. No other test changed.
- AC1 and AC3 together: blocking after two merges that still conflict is kept "as today", so the build skill names it as the one block besides the two reasons to ask in AC3, and its question is also in plain words without git terms.
- AC2: creating the fix ticket and setting it ready are the only things the build does in the main checkout after `speck start`; the Rules allow just that.
- Self-check: added a fallback when `speck set <fix-id> status ready` refuses (leave it draft and say so), the brief now says an open fix ticket already on its way is left alone, and pointed "ship again" at section 5 step 3 to avoid two step 3s.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Conflict step 2 sends contradictory changes directly to Asking the user while the merge still has unresolved files.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 358,978
- Elapsed since build started: 12 min
- Changed lines: 123 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups (Delivery log only, no inbox notes):
- Known limit: the skill steps are checked by text tests and one real git check of undoing a half-resolved merge; the exit-14 path with `worktrees: false` (switching the main checkout back to the base branch) is described but not exercised end to end.
- The 0.2.0 changelog doesn't mention that `speck-integrate` is gone; ticket 0106 is bringing the changelog up to date.

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
    "reviewed_sha": "64cd5088717e7cf13195e8cadb025ce298023956",
    "thread_id": "01a12ab9-509f-7c33-8806-468d20d32e8b",
    "seconds": 39,
    "usage": {
      "input_tokens": 122649,
      "cached_input_tokens": 73344,
      "cache_write_input_tokens": 0,
      "output_tokens": 1016,
      "reasoning_output_tokens": 167
    },
    "saved_at": "2026-10-11T11:29:49.458Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md, Conflict, specifies merge-check, all four file classes, tests, merge review and blocking after two unsuccessful merges. Corresponding AC1 tests in test/build-0116.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Base branch failing specifies no code changes, deduplication, creation of a fix ticket, setting eligible drafts ready and stopping with the original ticket approved. The corresponding AC2 instruction tests passed."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Asking the user specifies plain language, options and a recommendation, but requires committing while contradictory files can still be unresolved. The passing AC3 text tests do not check this failure."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/install.mjs, installTooling, removes retired skill directories and links. Passing AC4 tests exercise initial installation and removal of old copies and broken links, and check the brief."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0116-tests.txt: 1055 tests, 1052 passed, 3 skipped, zero failures. Changes to existing tests match the explicitly permitted retirement of speck-integrate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md",
        "issue": "Conflict step 2 sends contradictory changes directly to Asking the user while the merge still has unresolved files. Asking step 2 then requires committing the ticket and work in progress. Git refuses a commit with unresolved index entries, so this prescribed blocking path cannot complete without inventing a resolution to the very decision awaiting the user.",
        "suggested_fix": "Specify how to leave the unfinished merge safely before recording and committing the blocked question, without choosing either ticket's intent. Add a check covering this path rather than only checking that the blocking commands appear in the text.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The build now contains shipping recovery steps, and installation removes the retired skill. The recorded suite passes. One recovery path needs fixing: when two tickets contradict each other, the instructions attempt a commit that Git will refuse because the files remain unresolved."
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
    "reviewed_sha": "b6b0b3d825e36b0815f319c281ae18b3799cf266",
    "thread_id": "01a12ab9-509f-7c33-8806-468d20d32e8b",
    "seconds": 23,
    "usage": {
      "input_tokens": 233596,
      "cached_input_tokens": 175232,
      "cache_write_input_tokens": 0,
      "output_tokens": 1717,
      "reasoning_output_tokens": 167
    },
    "saved_at": "2026-10-11T11:31:50.296Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md, Conflict, specifies merge-check, resolution by file class, tests and a merge review before shipping again, and blocking with filenames after two unsuccessful merges. All four AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Base branch failing prohibits code changes, checks for an existing fix ticket, creates and readies an eligible draft without asking, and stops with the original ticket approved. Corresponding AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Asking the user specifies the permitted reasons, plain language, options and a recommendation. It now aborts an unfinished merge before committing the question and explains resumption. Both new F1 tests passed, including the real Git conflict-and-abort test."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/install.mjs, installTooling, removes speck-integrate from both installation folders. Passing AC4 tests cover installation, removal of old copies and broken links, and removal of skill and queue descriptions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0116-tests.txt: 1057 tests, 1054 passed, 3 skipped and zero failures. Existing test changes remain limited to the permitted retirement adjustments."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md",
        "issue": "The contradiction path previously required committing while merge conflicts remained unresolved.",
        "suggested_fix": "Abort the unfinished merge before recording and committing the blocked question, then restart resolution after the user's answer.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The build now handles shipping conflicts and failing base-branch tests itself, and installation removes the retired skill. The previously broken question path is fixed and covered by a real Git test. All criteria pass, with no remaining blocking findings."
  }
}
```

</details>

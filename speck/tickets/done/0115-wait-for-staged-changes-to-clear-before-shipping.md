---
id: "0115"
title: "Wait for staged changes to clear before shipping"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:49:41.018Z"
finished: "2026-10-11T11:03:02.489Z"

---
# 0115 · Wait for staged changes to clear before shipping

**Status:** ✅ done

## Problem
`speck ship` refuses when the base branch's checkout has staged changes, because git won't merge over a changed index. With one build at a time, the user is often partway through committing tickets on the base branch, so an approved ticket can fail to ship just because of when its build finished.

## Outcome
When staged changes in the base branch's checkout are all that stops a ship, `speck ship` waits for them to clear and then ships.

## Acceptance criteria
1. When staged changes are all that stops `speck ship`, it says once which files are staged and that it's waiting for them to be committed or unstaged. It then checks again at least every 10 seconds and ships as soon as they're gone.
2. It waits at most `ship_wait_minutes` (a new setting in the config template, default 30, which `speck config set` accepts as a whole number of at least 1). After that it refuses as it does today, changing nothing.
3. Uncommitted changes to a file the ticket also changes still refuse at once, as they do today.
4. While it waits, `speck ship` changes nothing in either checkout.

## Out of scope
- Refusing edits to a ticket that's being built (0114).

## Notes
- Assumption: 30 minutes as the default wait. Change it if you'd rather.
- Failing before this build: none
- The existing test in `test/ship-dirty.test.mjs` for staged changes now shortens the wait (SPECK_SHIP_MINUTE_MS) and still checks the same refusal, since ship now waits before refusing (AC2).
- Self-check: a commit made on the base branch while ship waited after the tests would have been reset away if the merge then failed (ship undid to the base commit it read before the tests), so ship now re-reads the base commit after the wait, with a test.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A staged rename of a file changed by the ticket is classified as unrelated.; F2 The waiting notice is emitted on every clash() invocation that needs to wait.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 2,535,057
- Elapsed since build started: 12 min
- Changed lines: 73 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox note):
  - When the ticket branch isn't checked out anywhere and the base branch is checked out in another worktree, ship switches the folder it ran from to the ticket branch before the tests. Killing ship during a wait after the tests (as during the tests themselves) leaves that folder on the ticket branch.
  - A wait after the tests says nothing new if one before the tests already said it was waiting, as AC1 asks; the shared budget still caps the total at `ship_wait_minutes`.

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
    "reviewed_sha": "a63c5dab2d5f72faf8e0000a4a7c463400ce5d9f",
    "thread_id": "01a12a9a-fccf-7b41-988a-c872bd72e5b3",
    "seconds": 43,
    "usage": {
      "input_tokens": 448937,
      "cached_input_tokens": 328832,
      "cache_write_input_tokens": 0,
      "output_tokens": 1077,
      "reasoning_output_tokens": 192
    },
    "saved_at": "2026-10-11T10:56:45.454Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/ship.mjs clash() polls every 2 seconds. The AC1 tests in test/ship-0115.test.mjs exercise committing and unstaging successfully, but clash() can print the waiting notice twice: before tests and again after tests introduce staged changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipWaitMinutes(), the shared waitLeft budget, templates/config.yml and scripts/config.mjs implement the default, timeout and validation. The AC2 integration tests cover timeout without changes, the default and accepted/rejected configuration values; all passed in the supplied output."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The AC3 tests cover ordinary edits, but changedFiles()/stagedFiles() retain a rename as 'shared.txt -> renamed.txt'. clash() compares that combined string with individual ticket paths, so a staged rename of shared.txt enters the wait instead of refusing immediately."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The polling status command uses --no-optional-locks and performs no writes. The AC4 test checks both checkout snapshots and index bytes/mtime during the wait; it passed in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs:107",
        "issue": "A staged rename of a file changed by the ticket is classified as unrelated. For example, renaming shared.txt to renamed.txt yields a combined porcelain path that never matches touched.has('shared.txt'), causing a potentially 30-minute wait where AC3 requires immediate refusal.",
        "suggested_fix": "Parse status paths reliably, including both source and destination of renames, preferably using NUL-delimited output. Add an integration test that stages a rename of a ticket-touched file and asserts immediate refusal without a waiting notice.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/ship.mjs:168",
        "issue": "The waiting notice is emitted on every clash() invocation that needs to wait. If initial staged changes clear and the tests then stage another unrelated file, one ship invocation prints the notice twice, contrary to AC1's explicit 'once' requirement.",
        "suggested_fix": "Track whether the notice has already been emitted across both checks. Add a test covering an initial wait followed by staged changes introduced during the tests, asserting one notice and the shared timeout budget.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main waiting and timeout paths are covered by realistic tests, and the supplied suite passed. Two edge cases need fixing: renaming a file the ticket changes waits instead of refusing immediately, and a single shipping attempt can repeat its waiting notice. Review was read-only; tests were inspected but not rerun."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "ae9f9428bc723d6faef0b6b9f44359f6f29f8071",
    "thread_id": "01a12a9a-fccf-7b41-988a-c872bd72e5b3",
    "seconds": 28,
    "usage": {
      "input_tokens": 852819,
      "cached_input_tokens": 648448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1823,
      "reasoning_output_tokens": 278
    },
    "saved_at": "2026-10-11T10:59:14.337Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship.mjs clash() polls every 2 seconds and shares the told flag across both checks. The commit, unstage and repeated-wait integration tests in test/ship-0115.test.mjs passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipWaitMinutes(), templates/config.yml and scripts/config.mjs retain the default 30, positive whole-number validation and shared wait budget. All AC2 integration tests passed in the supplied output."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "changes() now handles both rename paths, and the F1 rename regression test passed. However, clash() reads touched paths using newline-delimited git diff output, which quotes non-ASCII and special-character paths, whereas changes() now returns raw paths. Those paths therefore fail the overlap comparison."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "changes() uses git --no-optional-locks status and the wait loop performs no writes. The test checking both checkout snapshots and index bytes/mtime during waiting passed in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs:changes and clash",
        "issue": "The ordinary rename case is fixed, but path comparison remains incomplete. With Git's default core.quotePath, a ticket changing café.txt produces a quoted/escaped name in git diff --name-only, while status -z returns raw café.txt. A staged edit or rename involving that file is consequently treated as unrelated and waits instead of refusing immediately. The new raw status parsing also introduces this mismatch for ordinary non-ASCII filenames.",
        "suggested_fix": "Read the touched-file list with git diff --name-only -z and split on NUL, matching changes()'s raw paths. Add an integration test for a staged edit to a non-ASCII filename changed by the ticket, asserting immediate refusal and unchanged checkouts.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/ship.mjs:clash",
        "issue": "Resolved: the shared told flag prevents repeated waiting notices across the two clash() calls. The added repeated-wait integration test exercises the original failure and passed.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The repeated notice and ordinary rename problems are fixed, and the supplied suite has no failures. One filename edge case remains: staged edits to files with non-ASCII names can wait instead of refusing immediately. Use the same filename format for both sides of the comparison before merge. Tests were inspected but not rerun."
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
    "reviewed_sha": "79757678743649372b142772d221019cb4cef3f5",
    "thread_id": "01a12a9a-fccf-7b41-988a-c872bd72e5b3",
    "seconds": 62,
    "usage": {
      "input_tokens": 1227993,
      "cached_input_tokens": 864000,
      "cache_write_input_tokens": 0,
      "output_tokens": 2408,
      "reasoning_output_tokens": 278
    },
    "saved_at": "2026-10-11T11:01:53.161Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Shipping announces the staged files once, polls every two seconds and resumes when they are committed or unstaged. The repeated-wait regression passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The shared waiting budget uses ship_wait_minutes, defaults to 30 and refuses on expiry. Configuration accepts positive whole numbers; timeout and invalid-setting tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Overlapping changes refuse immediately. Both status and ticket-diff paths now use NUL delimiters, correctly handling renames and non-ASCII filenames; regression tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Waiting uses read-only Git queries with optional index locking disabled. Tests confirm both checkouts, including their index files, remain unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "Path parsing previously missed overlaps involving staged renames or quoted non-ASCII filenames.",
        "suggested_fix": "Read both status and ticket-diff paths with NUL delimiters and compare raw paths.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "Shipping previously repeated its waiting announcement when tests staged more changes after an earlier wait.",
        "suggested_fix": "Share the announcement flag across all waiting checks within one ship operation.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both earlier findings are fixed. Shipping waits for unrelated staged changes, refuses overlapping edits immediately and leaves both checkouts untouched while waiting. The supplied suite reports 1,034 passes, no failures and three skips."
  }
}
```

</details>

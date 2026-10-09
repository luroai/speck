---
id: "0017"
title: "Clean up the temporary repos the tests create"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:17:17.173Z"
finished: "2026-10-09T10:22:28.396Z"

---
# 0017 · Clean up the temporary repos the tests create

**Status:** ✅ done

## Problem
The test suite makes a temporary repo or folder for almost every test and never deletes it. Over a day of builds they piled up to about 8,600 folders and used every inode in `/tmp`, so the whole suite failed until they were removed by hand. Builds stall on something unrelated to the ticket.

## Outcome
Running the tests leaves nothing behind in the system temporary folder, whether tests pass or fail.

## Acceptance criteria
1. After `npm test` finishes, the system temporary folder holds no new files or folders created by the run (compare a listing taken before and after).
2. A test that fails still removes the temporary repos and folders it made.
3. If the run is killed part-way, it leaves behind at most the temporary folders of the tests that were running at that moment, not one per test run so far.
4. Every existing test still passes, and none is weakened or removed to get there.

## Out of scope
- Cleaning up folders left by earlier runs.
- Changing what any test checks.

## Notes
- Pre-check: no external facts. AC3 reworded so it's clear it's about a run killed mid-way.
- The temporary folders include fake tool folders (`speck-bin-…`, `speck-fake-…`) and bare remotes, not only repos.
- Approach: `test/support/tmp.mjs`, imported first by every test file, gives each test process its own `speck-test-…` folder, points `TMPDIR`/`TMP`/`TEMP` (so `os.tmpdir()` and every child process) at it, empties it after each test, and removes it on exit, SIGINT, SIGTERM and SIGHUP. A SIGKILL leaves that one folder with only the running test's files.
- Checked 2026-10-09: before the change one `npm test` run left 377 new entries in `/tmp`; after it, a before/after `ls -A /tmp` listing shows none.
- Self-check: no changes (checked failing tests, nested test-runner runs, SIGINT/SIGTERM/SIGKILL, and that no test relies on files kept between tests).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->
Round 1 (codex, gpt-6.1-sol): approved, no findings.

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Review rounds: 1
- Reviewer tokens: 180,177
- Elapsed: about 5 min
- Follow-up ideas: none from review. Folders left in `/tmp` by earlier runs (about 11,500 entries) still need removing by hand, as that is out of scope.

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
    "reviewed_sha": "8e148c4f3b92ea6c885da4c75e6364eb09ccfbf5",
    "thread_id": "01a1202e-2a0d-7c10-9be2-6305a157b46d",
    "seconds": 42,
    "usage": {
      "input_tokens": 179318,
      "cached_input_tokens": 125568,
      "cache_write_input_tokens": 0,
      "output_tokens": 859,
      "reasoning_output_tokens": 120
    },
    "saved_at": "2026-10-09T10:21:40.325Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/tmp.mjs redirects temporary paths and removes the run folder on exit. test/tmp-cleanup.test.mjs exercises a complete nested test run and verifies an empty temporary folder, and checks both test files import the helper first. The supplied npm test output reports all 141 tests passing; the ticket records a before/after system temporary folder comparison."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The 'AC1 AC2' cleanup test deliberately fails two fixture tests, checks the run exits unsuccessfully and verifies no temporary entries remain. It uses real filesystem operations and child processes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The SIGKILL test completes four fixture tests before killing a fifth, then verifies only one run folder remains containing the active test's files. test/support/tmp.mjs registers emptyRunTmp with afterEach."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The committed diff changes test/speck.test.mjs only by adding the helper import; no existing tests or assertions were removed or weakened. The supplied full-suite output reports 141 passes and no failures."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "Unchanged and still accurate: this change concerns the repository's test housekeeping and does not alter product capabilities."
    },
    "escalation_question": "",
    "summary": "The tests now clean up their temporary files after each test and when their process exits. Real failure and interruption tests cover the cleanup behaviour, and all existing tests remain intact and pass in the supplied results. No blocking issues found. I inspected the committed code; I did not rerun tests in the read-only environment."
  }
}
```

</details>

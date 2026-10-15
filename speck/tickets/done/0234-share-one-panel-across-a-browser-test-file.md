---
id: "0234"
title: "Share one panel across a browser test file"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-share-one-panel-across-a-browser-test-file.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0231"]               # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:33:39.940Z"
approved: "2026-10-15T22:45:48.244Z"
finished: "2026-10-15T22:53:31.191Z"

---
# 0234 · Share one panel across a browser test file

**Status:** ✅ done

## Problem
Each test in the real-browser test files makes a repo and starts a `speck panel` only to serve the page, about 0.6 s of its 1 s or so. Tried on `test/panel-0155.test.mjs` during 0198, sharing one panel took the file from about 25 s to 9 s with all 22 tests passing.

## Outcome
The real-browser test files whose page stub answers every request start one repo and one panel for the whole file.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. In `test/panel-0155.test.mjs` and `test/panel-0160.test.mjs`, one repo and one `speck panel` are started for the whole file and kept until it ends, instead of one for each test.
2. When the file ends, whether its tests passed or failed, that panel is stopped and its repo removed.
3. No test that passed before this change fails.

## Out of scope
- Other browser test files, whose page stubs don't answer every request.

## Notes
- The shared panel's repo needs a `speck-keep-*` folder, which `test/support/tmp.mjs` leaves alone between tests.
- Failing before this build: none
- Self-check: no changes

## In plain words
Nothing changes for someone using speck: this only makes speck's own test suite quicker. Two of the slowest test files, the ones that check the Build queue cards and the panel's header in a real browser, used to start a fresh copy of the panel for every check. They now start one and share it across the file, so together they took about 12 seconds in this build. To see it, run those two test files and compare their time with before. Worth keeping an eye on: a check added to either file that changes the shared panel's tickets would now affect the checks after it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Only the three ticket-related files were tested.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 351,771
- Elapsed since build started: 12 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Round 1 was sent only the ticket's own test files, as the review skill says, while the build skill says round 1 gets the whole suite's output. The reviewer asked for the whole suite. Skipped as an inbox note: ticket 0235 is already changing which tests each round runs.
  - Tidy-up: the other browser test files could share a panel too once their page stubs answer every request (out of scope here).

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
    "reviewed_sha": "ac87b589750c72ebea342ba4b79c4a32583340ec",
    "thread_id": "01a141b9-804d-7860-b828-534f3506420b",
    "seconds": 24,
    "usage": {
      "input_tokens": 132233,
      "cached_input_tokens": 103680,
      "cache_write_input_tokens": 0,
      "output_tokens": 861,
      "reasoning_output_tokens": 67
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:41:02.152Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both browser files call sharedPanel() from withPanel(). test/support/shared-panel.mjs caches the startup promise. The passing 0234 AC1 tests verify a shared pid, port and repo across sequential and concurrent calls, including survival between tests with tmp.mjs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The after() hook in test/support/shared-panel.mjs stops the panel and removes its repo. Both passing 0234 AC2 subprocess tests check that the process has stopped and the repo has disappeared after passing and deliberately failing test files."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "/tmp/speck-0234-tests.txt contains 45 passing tests from only panel-0155, panel-0160 and panel-0234. It provides no regression evidence for the remaining suite, including other callers of the modified panelRepo() helper."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "/tmp/speck-0234-tests.txt",
        "issue": "Only the three ticket-related files were tested. The review protocol requires fresh whole-suite output, and the supplied results cannot establish acceptance criterion 3.",
        "suggested_fix": "Run the full suite through speck test without --files, address any regressions caused by this change, and supply the complete results for review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The two browser test files now share a panel, and the lifecycle tests demonstrate cleanup after both passing and failing tests. The focused run passed all 45 tests. Approval needs a full-suite run to establish that existing tests still pass."
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
    "reviewed_sha": "9d431ce7b8c604636c10a39c49d36f9590c328db",
    "thread_id": "01a141b9-804d-7860-b828-534f3506420b",
    "seconds": 15,
    "usage": {
      "input_tokens": 217304,
      "cached_input_tokens": 185600,
      "cache_write_input_tokens": 0,
      "output_tokens": 1373,
      "reasoning_output_tokens": 67
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:45:33.575Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both browser files use sharedPanel(), whose cached startup promise shares one panel and repo. Passing 0234 AC1 tests verify identity across sequential and concurrent calls and survival between tests."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shared-panel.mjs registers an after() hook to stop the panel and remove its repo. Both 0234 AC2 subprocess tests pass, verifying cleanup after passing and failing test files."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0234-tests.txt: the full suite reports 2048 passed, 0 failed and 3 skipped. Implementation files are unchanged since round 1."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "/tmp/speck-0234-tests.txt",
        "issue": "Round 1 supplied only focused test results, leaving whole-suite regression coverage unverified.",
        "suggested_fix": "Provide fresh whole-suite results. Completed: 2048 passed, 0 failed and 3 skipped.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The two browser test files now share one panel each, with cleanup verified after both passing and failing tests. The full suite passes, resolving the remaining concern. Approved for the owner's merge decision."
  }
}
```

</details>

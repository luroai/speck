---
id: "0234"
title: "Share one panel across a browser test file"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0234 · Share one panel across a browser test file

**Status:** 🔍 reviewing

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

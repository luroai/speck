---
id: "0743"
title: "Steady the 0182 AC3 per-test time limit test"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-steady-the-0182-ac3-per-test-time-limit-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:12:02.998Z"

---
# 0743 · Steady the 0182 AC3 per-test time limit test

**Status:** 🔍 reviewing

## Problem
The 0182 AC3 test "Chromium has closed within 10 s of a test file finishing whose test timed out waiting on its page" gives its inner test 1.5 s, which also covers starting Chromium. On a busy machine Chromium can take longer to open, so the test can fail with no real fault and turn main red.

## Outcome
The 0182 AC3 per-test time limit test passes on a busy machine and still catches Chromium left running.

## Acceptance criteria
1. The test passes 10 runs out of 10 while the machine is under heavy load.
2. It still fails when Chromium really is left running after a test runs out of time.
3. No test that passed before this change fails.

## Out of scope
- The --test-timeout test, which 0723 steadied.

## Notes
- Failing before this build: none
- AC1 checked by hand: the test passed 10 runs out of 10 with 128 busy loops on 16 cores (load average 115 to 164).
- Self-check: no changes
- From 0723's own note; 0723 saw Chromium take over 1.5 s at a load average of 125.

## In plain words
Nothing changes in how speck behaves for someone using it. One of speck's own tests, which checks that the test browser is closed after a test runs out of time, could fail just because the machine was busy and the browser was slow to open. It now tries again with more time when that happens.

To see it: it passed 10 times out of 10 with the machine heavily loaded, and it still fails if the browser really is left running.

Worth watching: if the browser takes more than about 12 seconds to open, the test will still fail.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "29d19723ae00595d94d3220aefdca3ebb72190cc",
    "session": "fresh",
    "thread_id": "01a20fdd-128e-7671-abfb-04b2159f8577",
    "builder_response": "- Tests run: test/chromium-0723.test.mjs test/chromium-0743.test.mjs test/panel-0182.test.mjs (speck test --related, so the commands.checks files ran too)\n- AC1 was checked by hand as well, since a load test would be too heavy for the suite: the 0182 AC3 per-test time limit test passed 10 runs out of 10 with 128 busy loops on 16 cores (load average 115 to 164).\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 175558,
      "cached_input_tokens": 132096,
      "cache_write_input_tokens": 0,
      "output_tokens": 592,
      "reasoning_output_tokens": 26
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43462,
      "cached": 132096,
      "write": 0,
      "output": 592
    },
    "cost_usd": 0.1060536,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T23:21:37.761Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The ticket records 10/10 runs with 128 busy loops and load averages 115–164. test/chromium-0743.test.mjs AC1 also passed, exercising startup beyond 1.5 s and retrying with longer limits; allowingLonger checks cleanup before each retry."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/chromium-0743.test.mjs AC2 passed with real Chromium deliberately left running: it verifies the process remains, goneWithin10s rejects, and remaining processes are ended. The 0182 test uses the same helper and cleanup check."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "/tmp/speck-0743-tests.txt confirms 158 passed, zero failed and three skipped, including the changed 0182 test and existing 0723 tests. The extracted runOutOfTime implementation preserves its previous behaviour."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The test now allows more startup time when Chromium opens slowly, while checking cleanup before retrying. The recorded heavy-load runs passed, and a real leaked Chromium process still makes the check fail. No blocking concerns found."
  }
}
```

</details>

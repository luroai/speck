---
id: "0742"
title: "Steady the 0289 killed-Codex-build test's reads"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-24-steady-the-0289-killed-codex-build-test-s-reads.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:12:03.167Z"

---
# 0742 · Steady the 0289 killed-Codex-build test's reads

**Status:** 🔍 reviewing

## Problem
"0289 AC3: speck run resumes a killed Codex build in its own session" failed in 0711's related run with `Unexpected end of JSON input` on a busy machine, and passed again alone. Its fake `codex` writes each call's file with a plain write while the test reads the folder, so it can read a half-written file.

## Outcome
The 0289 test never reads a half-written call file.

## Acceptance criteria
1. The 0289 AC3 test passes 10 runs out of 10 while the machine is under heavy load.
2. It still fails when speck run doesn't resume the killed build in its own session.
3. No test that passed before this change fails.

## Out of scope
- Other tests with fake agents.

## Notes
- `calls()` and `read()` in `test/run-codex-0289.test.mjs`, about line 45; `until()` about line 174.
- Failing before this build: none
- AC1: 10 of 10 runs of the 0289 killed-build test passed with 48 busy loops on 16 CPUs (load average 55).
- AC2: with the session id taken out of `codexResumeArgv`, the 0289 killed-build test failed; the code was then put back.
- AC3: no test of its own; the related run and ship's suite check it.
- Self-check: no changes

## In plain words
Nothing changes for someone using speck. One of speck's own tests sometimes failed on a busy computer because it read a record before it had been fully written. The record now only appears once it is complete.

To see it for yourself, there is nothing to click: the check passed 10 times out of 10 while the computer was deliberately kept very busy. Worth keeping an eye on: a few other tests record things the same old way, and an idea for them is in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- The fake agents in other `speck run` tests still write their call files with a plain write. Saved as `speck/ideas/2026-11-24-write-the-other-fake-agents-call-files-whole.md`.

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
    "reviewed_sha": "1374b81a65c411757a8d1d2349f21350cec975ea",
    "session": "fresh",
    "thread_id": "01a20fd6-f40c-73d1-9797-9dfddf5f82f1",
    "builder_response": "- Tests run: test/run-codex-0742.test.mjs test/run-codex-0289.test.mjs, with --related (3 related files chosen): 163 tests, 160 pass, 0 fail, 3 skipped.\n- The fake `codex` and its helpers moved unchanged to test/support/fake-codex.mjs (it now also returns `out`); the one change is that a call file is written as `<n>.json.part` and renamed.\n- AC1 checked by hand: the 0289 killed-build test passed 10/10 with 48 busy loops on 16 CPUs.\n- AC2 checked by hand: with the session id removed from codexResumeArgv, that test failed; the code was then restored.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 88408,
      "cached_input_tokens": 52352,
      "cache_write_input_tokens": 0,
      "output_tokens": 533,
      "reasoning_output_tokens": 11
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 36056,
      "cached": 52352,
      "write": 0,
      "output": 533
    },
    "cost_usd": 0.0826772,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T23:14:52.551Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/fake-codex.mjs writes to .json.part and atomically renames it; calls() reads only .json files. The passing 0742 AC1 test interrupts an actual fake-process write halfway and verifies that calls() ignores it. Ticket notes record 10/10 killed-build runs under heavy load."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The unchanged killed-build integration test in test/run-codex-0289.test.mjs asserts the exact resume arguments including the original thread id, working folder and build UUID. Its pass is confirmed in /tmp/speck-0742-tests.txt. The builder also reports that removing the session id made this test fail."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded related run completed with 163 tests: 160 passed, three skipped and none failed. The diff changes only the affected fake's publication of call records and adds focused regression coverage; production code and other fake agents are unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The fake Codex now makes call records visible only after writing them completely, preventing partial JSON reads. Regression coverage checks interrupted writes, and the existing test still verifies that killed builds resume their original session. The recorded tests pass; no blocking concerns found."
  }
}
```

</details>

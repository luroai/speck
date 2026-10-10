---
id: "0109"
title: "Take turns running the test suite across builds"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T21:55:36.531Z"

---
# 0109 · Take turns running the test suite across builds

**Status:** 🔍 reviewing

## Problem
Builds run in parallel, and each one runs the project's whole test suite several times: before changing anything, after building and when shipping. Speck's own suite opens about 15 headless browsers at once and uses about 1.9 GB. On 2026-10-10, five builds reached their tests at the same moment and the machine ran out of memory, which killed every build and `speck run`. A project with a heavy suite will hit the same wall.

## Outcome
Builds keep working in parallel, but take turns running the full test suite, as many at a time as `max_parallel_tests` allows.

## Acceptance criteria
1. `speck test` runs the test command from `speck/config.yml` and exits with its exit code. When `max_parallel_tests` runs (default 1) are already going in this repo, from any of its worktrees, it waits, saying once what it's waiting for, and starts when one ends.
2. The test run in `speck ship` takes a turn in the same way.
3. The build and review skills run the tests with `speck test`, not the test command directly.
4. A turn held by a process that has died is freed, so a killed build can't hold up the others.
5. `max_parallel_tests` is in the config template, and `speck config set` accepts a whole number of 1 or more for it.

## Out of scope
- Running fewer test files at once inside speck's own suite.

## Notes
- Measured 2026-10-10: one run of speck's suite peaked at about 1.9 GB more memory, 123 Chromium processes and 99 Node processes, on a 16-core VM with 14 GB.
- No test that passed before this change should fail.
- Failing before this build: none
- Self-check: no changes. Known limits, left as they are: a turn file whose pid has been reused by another live process looks held until that process ends (the waiting message names the pid and folder); lowering `max_parallel_tests` while more runs are going doesn't stop the ones already running.

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
    "reviewed_sha": "f574fd177b81fd0ca7dfa015fc728c972a54d0c9",
    "thread_id": "01a127db-e5d6-7e53-8e5c-bd6a5f323e25",
    "seconds": 33,
    "usage": {
      "input_tokens": 303703,
      "cached_input_tokens": 196736,
      "cache_write_input_tokens": 0,
      "output_tokens": 1155,
      "reasoning_output_tokens": 208
    },
    "saved_at": "2026-10-10T22:08:38.183Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/turns.mjs withTestTurn/cmdTest implements command execution, exit codes and waiting; passing tests 858–863 cover normal operation. However, wrapper death and concurrent stale recovery can exceed the configured limit (F1, F2)."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "scripts/ship.mjs runTests uses withTestTurn, and passing test 864 exercises waiting before shipping. It inherits the concurrency defects in F1 and F2."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md and skills/speck-review/SKILL.md instruct full-suite runs through speck test; passing test 865 checks these instructions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/turns.mjs takeTurn reclaims dead-pid locks. Passing tests 866–868 exercise dead holders and death while waiting, though they do not kill an actual running speck test wrapper."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/config.yml defaults max_parallel_tests to 1; scripts/config.mjs registers it as count. Passing tests 869–871 exercise the template, accepted values and invalid-value refusal."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/turns.mjs:75",
        "issue": "The turn records the speck wrapper's pid, while cmdTest starts the suite in a child shell through spawnSync. Killing only the wrapper with SIGKILL leaves its test processes running on POSIX. Another waiter then treats the turn as stale and starts another suite, exceeding max_parallel_tests and recreating the memory-pressure problem. Existing death tests use fabricated locks held by sleep processes, so they miss this case.",
        "suggested_fix": "Ensure ownership remains valid while the actual suite is running, or reliably terminate the suite when its wrapper dies. Add an integration test that kills a running speck test wrapper while its child command remains active and verifies that another suite cannot overlap it.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/turns.mjs:51",
        "issue": "Stale recovery-file deletion is not atomic with its ownership check. Two waiters can both finish reading the same dead recovery file; one deletes it and a third process acquires a fresh recovery file, then the other waiter deletes that fresh file using its earlier check. Multiple processes can consequently enter recovery together. Their separate read(lock)/rmSync(lock) operations at line 55 can then delete a newly acquired live turn and allow overlapping suites.",
        "suggested_fix": "Use a recovery protocol that cannot unlink another process's newly acquired ownership, preferably an operating-system locking primitive. Add coverage for simultaneous recovery of both a stale turn and a stale recovery file, with controlled interleavings or repeated contention.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Normal test runs now take turns across worktrees, shipping uses the same queue, and the supplied suite reports no failures. Two gaps can still let heavy suites overlap after a process dies or during concurrent recovery. These need fixing before merge. Review was read-only; tests were inspected but not rerun."
  }
}
```

</details>

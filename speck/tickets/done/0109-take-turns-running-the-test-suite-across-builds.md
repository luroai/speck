---
id: "0109"
title: "Take turns running the test suite across builds"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
finished: "2026-10-10T22:30:32.796Z"

---
# 0109 · Take turns running the test suite across builds

**Status:** ✅ done

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
Round 1 (codex): changes requested: F1 The turn records the speck wrapper's pid, while cmdTest starts the suite in a child shell through spawnSync.; F2 Stale recovery-file deletion is not atomic with its ownership check.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,981,738
- Elapsed since build started: 33 min
- Changed lines: 180 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- A turn is held by the speck process or the shell running the tests. If that shell is killed on its own while the tests it started keep running, the turn is freed early.
- A claim whose pid has been reused by another live process looks held until that process ends. The waiting message names the pid and folder.
- Lowering `max_parallel_tests` doesn't stop runs already holding higher turns.
- A changelog line for `speck test` and `max_parallel_tests`: skipped as covered by ticket 0106 (bring the 0.2.0 changelog up to date).

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

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "16e93b77db1ab3c8fea4af2578824a7ad38ab0d7",
    "thread_id": "01a127db-e5d6-7e53-8e5c-bd6a5f323e25",
    "seconds": 26,
    "usage": {
      "input_tokens": 662606,
      "cached_input_tokens": 480896,
      "cache_write_input_tokens": 0,
      "output_tokens": 2068,
      "reasoning_output_tokens": 334
    },
    "saved_at": "2026-10-10T22:15:06.898Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/turns.mjs cmdTest/runTestsInTurn and passing tests 858–863 cover execution, exit codes, defaults and ordinary waiting across worktrees. F1 and F2 still allow overlapping suites beyond the limit."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "scripts/ship.mjs runTests calls runTestsInTurn; passing test 864 exercises shipping's wait. The shared implementation still has F1 and F2."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Build and review skills consistently prescribe speck test for full-suite runs. Test 865 passes and checks these instructions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "busy/takeTurn reclaim dead claims. Passing tests 866–868 exercise recovery; test 869 additionally verifies ownership survives wrapper death after the suite starts."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Config template defaults max_parallel_tests to 1, and scripts/config.mjs registers count validation. Tests 871–873 pass, exercising accepted and rejected values."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/turns.mjs:117",
        "issue": "The fix protects an orphaned suite only after its shell publishes its pid. If the wrapper dies after spawning but before that publication, a waiter can reclaim and delete the claim, then start its suite. The original shell subsequently publishes its pid and starts its suite without checking ownership, so both run. The builder acknowledges this window; test 869 kills the wrapper after the command has started and therefore does not exercise it.",
        "suggested_fix": "Make the child establish and validate ownership before it can execute the test command, using a protocol that remains safe if the parent dies during startup. Add a controlled test that pauses child startup before pid publication, kills the wrapper, lets a waiter acquire the turn, and then resumes the child.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/turns.mjs:60",
        "issue": "Generation numbers can reset because completed and older claims are deleted. A waiter A can read dead g0 and pause before linking g1. Waiter B takes g1, deletes g0, completes and deletes g1. Run C then takes g0 and starts. A resumes, successfully links g1 and sees no higher generation, so it starts alongside C: lower live claims are never checked. The contention test passes but does not force this interleaving, so the recovery race remains.",
        "suggested_fix": "Prevent generation reuse/reset while stale observations may exist, or replace this protocol with a locking mechanism that guarantees exclusive ownership. Add a deterministic test for a delayed stale claimant resuming after another run completes and a new lower-generation claim becomes active.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The fixes improve recovery, and the supplied suite reports 882 passing tests with no failures. Both earlier findings remain incomplete: startup after a killed wrapper and reuse of deleted generation numbers can still let heavy suites overlap. These need fixing before merge. Tests were inspected but not rerun."
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
    "reviewed_sha": "1b436b964651a41f0bb15b454557e42e8f8dbf34",
    "thread_id": "01a127db-e5d6-7e53-8e5c-bd6a5f323e25",
    "seconds": 60,
    "usage": {
      "input_tokens": 1009115,
      "cached_input_tokens": 493440,
      "cache_write_input_tokens": 0,
      "output_tokens": 3091,
      "reasoning_output_tokens": 640
    },
    "saved_at": "2026-10-10T22:28:35.968Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "speck test runs the configured command, preserves its exit code, shares turns across worktrees, defaults to one concurrent run and prints its waiting message once. Tests 858–863 pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Shipping uses runTestsInTurn for its test runs, sharing the same turn mechanism as speck test. Test 864 passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The build and review skills direct full-suite runs through speck test. Test 865 passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Dead claims can be reclaimed, surviving test shells retain their turns, and an atomic started-folder seal prevents a late shell from starting after takeover. Claim checks cover both lower and higher generations. Tests 866–874 pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The config template defaults max_parallel_tests to 1; config set and runtime validation require a whole number of at least 1. Tests 875–877 pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/turns.mjs",
        "issue": "Resolved: the shell and a recovering waiter compete atomically to create the started folder. A waiter that seals the run prevents its late shell from executing; a shell that starts first has already recorded its PID and retains the turn.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/turns.mjs",
        "issue": "Resolved: claimTurn withdraws its claim when any other claim is held, including a lower generation created after an outdated listing. The regression test exercises the previously unsafe interleaving.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both earlier findings are resolved, and all five acceptance criteria pass. The supplied suite reports 886 passing tests, three skipped and no failures. Code and tests were inspected; tests were not rerun in the read-only review environment."
  }
}
```

</details>

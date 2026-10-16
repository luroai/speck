---
id: "0218"
title: "End a build that ignores speck stop after five seconds"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-keep-speck-stop-s-five-second-wait-to-five-seconds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0217"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:48:31.383Z"
blocked_at: "2026-10-15T23:56:25.602Z"

---
# 0218 · End a build that ignores speck stop after five seconds

**Status:** ⛔ blocked

## Problem
`speck stop` asks each of a build's processes to end, then checks 50 times, 100 ms apart, before forcing them. Each check lists every process on the machine, which is slow on a busy one, so a process that ignores the request is forced after about 11 seconds rather than 5. Someone pressing Stop build waits twice as long as meant.

## Outcome
`speck stop` forces a process that ignores it to end about five seconds after asking.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a build's process ignores the request to end, `speck stop` forces it to end no later than 6 seconds after first asking, even when each check of the running processes takes 200 ms or more.
2. A process that ends when asked isn't forced, and `speck stop` returns as soon as all the build's processes have ended, as today.
3. No test that passed before this change fails.

## Out of scope
- Making each check of the running processes faster.

## Notes
- The wait is the loop in `endBuild()` in `scripts/run.mjs`, which counts checks rather than time.
- Seen while timing `test/stop-0072.test.mjs` in 0198: its `speck stop` took about 11 s.
- Failing before this build: none
- Self-check: the five seconds are timed with a monotonic clock, so a change to the system clock can't shorten or stretch the wait.
- Answered 2026-10-16 (blocked question): (a). Accept F2 as it is: when every check of the running processes takes over 5 seconds, a build that ends when asked still waits the 5 seconds and is sent a force-end it no longer needs. (b) is saved as an inbox idea. `max_review_rounds` was raised to 4 for this one more round, and goes back to 3 afterwards.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->
The reviewer approved the five-second limit and its tests, but hit the 3-round limit on one case: when every check of the running processes takes over 5 seconds (a very busy machine), a build process that ends as soon as it's asked can't be seen to have ended, so speck stop still waits the full 5 seconds and sends it a force-end it no longer needs. Should I (a) accept this as it is, since it's never slower than today (today such a stop waits for each slow check, longer than 5 seconds) and a force-end sent to a process that has gone does nothing, or (b) add a quick check of just the build's known processes alongside the slow full check, so stop returns as soon as they've ended (about 20 more lines)? I recommend (a), with (b) saved as a follow-up idea.

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
    "reviewed_sha": "ba33441ff3a3b646e9530d634fa603bb572cccc9",
    "thread_id": "01a141f9-5629-7f80-a4d0-ae84ba7034a9",
    "seconds": 30,
    "usage": {
      "input_tokens": 121113,
      "cached_input_tokens": 83712,
      "cache_write_input_tokens": 0,
      "output_tokens": 1081,
      "reasoning_output_tokens": 188
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:50:51.334Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/run.mjs:endBuild checks the deadline before pausing and calling left(), whose synchronous process listings can overrun it. With 2,000 ms listings, the loop sends SIGKILL 6,300 ms after SIGTERM, even ignoring buildProcesses() overhead. Tests cover only 200 and 450 ms listings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing '0218 AC2' test exercises a real child that exits on SIGTERM, checks that SIGKILL was never sent, and checks prompt return. endBuild exits its wait when no processes remain."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The full recorded output confirms all 14 tests passed across stop-time-0218.test.mjs and stop-0072.test.mjs. The change is confined to the stop loop and its test seams; the whole-suite check remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "The six-second limit still depends on how long the synchronous process checks take. A check started just before the five-second deadline must finish before SIGKILL can be sent. For example, 2,000 ms listings produce checks ending 2,100, 4,200 and 6,300 ms after the initial request, exceeding AC1. Additional process discovery in buildProcesses() can extend this further.",
        "suggested_fix": "Make deadline enforcement independent of blocking process discovery, so known surviving processes can be forced within six seconds even while a listing is slow. Add a regression test with 2,000 ms listings and account for the process discovery work as well as runningPids().",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change improves the usual stop time and preserves graceful shutdown, with all 14 recorded tests passing. However, sufficiently slow process checks can still push forced shutdown beyond the promised six seconds. That timing gap needs fixing before approval. Independent execution was limited by the sandbox denying ps."
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
    "reviewed_sha": "7c6fb0b9c57d640765992bcda8682750c3439310",
    "thread_id": "01a141f9-5629-7f80-a4d0-ae84ba7034a9",
    "seconds": 17,
    "usage": {
      "input_tokens": 201145,
      "cached_input_tokens": 159744,
      "cache_write_input_tokens": 0,
      "output_tokens": 1802,
      "reasoning_output_tokens": 188
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:51:51.517Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/run.mjs:endBuild predicts the next check's duration from the previous check. A 200 ms initial check followed by a 6,500 ms check delays SIGKILL until at least 6,600 ms after SIGTERM. The five passing timing tests use constant listing durations and do not exercise this case."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "endBuild now sleeps until the deadline without checking again when the previous check was slow. With a 6,500 ms initial check, a process that exits immediately on SIGTERM still causes the full five-second wait and a SIGKILL attempt against its stale PID. The passing AC2 test covers only 200 ms listings."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded run reports all 16 tests passing across stop-time-0218.test.mjs and stop-0072.test.mjs. Whole-suite regression verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "The fix handles constant slow checks but still cannot enforce the deadline when a check becomes slower. The builder acknowledges this limitation, which remains within AC1: checks taking 200 ms or more need not take identical amounts of time. Making checks faster is separate from preventing them from blocking deadline enforcement.",
        "suggested_fix": "Make deadline enforcement independent of synchronous process discovery. Add a regression with a 200 ms initial check followed by a 6,500 ms check, asserting forced shutdown within six seconds of SIGTERM.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "The new prediction branch stops checking for graceful completion and sleeps until the deadline. After a sufficiently slow initial check, even a process that exits immediately when asked incurs the full five-second wait and receives a SIGKILL attempt using the stale running-process list. This regresses AC2.",
        "suggested_fix": "Continue detecting graceful completion while enforcing the deadline independently. Add an AC2 regression with a slow initial listing that verifies prompt return and no SIGKILL attempt after the child exits on SIGTERM.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "All 16 recorded tests pass, but the revised approach still misses the deadline when checks become slower. It also introduces a full five-second wait for some processes that exit immediately when asked. Both behaviours need fixing before approval."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "78aaef8b0d6eb78134fe4f4fbe2422c7878ee638",
    "thread_id": "01a141f9-5629-7f80-a4d0-ae84ba7034a9",
    "seconds": 20,
    "usage": {
      "input_tokens": 296722,
      "cached_input_tokens": 246528,
      "cache_write_input_tokens": 0,
      "output_tokens": 2587,
      "reasoning_output_tokens": 317
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:56:10.869Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs:checkBuild bounds discovery with spawnSync's timeout and SIGKILL. endBuild passes the remaining deadline to each check. Passing tests cover constant and varying slow checks, and a real check's timeout."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "If the first check exceeds five seconds, endBuild retains the held PID list and sends SIGKILL at the deadline even when those processes exited on SIGTERM. The AC2 tests cover 200 ms and 2,000 ms checks, but omit the previously identified 6,500 ms case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded targeted run reports 120 tests passing with no failures, including the stop integration tests and affected panel tests. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "Previously, synchronous discovery could overrun the forced-shutdown deadline. Discovery now runs in a separate process with a timeout covering the whole check.",
        "suggested_fix": "No further change required for F1.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "Graceful completion is still mishandled when discovery cannot finish before the deadline. A process that exits immediately on SIGTERM incurs the five-second wait and a SIGKILL attempt against its stale PID. Moving discovery into a timed subprocess fixes F1 but does not resolve this AC2 regression.",
        "suggested_fix": "Provide a bounded way to detect completion of known processes while discovery is slow, and avoid forcing processes already gone. Restore the missing AC2 regression with a 6,500 ms initial discovery check, asserting prompt completion and no SIGKILL attempt.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The forced-shutdown deadline is now protected from slow process checks, and all 120 recorded tests pass. One issue remains: a process that exits normally can still cause a five-second wait and an unnecessary forced-shutdown attempt when discovery is slow."
  }
}
```

</details>

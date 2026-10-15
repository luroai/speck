---
id: "0218"
title: "End a build that ignores speck stop after five seconds"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0218 · End a build that ignores speck stop after five seconds

**Status:** 🔍 reviewing

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

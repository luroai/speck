---
id: "0047"
title: "Don't relaunch a build that's still running when speck run restarts"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
type: bug                # blank, or bug
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T15:41:09.690Z"

---
# 0047 · Don't relaunch a build that's still running when speck run restarts

**Status:** 👍 approved

## Problem
`speck run` only knows about the builds it launched itself. If it's restarted while a build it launched seconds earlier hasn't yet set its ticket to `building`, the new `speck run` sees the ticket as `ready` and launches it again, so two agents build the same ticket. That happened to 0040 on 9 October. A build left running across a restart also never gets its exit recorded, so the panel can't flag it if it finishes without shipping (0045).

## Outcome
A restarted `speck run` leaves builds that are still running alone, keeps track of them, and records when they stop.

## Acceptance criteria
1. `speck run` doesn't launch a ticket whose `speck/.cache/runs/<id>.json` has a `pid` that's still running and no `exited`, even while the ticket is still `ready`. It prints once that the ticket is already being built, with the session and pid.
2. Such a build counts towards `max_parallel_builds` while it runs.
3. `speck run` checks such a build on every poll. When its process has gone, it adds `exited` (the time it noticed) and `exit_code: null` to the run file, keeping the other fields, and prints a line saying the build stopped.
4. If that build left its ticket `ready`, `speck run` reports it as it does for its own builds, with the last five lines of the log, and doesn't launch it again.
5. A run file whose `pid` isn't running and has no `exited` gets `exited` and `exit_code: null` added when `speck run` starts, and then the ticket is treated as it is now.

## Out of scope
- Telling apart a reused process id from the original build.
- The panel (0045 already reads `exited`).

## Notes
- `exit_code` is `null` here because a process that isn't a child can't be waited on for its code.
- No external facts: everything is in this repo.
- The shared `speck run` test helpers moved from `test/run.test.mjs` to `test/support/run.mjs`, so this ticket's tests live in `test/run-0047.test.mjs`.
- Self-check: a run file with no `session` printed "session undefined"; it now prints "session unknown" (test added).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 185,492
- Elapsed since build started: 7 min
- Changed lines: 47 (limit 5000)
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
    "reviewed_sha": "71281fdf77b9a4ee639bfdec92e1433dc2de6a71",
    "thread_id": "01a12158-fb35-73d0-8c61-6c33bc56c57f",
    "seconds": 33,
    "usage": {
      "input_tokens": 184761,
      "cached_input_tokens": 118912,
      "cache_write_input_tokens": 0,
      "output_tokens": 731,
      "reasoning_output_tokens": 52
    },
    "saved_at": "2026-10-09T15:47:54.907Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: adoptEarlierBuilds marks live recorded builds as launched and prints their session and pid once. test/run-0047.test.mjs AC1 exercises a ready ticket across several polls; builder output reports it passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "adoptEarlierBuilds adds live builds to running, which tick uses for the concurrency limit. The AC2 test verifies another ticket waits until the adopted process stops; reported passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "tick calls checkAdopted on every poll; stopped processes are recorded through recordExit with null code and a timestamp, preserving existing fields. The AC3 test verifies these fields and the stopped message; reported passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "checkAdopted calls reportIfStillReady and retains the ticket in launched. The AC4 test verifies the last five log lines and no relaunch after subsequent polls; reported passing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "adoptEarlierBuilds records exits for dead or missing pids without adding those tickets to launched. AC5 tests verify startup recording, preservation of fields, normal ready-ticket launching, and unchanged completed or malformed records; reported passing."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The updated description matches adoption, concurrency accounting, exit recording and the explicit limitation concerning reused process ids."
    },
    "escalation_question": "",
    "summary": "The change prevents duplicate builds after a runner restart, counts surviving builds towards the limit, and records when they stop. All five criteria have meaningful tests, reported passing in the supplied output. Repository inspection found no blocking issues or unrelated changes. Tests were not rerun because this review environment is read-only."
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
    "reviewed_sha": "7511d62cf1358a6e9294800f611c826737f95c02",
    "thread_id": "01a12158-fb35-73d0-8c61-6c33bc56c57f",
    "seconds": 23,
    "usage": {
      "input_tokens": 416367,
      "cached_input_tokens": 298240,
      "cache_write_input_tokens": 0,
      "output_tokens": 1285,
      "reasoning_output_tokens": 52
    },
    "saved_at": "2026-10-09T16:27:30.978Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs adoptEarlierBuilds remains unchanged after the merge: live recorded builds enter launched and running, with one session/pid message. test/run-0047.test.mjs AC1 verifies no duplicate launch across polls; merged-suite output reports pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "adoptEarlierBuilds adds adopted builds to running; tick enforces max_parallel_builds using running.size. AC2 verifies another ticket waits until the adopted build stops; merged-suite output reports pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "tick invokes checkAdopted every poll. It records stopped processes through recordExit with the detection timestamp and exit_code null, preserving other fields, and prints the stopped message. AC3 exercises these behaviours; merged-suite output reports pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "checkAdopted calls reportIfStillReady and leaves the adopted ticket in launched. AC4 verifies exactly the last five log lines and no subsequent relaunch; merged-suite output reports pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "adoptEarlierBuilds records dead or missing pids at startup without marking those tickets launched. AC5 verifies preserved fields, null exit codes, normal ready-ticket launching and unchanged completed or malformed records; merged-suite output reports pass."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The merge preserves all 0047 capability and limitation descriptions. Removing the update marker matches main. The imported panel changes do not alter the runner or its status-data contract."
    },
    "escalation_question": "",
    "summary": "Approval stands after the merge. The runner implementation and its tests are unchanged, and all five acceptance criteria remain satisfied. The supplied merged-suite output reports 285 passing tests. No integration problems were found; tests were not rerun in this read-only review environment."
  }
}
```

</details>

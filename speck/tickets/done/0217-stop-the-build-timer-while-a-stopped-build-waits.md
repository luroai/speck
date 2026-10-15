---
id: "0217"
title: "Stop the build timer while a stopped build waits"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-stop-the-build-timer-while-a-stopped-build-waits.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0214"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:34:36.098Z"
approved: "2026-10-15T23:46:49.015Z"
finished: "2026-10-15T23:48:18.656Z"

---
# 0217 · Stop the build timer while a stopped build waits

**Status:** ✅ done

## Problem
When a build stops or exits before finishing while its ticket is still building or reviewing, the Build queue says so but the ticket's timer keeps counting, and the wait ends up in its shipped minutes. Nobody is building the ticket then, so this counts time spent waiting for the user, which 0166 removed for blocked and paused tickets.

## Outcome
A stopped build's waiting time is left out of its build time, as blocked and paused time are.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. While the Build queue shows a ticket as "Build stopped before finishing", its timer shows the time up to when the build exited (less waiting time, as today) and doesn't count up.
2. While it shows a ticket as "Build stopped unexpectedly", its timer stops at the time speck first noticed the build had stopped and doesn't count up. That time is recorded, so the timer shows the same after a page reload or a panel restart.
3. When the ticket's build starts again (speck run resuming it, or a new build of it), its timer counts on from where it stopped: the stretch from the stop to the new start is left out of the timer, of the time to approval and of its shipped minutes.
4. A ticket whose build is running, blocked or paused is timed as today, and no test that passed before this change fails.

## Out of scope
- Showing how long a stopped build has been waiting.

## Notes
- The panel's timer stops at `held_at` (`templates/panel.html`), which today covers approved, blocked and paused tickets. Waiting time is added up in `waited_seconds` (0166, `waitFields()` in `scripts/core.mjs`).
- An exited build's run record has its exit time (`exited`, shown as `build_exit.at`). A killed build has no time recorded today, only a dead process (`buildKilled()` in `scripts/run.mjs`), so speck needs to record when it noticed.
- Failing before this build: none
- Self-check: no changes (added a test that a stopped time which can't be written to the ticket says so, changes nothing and is counted by the next start).
- Resumes happen in `resumeKilled()` in `scripts/run.mjs` (which writes `resumed`), on hand-back, and by hand.

## In plain words
When a build stops before it finishes, its ticket's timer in the Build queue now stops too, instead of counting the time it sits waiting for you. For a build that ended on its own, the timer stops at the moment it ended. For one that was killed, it stops at the moment speck first noticed, and stays there after you reload the page or restart the panel. When the ticket's build starts again, whether Auto-build resumes it or you run `/speck-build` for it, the timer carries on from where it stopped, and the time spent waiting is left out of its shipped minutes.

To see it, stop a build part way through (for example by closing the terminal it runs in). Its row says it stopped, and its timer no longer counts up.

Worth keeping an eye on: if you resume a stopped build's session yourself and it never goes through the build steps again, speck doesn't know it has started again, so its row stays shown as stopped.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Manual resumption of a killed build fails to exclude its waiting time, even when the resumed builder runs speck start.; F2 The ticket's waited_seconds is committed before the counted marker is saved, and marker-write failure is silently ignored.
Round 2 (codex): approve.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,013,751
- Elapsed since build started: 12 min
- Changed lines: 94 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Know when a stopped build starts again: a session resumed by hand that never runs `speck start` isn't counted as a new start. `speck status` text still says a killed build stopped after `/speck-build` has started it again in a new session, and `speck run` may resume the old session too. Saved to `speck/ideas/2026-10-15-know-when-a-stopped-build-starts-again.md`.
  - Known limit: between a hand-resumed session starting and it running `speck start`, the panel's timer counts on without that stretch left out. It drops back once `speck start` counts it.
  - 0219 also changes `speck start` (`cmdStart`), so the two may clash when merged.

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
    "reviewed_sha": "ed58fecf33eaab1f8b8f98184a914eb37c3628a0",
    "thread_id": "01a141f0-ac8a-7e63-920b-19ac1ddb2440",
    "seconds": 45,
    "usage": {
      "input_tokens": 209727,
      "cached_input_tokens": 156544,
      "cache_write_input_tokens": 0,
      "output_tokens": 1691,
      "reasoning_output_tokens": 382
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:41:39.262Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel holds the timer at build_exit.at. The passing AC1 tests exercise building and reviewing tickets, including timer ticks and existing waited_seconds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/stop-wait.mjs buildStop persists the first observation in a session/pid-specific marker. Passing AC2 tests cover persistence across processes, rejection of an earlier marker and a frozen panel timer."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "countStop loses the saved stop when a killed session is already running through claude --resume, because buildStop requires buildKilled to remain true. A failed counted-marker write can also subtract the same wait repeatedly. The passing tests miss both paths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests cover live processes, blocked and paused timer precedence, and avoiding killed-build markers for blocked or approved tickets. All 13 supplied tests passed; the changes show no separate regression in these behaviours."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/stop-wait.mjs:31",
        "issue": "Manual resumption of a killed build fails to exclude its waiting time, even when the resumed builder runs speck start. buildStop calls buildKilled before reading the saved stop time; scripts/run.mjs buildKilled returns null when sessionInUse sees claude --resume <session>. Consequently countStop returns without adding waited_seconds. The manual-resume test never starts a process naming the session, so it misses the actual supported resume path.",
        "suggested_fix": "Allow restart accounting to consume a matching saved stop marker after the session becomes active, independently of current killed-build detection. Add a test with an active process naming the resumed session, then run speck start and verify the saved wait is excluded exactly once.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/stop-wait.mjs:55",
        "issue": "The ticket's waited_seconds is committed before the counted marker is saved, and marker-write failure is silently ignored. If the runs directory cannot accept that write, the stop remains uncounted while its wait has already been subtracted. Another speck start subtracts the same stretch again, corrupting the timer and eventual shipped minutes.",
        "suggested_fix": "Make accounting durably idempotent across marker-write failures and interruptions between the ticket commit and marker save. Add a failure-path test that prevents the counted marker being saved, retries the start, and verifies waiting time is subtracted only once.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The stopped timers and saved stop times work in the tested cases. Restart accounting needs fixes: manually resuming a killed build can still count its waiting time, and a failed marker save can subtract waiting time repeatedly. All 13 tests passed, but they miss these cases."
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
    "reviewed_sha": "04a803d224dc2f467cabb239273f0625a0d6b445",
    "thread_id": "01a141f0-ac8a-7e63-920b-19ac1ddb2440",
    "seconds": 25,
    "usage": {
      "input_tokens": 330286,
      "cached_input_tokens": 267008,
      "cache_write_input_tokens": 0,
      "output_tokens": 2700,
      "reasoning_output_tokens": 667
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:43:23.504Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel holds the timer at build_exit.at. Passing AC1 tests cover building and reviewing tickets, subtract existing waiting time and verify that timer ticks leave the displayed time unchanged."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/stop-wait.mjs buildStop persists the first observation in a session/pid-specific marker. Passing AC2 tests cover persistence across processes, rejection of an earlier build's marker and a frozen panel timer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "countStop consumes saved waiting time through speck start and speck run's resumeKilled. The new passing test exercises an active manually resumed session, repeated starts and detection of its next stop. Other passing tests cover automatic resumption, approval and shipped-time calculations, and write-failure retries without duplicate subtraction."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests cover running builds, blocked and paused timer precedence, and avoiding stop markers for blocked or approved tickets. All 15 reported tests passed; inspection found no additional regression in these behaviours."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/stop-wait.mjs",
        "issue": "Manual resumption previously prevented countStop from recovering the saved stop time because the session was already active.",
        "suggested_fix": "Implemented: restart accounting can consume a matching saved stop while the resumed session is active. The regression test exercises this path and verifies subsequent stop detection.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/stop-wait.mjs",
        "issue": "Failure to save the counted marker previously allowed retries to subtract the same waiting interval repeatedly.",
        "suggested_fix": "Implemented: update the marker before committing waiting time, add nothing when that update fails, and restore the marker after a ticket-write failure. Passing tests cover both failure paths and retries.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Stopped builds now freeze their timers, retain their stop times and exclude waiting time when resumed. Both previous issues are fixed, with regression tests covering them. All 15 reported tests passed, and no blocking findings remain."
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
    "reviewed_sha": "8a64dedfa93d7b14cace66bd06ba7466287073e7",
    "thread_id": "01a141f0-ac8a-7e63-920b-19ac1ddb2440",
    "seconds": 16,
    "usage": {
      "input_tokens": 465991,
      "cached_input_tokens": 394496,
      "cache_write_input_tokens": 0,
      "output_tokens": 3356,
      "reasoning_output_tokens": 667
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:46:45.739Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel still holds the timer at build_exit.at. Passing AC1 tests cover building and reviewing tickets, existing waiting time and unchanged timer ticks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/stop-wait.mjs buildStop still persists the first observation against the build's session and pid. Passing AC2 tests cover persistence across processes, stale-marker rejection and a frozen timer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Restart accounting is unchanged since round 2. Passing tests cover automatic and manual resumption, counting the interval once, subsequent stop detection, write-failure retries, approval time and shipped minutes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests cover running, blocked and paused builds. test/support/heavy.mjs now correctly lists the new test file because it calls startRun. The existing 0233 completeness test remains unchanged. All 22 reported tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/stop-wait.mjs",
        "issue": "Manual resumption previously prevented recovery of the saved stop time once the session became active.",
        "suggested_fix": "Fixed in round 2: restart accounting consumes the matching saved stop while the resumed session is active. Its regression test still passes.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/stop-wait.mjs",
        "issue": "A failed counted-marker write previously allowed retries to subtract the same waiting interval repeatedly.",
        "suggested_fix": "Fixed in round 2: update the marker before committing waiting time and restore it after ticket-write failure. Failure-path and retry tests still pass.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The timer changes remain approved. This round correctly registers the new process-starting test in the suite's required list without weakening any checks. All 22 reported tests passed, and both earlier findings remain resolved."
  }
}
```

</details>

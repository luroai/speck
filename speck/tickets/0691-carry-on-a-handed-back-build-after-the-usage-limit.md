---
id: "0691"
title: "Carry on a handed-back build after the usage limit"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-carry-on-a-handed-back-build-after-the-usage-limit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:05:12.659Z"
approved: "2026-11-15T21:40:16.707Z"

---
# 0691 · Carry on a handed-back build after the usage limit

**Status:** 👍 approved

## Problem
When a build that was handed back on an approved ticket, for example to resolve a merge, stops on an agent's usage limit before it sets the ticket reviewing, speck run doesn't carry it on after the reset, as it does for a ticket that's ready, building or reviewing. The ticket then moves only when its next ship is refused, which spends another of its hand-backs, and while you're away it can sit for days.

## Outcome
A handed-back build that stopped on a usage limit is carried on after the reset, like any other build.

## Acceptance criteria
1. An approved ticket whose handed-back build stopped on a usage limit before setting it reviewing is resumed by speck run once the limit has reset, in the same session, as a ready, building or reviewing ticket's build is.
2. Resuming it doesn't count as another hand-back, and the ticket keeps the hand-backs it had left.
3. While the build waits for the reset, the ship queue doesn't ship or hand back the ticket again.
4. No test that passed before this change fails.

## Out of scope
- Moving the handed-back build to another agent on the bench while the limit holds.

## Notes
- Failing before this build: none
- Self-check: no changes
- From 0622, which leaves approved tickets alone so a ship can't race a resumed build. Whether the hand-back stays in the run record until the session has got past the limit is the builder's choice.
- speck (2026-11-15 21:38 UTC) told you: The build is slow, not stuck. Its first test run hit the 10-minute limit while waiting behind two other builds' test runs. The retry passed all 217 tests, and the build is now fixing an ordering problem the reviewer found in the ship queue. Why: The log shows the timed-out test run and the passing retry, the machine's load average has stayed around 52 to 59 for the last 15 minutes, and no test failed or hung.

## In plain words
When speck run hands an approved ticket back to its build, for example to sort out a clash with other shipped work, and that build runs out of the agent's usage allowance partway, speck run now picks it up again by itself once the allowance resets, as it already does for other builds. It doesn't count as another hand-back, so the ticket keeps its remaining tries, and speck won't try to ship it while it waits or while the build is finishing. You'll see the ticket waiting on the usage limit on the board, then its build running again after the reset. One thing to watch: if a handed-back build hits the limit right after finishing its work, the ticket still waits for the reset before it ships.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 On the reset tick, limits.check removes the approved ticket from limitWaiting and starts its build.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 266,790
- Elapsed since build started: 35 min
- Changed lines: 13 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Moving a handed-back build to another agent while its limit holds: speck/ideas/2026-11-15-move-a-handed-back-build-to-another-agent-while-its-limit-holds.md.
  - Known limit: an approved ticket counts as waiting whenever its run record has `handed_back`, so a handed-back build that re-approves the ticket and then hits the limit in its last reply holds the ticket's ship until the reset, then is resumed with nothing left to do.
  - The `--related` run had 8 timing failures in slow tests (panel and speck run starting late) at load average ~90 from other builds; they passed when run again on their own.

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
    "reviewed_sha": "4e97e7ea147b2ac0959ed056af25fae1647fe69a",
    "session": "fresh",
    "thread_id": "01a1e122-3bdf-7181-945b-292a2313088d",
    "builder_response": "- Tests run: test/usage-limit-0691.test.mjs test/panel-0161.test.mjs test/panel-0543.test.mjs test/run-codex-0289.test.mjs test/run-cursor-0290.test.mjs test/run-settings-0549.test.mjs test/usage-limit-0622.test.mjs\n- The `--related` run (22 files) had 8 timing failures (panel/speck run starting late) with load average ~90 from other builds; the same files passed when run alone on this branch and on main, and the run above (the ticket's own file plus every file that failed) passes in full.\n- Approach: an approved ticket counts as \"in hand\" for the usage-limit queue when its run record has a valid `handed_back` time (only a hand-back resumes a build on an approved ticket). The limit's `builds` list then holds it, `check` resumes it with the usage-limit message via `carryOn` (which keeps `hand_backs` and `handed_back` as they are), and the hand-back queue's `waiting(id)` is also true while the ticket is in that list, so the ship queue (and the pull request queue) neither ships nor hands it back meanwhile. Moving it to another agent (`moveOn`) still uses the old list: out of scope.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 173965,
      "cached_input_tokens": 131456,
      "cache_write_input_tokens": 0,
      "output_tokens": 924,
      "reasoning_output_tokens": 54
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 42509,
      "cached": 131456,
      "write": 0,
      "output": 924
    },
    "cost_usd": 0.1074036,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:35:19.044Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "usageLimitQueue.ended/checkAgent now accept approved tickets with a valid handed_back timestamp. Passing 0691 AC1 tests exercise reset timing and resuming the original session."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "carryOn preserves handed_back and hand_backs. Passing 0691 AC2 test checks both values remain unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "handBackQueue.waiting includes limitWaiting; passing 0691 AC3 test verifies shipping and hand-backs are held while awaiting reset."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Reported tests pass, but the newly enabled approved-ticket resume introduces a shipping race in run.mjs: limits.check(tickets) resumes the build before ships.check(tickets) receives the same stale ticket snapshot."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs:439",
        "issue": "On the reset tick, limits.check removes the approved ticket from limitWaiting and starts its build. Immediately afterwards, ships.check receives the ticket snapshot read before that start, where build_running is still false. handBackQueue.waiting is now false too. If the base or ticket branch has moved since the refused ship, the queue can launch shipping while the resumed build is working. The new test stops just before exercising this sequence.",
        "suggested_fix": "Keep shipping guarded by the current running builds, or refresh the ticket state after resuming builds. Add a regression test that checks the ship queue immediately after resumption using the pre-resumption snapshot, with changed refs making the ticket eligible for another ship.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change resumes the original build after the usage limit resets and preserves its remaining hand-backs. Waiting tickets are protected from shipping, but shipping can race the build on the tick when it resumes. Fix that race before merging."
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
    "reviewed_sha": "ffeec868c03fc013deea4f24bf5ca189730bee17",
    "session": "continued",
    "thread_id": "01a1e122-3bdf-7181-945b-292a2313088d",
    "builder_response": "- Tests run: test/usage-limit-0691.test.mjs test/usage-limit-0622.test.mjs test/run-0194.test.mjs test/changes-0356.test.mjs test/private-words-0506.test.mjs test/foreman-0285.test.mjs\n- F1: fixed. `handBackQueue`'s `waiting(id)` (scripts/hand-back.mjs) is now also true while speck run's `running` set has the ticket, so on the check that resumes the build, `ships.check` (and `prs.check`) skip it even though the tickets they're given were read before it started. New test \"0691 AC3: on the check that resumes it, the ship queue doesn't ship it from tickets read before the build started\" resumes the build, then runs a ship queue that has never tried the ticket (so it would ship it, as with moved refs) on the stale snapshot: nothing launches; once the build has ended, it ships. The earlier AC3 test now checks it still waits while the resumed build runs, and not after. It also fixes the test's `launch` stand-in, which took the repo as the id.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 265381,
      "cached_input_tokens": 218496,
      "cache_write_input_tokens": 0,
      "output_tokens": 1409,
      "reasoning_output_tokens": 54
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4376,
      "cached": 87040,
      "write": 0,
      "output": 485
    },
    "cost_usd": 0.022306,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:39:57.359Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/usage-limit.mjs: inHand, ended and checkAgent accept approved handed-back builds and resume them after reset. Passing AC1 tests verify reset timing, original-session resumption and exclusion of finished or blocked tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/usage-limit.mjs: carryOn preserves the hand-back fields. Passing AC2 test verifies hand_backs and handed_back remain unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/hand-back.mjs: waiting now checks both limitWaiting and running. Both passing AC3 tests exercise the actual queues, including shipping with the stale ticket snapshot immediately after resumption."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported round tests passed: 243 passed, 3 skipped, no failures. The regression test covers the previously identified shipping race; no further regression found in the reviewed changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/hand-back.mjs:156",
        "issue": "Shipping could race the resumed build because the runner passed a ticket snapshot read before resumption.",
        "suggested_fix": "Completed: waiting checks the current running set, and a regression test verifies shipping stays paused until the resumed build ends.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Handed-back builds now resume in their original session after the usage limit resets, without spending another hand-back. Shipping stays paused while they wait and while the resumed build runs. The earlier race is fixed, and all reported tests pass."
  }
}
```

</details>

---
id: "0630"
title: "Let speck run check the full suite on the base branch after ships"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0629"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T10:17:59.098Z"
approved: "2026-11-11T10:32:21.831Z"

---
# 0630 · Let speck run check the full suite on the base branch after ships

**Status:** 👍 approved

## Problem
`speck ship` runs the whole of `commands.test` before every merge, so a project with a slow suite, such as speck's own with about 200 real-browser and real-process test files, ships one ticket every four minutes at best, and a flaky slow test refuses ships that broke nothing. A project can't ship on its quick tests today without losing the slow ones altogether.

## Outcome
With `commands.test_full` set, `speck run` runs it on the base branch after ships, and a failure reaches you, so `commands.test` can be the quick tests that ships wait for.

## Acceptance criteria
1. With `commands.test_full` set and `speck run` on, whenever the base branch's newest commit has no recorded `commands.test_full` result and none is running, `speck run` runs `commands.test_full` on that commit, in a checkout of its own rather than the user's or a build's, taking a test turn as `speck test` does, and records its result as `speck test` records one.
2. While the latest recorded full run on the base branch failed, and until a run on a newer commit passes, `speck status` and the panel's black bar count it under Needs you, naming the failing tests when the output is TAP, and `speck run`'s log says so once per failing commit.
3. `speck ship` and builds never run `commands.test_full`, and a failing or running full run doesn't hold up a ship or a build.
4. With `commands.test_full` blank or missing, `speck run` runs no full suite and nothing changes from today.
5. `speck config set commands.test_full "<command>"` sets it, and `speck config show` explains what it does.

## Out of scope
- Raising a fix ticket for a failing full run by itself: it reaches you, and Virgil's own steps for it can come later.
- Changing speck's own `commands.test`: 0631 does that.

## Notes
- From the 2026-11-10 repo analysis: ships take a median of about 220 s, nearly all of it the suite, and about a quarter of tickets needed more than one ship attempt.
- `scripts/results.mjs` (`testRun`, recorded results keyed by code and test command) and the test turns in `scripts/turns.mjs` already exist; a recorded full run on the base branch also gives builds' "Failing before this build" a better baseline.
- `scripts/run.mjs` is at 592 lines against the 600-line limit, so new code needs its own module.
- Failing before this build: none
- Self-check: a full run that can't start called back before its pid was known, which would have thrown; fixed, with a test. A result found recorded for the newest commit wasn't kept as the latest, so the next commit fell back to an older run's; fixed. Tests added for a folder that isn't speck's at the full run's checkout and for the brief's facts.
- Pictures: none, because nothing anyone sees changes shape: the bar already shows Needs you <n>, and speck status gains one line.

## In plain words
You can now give speck a second, slower test command, the full suite, with `speck config set commands.test_full "<command>"`. Ships then wait only for the quick tests in `commands.test`, and while `speck run` is on it runs the full suite by itself on the newest work on the main branch after ships, in its own copy of the project and without holding up any ship or build. If the full suite fails, speck's bar and `speck status` count it under Needs you, naming the failing tests, until a run on newer work passes, and `speck run`'s log says so once. To see it, set the command, ship something and watch `speck run`'s log, or look in `speck/.cache/full/run.log`. Worth keeping an eye on: the full suite runs alongside the other tests rather than waiting for a turn among them, so the computer does a little more at once, and the panel counts a failure without yet saying what it is (you see that in `speck status`).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The background full suite occupies the same limited test slots as ships and builds.; F2 fullSuiteQueue adds the commit to tried before launch and never removes it.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 285,812
- Elapsed since build started: 14 min
- Changed lines: 187 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups to the inbox: speck/ideas/2026-11-11-say-in-the-panel-what-a-failing-full-suite-is.md, speck/ideas/2026-11-11-count-a-failing-full-suite-on-the-bridge.md (close to speck/ideas/2026-11-10-count-stopped-builds-on-the-bridge.md, which counts something else), speck/ideas/2026-11-11-use-the-full-suite-s-result-as-a-build-s-baseline.md.
- Known limit: a failing full run counts under Needs you only while speck run is on, as the rest of Needs you does, since it comes from speck run's own record.
- Known limit: the full run's checkout is detached at the base branch's newest commit, which after a ship is the merge of the ticket's branch. While that branch still exists (only when ship couldn't remove the ticket's worktree), speck could read the checkout as the ticket's for the length of the run.
- Known limit: a run whose result can't be recorded (for example when worktree_setup leaves untracked files that aren't ignored) is run again every 10 minutes on the same commit; latest.json still keeps its result.

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
    "reviewed_sha": "be43c298d58b0dea54995db3cfade571d47a578e",
    "session": "fresh",
    "thread_id": "01a1ca26-218e-7e21-a45a-f2094ce77492",
    "builder_response": "- Tests run: `speck test --related test/full-suite-0630.test.mjs`, which ran test/full-suite-0630.test.mjs with the 182 related test files it lists at the top of the output (those naming a changed file) and the commands.checks files: 1943 passed, 0 failed.\n- Round 1. Notes for the reviewer:\n  - New module scripts/full-suite.mjs: fullSuiteQueue (checked on each of speck run's ticks), launchFull (a detached process running this same file), runFull (a fresh detached worktree at <repo>.worktrees/.full-suite, worktree_setup, then testRun with commands.test_full, so it takes a test turn and records the result as speck test does; latest.json keeps the last result for newer commits with none).\n  - speck run's record carries a failing full run (fullRuns.view()), which foremanView counts under Needs you; speck status and the panel's bar both read foremanView, so speck.mjs and panel.mjs (both at 600 lines) are unchanged. It counts only while speck run is on, as the rest of Needs you does.\n  - scripts/run.mjs stays at 600 lines; settings.mjs lost one blank line to stay at 600.\n  - commands.test_full shows in speck config show under Shipping, not in the panel's Settings view, so the panel looks the same.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 140933,
      "cached_input_tokens": 86400,
      "cache_write_input_tokens": 0,
      "output_tokens": 1161,
      "reasoning_output_tokens": 156
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54533,
      "cached": 86400,
      "write": 0,
      "output": 1161
    },
    "cost_usd": 0.129316,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T10:28:15.200Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/full-suite.mjs provides an isolated checkout, test turn and recorded result, exercised by the passing AC1 tests. However, fullSuiteQueue.check permanently skips a commit in tried even when its run produced no result, contrary to the requirement to run whenever no result exists and none is running."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "fullSuiteQueue.check retains and reports failures; foremanView counts them under Needs you and foremanLines names failing TAP tests. The passing AC2 tests cover persistence, logging once per commit and clearing after a newer passing result. scripts/panel.mjs uses foremanView."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "runFull calls testRun using the shared test turns. scripts/ship.mjs also calls testRun, and scripts/turns.mjs waits when max_parallel_tests slots are occupied. At the default limit of 1, a running full suite holds up ship tests and build tests. The AC3 tests check asynchronous launching and source references, not this contention."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fullSuiteQueue.check returns without launching or reporting failures when fullCommand is blank. Both blank and missing setting tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/config.mjs accepts commands.test_full; scripts/settings.mjs includes its explanation in config show. The passing AC5 test exercises setting, loading and displaying it."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/full-suite.mjs",
        "issue": "The background full suite occupies the same limited test slots as ships and builds. With max_parallel_tests: 1, a slow full run delays the next ship or build's tests until it finishes, violating criterion 3 and preserving the throughput problem this ticket addresses.",
        "suggested_fix": "Provide scheduling that lets foreground ship and build tests proceed while a full run is active, while retaining the required test-turn management. Add a behavioural test that starts a slow full run and verifies foreground tests can complete before it ends.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/full-suite.mjs",
        "issue": "fullSuiteQueue adds the commit to tried before launch and never removes it. A launch failure, failed worktree_setup or interrupted run leaves no recorded result, but that commit is never checked again until speck run restarts or another commit appears. The added tests explicitly enforce this exception although criterion 1 does not permit it.",
        "suggested_fix": "Retry commits whose runs ended without a recorded result, with an appropriate delay to avoid a tight failure loop. Replace the tests asserting permanent suppression with tests showing recovery on the same commit after a transient failure.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change adds isolated full-suite runs and reports failures, and the supplied tests passed. Two gaps prevent approval: a slow full run still delays shipping and build tests, and a run that cannot finish is abandoned until another commit or a restart."
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
    "reviewed_sha": "1a8c20eb2c1d051abbd127218002cc0bf329ed69",
    "session": "continued",
    "thread_id": "01a1ca26-218e-7e21-a45a-f2094ce77492",
    "builder_response": "- Tests run: `speck test --related test/full-suite-0630.test.mjs` (the ticket's own file, the 185 related test files listed at the top of the output, and the commands.checks files): 1983 passed, 0 failed.\n- F1: fixed. A full run now takes a test turn of its own, beside the max_parallel_tests turns, in the same turn queue (scripts/turns.mjs inTurn's new `lane` option; testRun passes it through; runFull uses lane 'full'). It keeps the queue's claim, stale-claim and killed-run handling, and only one full run goes at once, but no ship's or build's tests ever wait for it, and it never waits for theirs. New tests: \"a full run doesn't wait for the max_parallel_tests turns\", and the behavioural one you asked for, \"while a slow full run is going, a ship's or build's tests run without waiting for it\", which starts a real `sleep 2` full run with max_parallel_tests 1 and checks that a testRun of commands.test finishes, without waiting, while the full run is still going. The AC1 turn test now holds the full suite's own turn and checks the full run waits for it. The brief says so.\n- F2: fixed. The queue keeps when it started each commit's run, and starts a run of a commit that still has no recorded result again once RETRY_MS (10 minutes) has passed, or straight away on a newer commit. speck run's log says so when a run ends without a result. The test \"no full run starts while one is running\" now checks it isn't started again just before RETRY_MS, and is started again on the same commit at RETRY_MS (with an injected clock).\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 283906,
      "cached_input_tokens": 209920,
      "cache_write_input_tokens": 0,
      "output_tokens": 1906,
      "reasoning_output_tokens": 185
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 19453,
      "cached": 123520,
      "write": 0,
      "output": 745
    },
    "cost_usd": 0.058708,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T10:31:53.002Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "fullSuiteQueue.check schedules unrecorded base commits and retries unsuccessful attempts after RETRY_MS. runFull uses its own checkout and test turn, then records through testRun. Passing AC1 tests cover isolation, recording, turn contention and retrying the same commit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "fullSuiteQueue retains failures and logs once per failing commit. foremanView counts them under Needs you for status and the panel; foremanLines names failing TAP tests. Passing AC2 tests cover persistence until a newer passing result."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runFull now passes lane 'full' through testRun to inTurn, using a separate slot from foreground tests. Passing behavioural tests verify foreground tests proceed during a slow full run and full runs do not wait for foreground slots. Ships and builds do not invoke commands.test_full."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fullSuiteQueue.check launches nothing and clears its failure view when commands.test_full is blank or missing. Both corresponding AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "config.mjs accepts commands.test_full and settings.mjs explains it in config show. The passing AC5 test exercises saving, loading and displaying the setting."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/full-suite.mjs",
        "issue": "Full runs previously occupied foreground test slots and delayed ships and builds.",
        "suggested_fix": "Implemented: full runs use a separate managed test slot, with behavioural coverage of foreground progress.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/full-suite.mjs",
        "issue": "A run without a recorded result previously prevented further attempts on the same commit.",
        "suggested_fix": "Implemented: unsuccessful attempts are retried after a bounded delay, with a test covering the retry boundary.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both blocking issues are fixed. Full-suite checks now run without delaying ship or build tests, and unsuccessful attempts are retried. Failures remain visible until a newer commit passes. All five criteria are met; the supplied test run reports 1,983 passes and no failures."
  }
}
```

</details>

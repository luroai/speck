---
id: "0630"
title: "Let speck run check the full suite on the base branch after ships"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0630 · Let speck run check the full suite on the base branch after ships

**Status:** 🔍 reviewing

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

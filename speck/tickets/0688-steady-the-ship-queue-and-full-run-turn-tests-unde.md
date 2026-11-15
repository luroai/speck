---
id: "0688"
title: Steady two ship-side tests that fail under load                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-11-steady-the-0264-ac3-ship-queue-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T20:50:21.824Z"
approved: "2026-11-15T21:02:59.275Z"

---
# 0688 · Steady two ship-side tests that fail under load

**Status:** 👍 approved

## Problem
Two tests fail by chance when the machine is busy, so a build's related run or the full suite on main can fail for a ticket that didn't touch them: "0264 AC3: speck run doesn't put shipping on hold, and hands the ticket back to its build" in `test/ship-0264.test.mjs` reads the ship queue's launch before it has happened, and "0630 AC3: a full run doesn't wait for the max_parallel_tests turns" in `test/full-suite-0630.test.mjs` asserts a fixed timing.

## Outcome
Both tests wait for what they check, so they pass on a busy machine.

## Acceptance criteria
1. Each of the two tests passes 10 runs out of 10, run on its own with one busy process per core running beside it (a loop that never sleeps), as on a machine running several builds.
2. Neither test waits a fixed time or asserts a time limit where it can wait, with a time limit of at least 30 seconds, for what it checks (checked by review).
3. Each test still fails when the behaviour it checks is broken: the 0264 test when the ship queue puts shipping on hold, the 0630 test when a full run waits for a `max_parallel_tests` turn (checked by review, by breaking each and running it).
4. No test that passed before this change fails.

## Out of scope
- Other tests that fail under load: 0689 and 0690.
- Changing speck's behaviour.

## Notes
- From `speck/ideas/2026-11-11-steady-the-0264-ac3-ship-queue-test.md` and `speck/ideas/done/2026-11-11-steady-the-0630-full-run-turn-test-under-load.md`. Seen in 0632, 0640, 0642, 0645, 0649, 0660, 0670 and 0673.
- `until` in the test support (0670 raised its default to 30 s) may be what to wait with.
- Failing before this build: none
- Cause of the 0264 AC3 flake: the test ran the ship first and the queue afterwards. When that ship started more than a second after the repo's last commit (a busy machine), the queue rightly counted it as 0001's last try and launched nothing, so `launches[0]` was undefined. Reproduced at a load of ~36: the old test failed 1 run in 10 with `Cannot read properties of undefined (reading 'done')`. Now the queue's own launch runs the ship, so there's no earlier try for it to find, and nothing to wait for.
- 0630 AC3: the turn is now held until the test ends, and the full run runs in a process of its own, which the test waits up to 60 s to end, in place of asserting it took under 900 ms. A run that waited for the turn never ends, so the wait runs out. Under load: 10 of 10 at a load of ~70.
- AC1 isn't a suite test: 16 busy loops for a minute would slow every other test in the full suite. Checked by hand with a script that starts one `node -e 'for(;;);'` per core (16) and runs the one test 10 times: 0264 AC3 10 of 10 (load ~31), 0630 AC3 10 of 10 (load ~33).
- AC3 checked by breaking each: with code 16 setting the hold in `scripts/ship-queue.mjs`, 0264 AC3 fails; with the full run's `lane: 'full'` taken out of `scripts/full-suite.mjs`, 0630 AC3 fails when its 60 s wait runs out. Both restored.
- Self-check: no changes

## In plain words
Nothing changes in how speck works. Two of speck's own checks used to fail now and then when the computer was busy, which could stop a ticket from shipping even though it hadn't touched them. They now wait for what they check, and both passed every time when run with the computer kept fully busy. One thing to watch: if speck itself ever breaks what the second check covers, that check now takes up to a minute to fail, not a second.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new holder check replaces the 900 ms deadline with an implicit 30-second deadline.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 248,404
- Elapsed since build started: 13 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none to the inbox. The script used to check AC1 (one busy loop per core, then the one test 10 times) lived in /tmp; 0689 and 0690 may want the same.

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
    "reviewed_sha": "6cd99168c5db36dfb438b5e3a9738bc11b343859",
    "session": "fresh",
    "thread_id": "01a1e0ff-c828-7003-9746-30f32940e26e",
    "builder_response": "- Tests run: `speck test --related test/ship-0264.test.mjs test/full-suite-0630.test.mjs` (the two changed files plus every file that names a changed file): 165 passed, 0 failed.\n- This ticket changes only those two test files. No code under scripts/ changed.\n- AC1 is checked by hand rather than in the suite, since 16 busy loops for a minute would slow every other test in the full suite: a script starting one `node -e 'for(;;);'` per core (16 here) ran each test alone 10 times: 0264 AC3 10/10 at load ~31, 0630 AC3 10/10 at load ~33. The old 0264 test under the same load failed 1 in 10 with \"Cannot read properties of undefined (reading 'done')\", confirming the cause in the ticket's Notes.\n- AC3: breaking `scripts/ship-queue.mjs` so exit 16 also sets the hold makes 0264 AC3 fail; removing `lane: 'full'` from runFull's testRun in `scripts/full-suite.mjs` makes 0630 AC3 fail (after waiting 30 s for the held turn). Both restored.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 97221,
      "cached_input_tokens": 53376,
      "cache_write_input_tokens": 0,
      "output_tokens": 912,
      "reasoning_output_tokens": 109
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43845,
      "cached": 53376,
      "write": 0,
      "output": 912
    },
    "cost_usd": 0.1021476,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T20:57:33.645Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The builder reports 10/10 isolated runs of each target test with one busy loop per core. Both target tests also passed in /tmp/speck-0688-tests.txt."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "test/full-suite-0630.test.mjs still imposes a timing requirement: holdTurn(r, 0, 30) starts sleep 30, and running(holder) requires runFull to finish before that fixed duration expires."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The 0264 test checks the real ship's exit code, hand-back and subsequent queue launch. The 0630 test rejects a logged wait for the occupied turn. The builder reports that both specified mutations caused failures and were restored; mutation runs were not independently repeated because this review is read-only."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0688-tests.txt records 165 passed, zero failed and three skipped. The diff changes only the two target test files and the ticket."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/full-suite-0630.test.mjs",
        "issue": "The new holder check replaces the 900 ms deadline with an implicit 30-second deadline. A correct full run delayed beyond the holder's sleep can still fail on a busy machine. This does not meet criterion 2's requirement to replace timing assumptions with waiting for behaviour.",
        "suggested_fix": "Keep the ordinary turn occupied until explicit cleanup, run the full suite in a separate process, and wait for its completion with a timeout of at least 30 seconds. Release the holder in finally. Verify that removing the full lane causes the test to fail within that timeout.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The ship queue test fixes the underlying setup race and preserves its regression checks. The full-run test passed the reported load checks, but still depends on finishing before a fixed sleep expires. Replace that remaining timing assumption before merge."
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
    "reviewed_sha": "034d1de5c6e055e0c2e29ff229b2dbf777f83410",
    "session": "continued",
    "thread_id": "01a1e0ff-c828-7003-9746-30f32940e26e",
    "builder_response": "- Tests run: `speck test --files test/ship-0264.test.mjs test/full-suite-0630.test.mjs` (with commands.checks).\n- F1: fixed. In test/full-suite-0630.test.mjs, the 0630 AC3 test now holds turn 0 with a `sleep 600` it kills in `finally`, runs `runFull` in a separate node process, and waits up to 60 s (`until(..., 60000)`) for that process to exit, then checks exit 0 and no \"Waiting\" line. There's no deadline left on a correct run: its holder outlives any wait. Re-checked: 10/10 alone with 16 busy loops (load ~70). With `lane: 'full'` removed from runFull's testRun in scripts/full-suite.mjs it fails with \"timed out waiting for the full run to end without waiting for the held turn\"; restored. The child is killed in `finally` if it's still running.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 246809,
      "cached_input_tokens": 195584,
      "cache_write_input_tokens": 0,
      "output_tokens": 1595,
      "reasoning_output_tokens": 125
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7380,
      "cached": 142208,
      "write": 0,
      "output": 683
    },
    "cost_usd": 0.0358108,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:02:51.961Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The builder reports 10/10 isolated loaded runs for 0264 and a fresh 10/10 for the revised 0630 test with 16 busy loops. Both tests also pass in the supplied test run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/ship-0264.test.mjs runs the ship synchronously from the queue's launch callback. test/full-suite-0630.test.mjs now waits for a separate runFull process to exit using until(..., 60000); the occupied turn's holder lasts beyond that timeout and is explicitly killed in finally."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The 0264 test asserts exit 16, hand-back and another ticket's launch. The revised 0630 test requires successful completion while the ordinary turn remains occupied. The builder reports both specified mutations fail, including a fresh timeout failure with the full lane removed. Mutation runs were not independently repeated during this read-only review."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0688-tests.txt confirms 165 passed, zero failed and three skipped. The branch changes only the two target test files and its ticket; production behaviour is unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/full-suite-0630.test.mjs",
        "issue": "The previous revision required the full run to finish before a fixed-duration holder expired.",
        "suggested_fix": "Implemented: runFull runs in a separate process, completion is awaited for up to 60 seconds, and the turn remains occupied throughout that wait with explicit cleanup.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both tests now check the intended behaviour without the original short timing assumptions. The reported load runs and regression checks pass, and the latest test run has no failures. The previous blocking finding is resolved."
  }
}
```

</details>

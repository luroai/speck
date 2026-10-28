---
id: "0541"
title: "Steady the 0247 AC4 test under load"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-fix-the-0247-ac4-test-that-fails-under-load.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:40:38.350Z"
blocked_at: ""
waited_seconds: 34088
approved: "2026-10-28T09:44:26.314Z"

---
# 0541 · Steady the 0247 AC4 test under load

**Status:** 👍 approved

## Problem
The `0247 AC4` test in `test/run-0247.test.mjs` (new code that can't start leaves the old one running) failed once in a large parallel `speck test --related` run and passes when its file runs alone. A test that fails by chance can stop `speck ship` for a ticket that didn't break it.

## Outcome
0247 AC4 passes whether its file runs alone or alongside the rest of the suite, and still fails if the behaviour it checks breaks.

## Acceptance criteria
1. 0247 AC4 waits for each thing it checks with a time limit, rather than counting on how quickly processes start, stop or write, and the Delivery log names what it waited on before and after.
2. The test still fails if new code that can't start stops the old `speck run`: the Delivery log says how this was checked, for example by breaking that code on purpose and running the test.
3. `test/run-0247.test.mjs` passes five runs in a row while the whole suite runs at the same time, and five runs of its file alone, recorded in the Delivery log.
4. No test that passed before this change fails.

## Out of scope
- Changing how `speck run` switches to new code (0247).
- 0540 (0384 AC3) and 0542 (two browser tests).

## Notes
- Seen in 0524's build: one failure in a run of 1,704 tests, none in two runs of its file alone.
- Checked 2026-10-27: passes when run alone on `main` (2 tests, 0 failing).
- Failing before this build: none
- Tests: no new test file. The change is to the two `0247 AC4` tests themselves, so each criterion is checked by runs recorded in the Delivery log: the file alone, the file while the whole suite runs, and the file with the switch code broken on purpose. A reviewer can check AC1 by reading the two tests: every wait has a time limit (`BUSY_MS`), and each check of which processes are left waits for them.
- Self-check: no changes. `watching(run)` without a limit still waits 8 seconds, as `until` does, so the 0301 tests that share it are unchanged.
- Went with the recommendation: wait for Codex after 3:41 AM (chosen by speck, as watch is fix, 2026-10-28 09:43 UTC).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->
Nothing changes in how speck works. One of speck's own checks, the one confirming that `speck run` keeps going when its new code can't start, used to fail now and then on a busy machine, which could stop a ticket from shipping for no fault of its own. It now gives slow processes time to start and stop, and still fails if `speck run` really does stop. You won't see anything new; what to watch for is fewer unexplained test failures when tickets ship. Several similar checks still fail sometimes under heavy load, and there are follow-up ideas for them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->
The change is built and its tests pass, but the reviewer (Codex) can't run: its account has hit its usage limit until about 3:41 AM. Should I wait until then and run the review with Codex, or would you rather pick another reviewer for this ticket, such as Cursor? I recommend waiting for Codex, because it's the reviewer you've set and the change is small.
Recommended: wait for Codex after 3:41 AM
Changes what you'd notice: no
Clear winner: yes

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 99,184
- Elapsed since build started: 604 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- What 0247 AC4 waited on, before: 8 seconds each (`until`'s default) for speck run to start watching, for the failed switch to be said, for the ticket to launch and for the next switch, while the last check of which processes were left was taken once, straight after a fixed pause (600 ms and 800 ms), so a stopped process not yet gone counted as left over. After: each of those waits up to 30 seconds (`BUSY_MS`), and the check of which processes are left waits, up to the same limit, for the failed one to be gone. The fixed pauses stay only to show nothing happens again (no second launch, no second "couldn't switch").
- AC2, how it was checked: with `scripts/run-switch.mjs` broken on purpose so that new code that can't start stops the old speck run (`process.exit(1)` after it says it couldn't switch), both AC4 tests fail. Broken instead so that, after a switch, the process you started stops when the next new code can't start, the AC4 test that covers a failure after a switch fails. The code was put back each time.
- AC3: `test/run-0247.test.mjs` alone, 5 runs in a row: all passed (8 of 8 each, 14–21 s), on a machine at a load average of about 75 on 16 cores from another session's CPU-burning tests. While the whole suite (`npm test`) ran at the same time: 5 runs in a row, all passed (8 of 8 each, 22–33 s). In that suite run, `0232 AC3` (a CPU-cost check) and `0384 AC3` (0540) failed under the load; neither uses anything this ticket changed.
- In an earlier run through `speck test --files`, the out-of-scope `0247 AC1, AC2` test in the same file failed once: its ship took 16 s under the load, past its 20-second wait for the switch.
- Follow-ups:
  - `speck/ideas/2026-10-28-steady-the-other-speck-run-switch-tests-under-load.md`: the 0247 AC1, 0301, 0321 and 0300 AC5 timing tests that failed under load.
  - `speck/ideas/2026-10-28-steady-the-0232-ac3-cpu-cost-test-under-load.md`: 0232 AC3 failed in the suite under load.
  - `0384 AC3` failed under load too; it's already covered by 0540, so no new idea.

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
    "reviewed_sha": "fa7064d0cacb77786a1f9b38960c5f132eeb917d",
    "session": "fresh",
    "thread_id": "01a181e4-96b4-7c81-9af4-0db5ed968abb",
    "builder_response": "- Tests run: test/run-0247.test.mjs test/run-switch-0301.test.mjs test/seen-builds-0300.test.mjs test/run-lock-0321.test.mjs (via `speck test --files`, which adds the repo checks). These are the changed test file and every test file that uses the changed support module `test/support/run-switch.mjs`.\n- Notes for the reviewer:\n  - No new test file: the ticket changes the two `0247 AC4` tests themselves, so the criteria are checked by runs recorded in the ticket's Delivery log: AC2 by breaking `scripts/run-switch.mjs` on purpose two ways (both restored), and AC3 by five runs of the file alone and five while `npm test` ran alongside.\n  - `watching(run, ms)` gains an optional time limit. Without one, `until` still uses its 8-second default, so the 0300, 0301 and 0321 tests that share it are unchanged.\n  - The machine was under heavy load from another session's CPU-burning tests during this build (load average 75–106 on 16 cores). A `--related` run at load average 106 failed the 0301 and 0300 timing tests, and one at falling load failed eight of the 0247, 0301 and 0321 timing tests outside AC4. The run attached here, on a quiet machine, passes all of them. Those tests are out of scope (the ticket covers only 0247 AC4). The Delivery log names the `0247 AC1, AC2` failure as a follow-up.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 98521,
      "cached_input_tokens": 54144,
      "cache_write_input_tokens": 0,
      "output_tokens": 663,
      "reasoning_output_tokens": 35
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 44377,
      "cached": 54144,
      "write": 0,
      "output": 663
    },
    "cost_usd": 0.1007984,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T09:43:57.968Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both AC4 tests in test/run-0247.test.mjs use BUSY_MS (30 seconds) for startup, output, launch, switch and process-cleanup polling. The Delivery log describes the previous waits and their replacements. Remaining fixed pauses check that nothing repeats."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Both AC4 tests retain checks that the original process stays alive and work continues. The Delivery log records deliberate mutations to scripts/run-switch.mjs that stopped the old process, causing the relevant tests to fail, followed by restoration."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Delivery log records five consecutive file-only passes and five consecutive passes alongside npm test, with all eight tests passing each time."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The full supplied test output confirms 146 passes, three skips and zero failures, including the changed tests and shared-helper consumers. watching(run) still inherits until's 8-second default. The branch changes no production code; reported load-related failures are outside this change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The tests now allow slow processes time to start and stop, while retaining checks that failed replacement code leaves the existing run working. Recorded repeated runs passed, and deliberate breakage still made the tests fail. No blocking issues found."
  }
}
```

</details>

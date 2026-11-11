---
id: "0631"
title: "Ship speck itself on its quick tests"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0630"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T10:36:36.782Z"
approved: "2026-11-11T10:41:04.064Z"

---
# 0631 · Ship speck itself on its quick tests

**Status:** 👍 approved

## Problem
Every speck ship waits for speck's whole suite, about 560 files, of which about 200 start a real panel, browser or `speck run`. They make each ship take minutes, and the timing tests among them refuse ships that broke nothing when the machine is busy.

## Outcome
speck ships on its quick tests, and its whole suite runs on `main` after ships through `commands.test_full`.

## Acceptance criteria
1. `node test/support/suite.mjs --quick` runs every `test/*.test.mjs` file except the heavy ones (as `test/support/heavy.mjs` finds them) and those marked as full-suite only, and `npm test` still runs every file.
2. These files are marked as full-suite only, so the quick run leaves them out: `test/build-log-0176.test.mjs`, `test/quick-waits-0232.test.mjs`, `test/ship-0264.test.mjs`, `test/review-wait-0384.test.mjs`, `test/run-switch-0301.test.mjs` and `test/stop-0072.test.mjs`. A test file adds itself to the full-suite-only set by the same mark, without being listed anywhere else.
3. In `speck/config.yml`, `commands.test` runs the quick tests and `commands.test_full` runs `npm test`.
4. `speck test --related` and `speck test --files` still run any test file they choose or are given, heavy and full-suite-only files included.
5. No test that passed before this change fails.

## Out of scope
- Deleting or rewriting any test, including the timing and source-text tests: they move out of the ship's way, not out of the suite.
- How `speck run` runs the full suite: 0630.

## Notes
- The six files are the most frequent non-heavy entries in `speck/.cache/flaky/flaky.log` (wall-clock, CPU-cost and real-process tests).
- After 0630, because the full run needs `commands.test_full` to exist.
- Failing before this build: none
- AC3 has no test: speck's tests don't read this repo's own `speck/` folder (0122's check). A reviewer checks it by reading `commands` in `speck/config.yml`: `test` is `node test/support/suite.mjs --quick` and `test_full` is `npm test`. AC4's test runs a repo with the same two commands.
- Self-check: a quick run now keeps the times the full run recorded for the files it leaves out, rather than dropping them, and says when it has no files left to run (tests added for both).

## In plain words
Shipping a speck ticket no longer waits for every one of speck's own tests. Each ship now runs only the quick ones, leaving out about 200 tests that start a real panel, browser or `speck run`, and six that time things against the clock and failed on a busy machine. Those still run: speck run runs the whole suite on main after ships, and a failure there shows under Needs you without holding up any ship. To see it, watch a ship's test step finish much sooner than before. Keep an eye on Needs you: a problem only the slow tests catch now shows up after the ticket has shipped, not before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 98,250
- Elapsed since build started: 4 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. A new test file that is slow or timing-bound but starts no real panel, browser or speck run can leave the ships' run with a `// Full suite only: <why>` line of its own; AGENTS.md's Quick tests section could say so.

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
    "reviewed_sha": "18187a9c03eaf3df878dcd2c33486858ec11dfcd",
    "session": "fresh",
    "thread_id": "01a1ca31-df34-70a3-bb05-e9b8d00529b3",
    "builder_response": "- Tests run: test/quick-0631.test.mjs test/build-log-0176.test.mjs test/quick-waits-0232.test.mjs test/ship-0264.test.mjs test/review-wait-0384.test.mjs test/run-switch-0301.test.mjs test/stop-0072.test.mjs, with --related (which added test/docs-0267, flaky-0207, run-0247, slow-tests-0429, steady-0557, steady-0559, stopped-0173, suite-0229, suite-0233, suite-0271).\n- AC3 has no test: speck's tests don't read this repo's speck/ folder (0122's check, a commands.checks file). Check it by reading `commands` in speck/config.yml. AC4's test uses a repo with the same two commands.\n- AC4 already held before this change (speck test --files and --related run commands.test_files, `node --test {files}`, not the suite runner); its test pins it.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 97621,
      "cached_input_tokens": 57856,
      "cache_write_input_tokens": 0,
      "output_tokens": 629,
      "reasoning_output_tokens": 40
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 39765,
      "cached": 57856,
      "write": 0,
      "output": 629
    },
    "cost_usd": 0.0916056,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T10:40:54.955Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/suite.mjs: runSuite filters heavyFiles and fullOnlyFiles only with quick enabled. Passing 0631 AC1 tests exercise the CLI, selection on different core counts, full runs, timing preservation and empty selection. package.json retains the full-suite npm test command."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "All six specified files contain the mark recognised by test/support/full-only.mjs: fullOnlyFiles. The passing 0631 AC2 test verifies those files and discovers a newly marked fixture without another list."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Read speck/config.yml commands directly, as the ticket requests: test is node test/support/suite.mjs --quick; test_full is npm test."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing 0631 AC4 integration test invokes speck test --files and --related and verifies that both heavy and marked test bodies execute."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0631-tests.txt records 215 passed, zero failed and three skipped across the selected tests. Existing test changes add marks only; no assertions were removed or weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Ships now use quick tests, leaving heavy tests and the six marked files for the full suite. The full suite remains available through npm test, and targeted test commands still run excluded files. The reviewed tests passed, with no blocking concerns found."
  }
}
```

</details>

---
id: "0632"
title: "Use the full suite's result as a build's baseline"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-use-the-full-suite-s-result-as-a-build-s-baseline.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:01:26.906Z"
approved: "2026-11-11T11:13:07.472Z"
finished: "2026-11-11T11:15:30.887Z"

---
# 0632 · Use the full suite's result as a build's baseline

**Status:** ✅ done

## Problem
A build lists the tests that already fail before it changes anything from `speck test --recorded`, which reads only `commands.test`'s result. Since 0631 that's only the quick tests in this repo, so a slow test already failing on the base branch looks as if the build broke it.

## Outcome
A build's "Failing before this build" list covers the full suite whenever a full run is recorded for its code.

## Acceptance criteria
1. When a result is recorded for the same code with `commands.test_full`, `speck test --recorded` prints that result, saying it's the full suite's, which commit it's from and when, and exits with its exit code.
2. When none is recorded with `commands.test_full`, or `commands.test_full` is blank, `speck test --recorded` prints `commands.test`'s recorded result as it does today, and with neither recorded it says so in one line and exits with 0.
3. `speck test` without `--recorded`, `speck ship` and the full run `speck run` starts each still reuse only a result recorded with their own test command.
4. No test that passed before this change fails.

## Out of scope
- Running the full suite before a build starts.

## Notes
- `speck test --recorded` is `cmdTest` in `scripts/turns.mjs` with `showRecordedRun` in `scripts/results.mjs`; results are keyed by the code and the test command.
- The full suite's command is `fullCommand` in `scripts/full-suite.mjs` (0630).
- Failing before this build: not checked
- Self-check: no changes

## In plain words
Before a build changes anything, it looks up which tests were already failing, so it isn't blamed for them. Until now it only saw the quick tests' result. Now, when speck run has already run the full suite on the same code, the build uses that result instead, so slow tests that were already failing are listed too, and the result says it's the full suite's. To see it, run `speck test --recorded` on a commit the full suite has run on. Nothing else changes: ordinary test runs, ships and the full run still only reuse their own results. Worth knowing: a build started on a newer commit than the full suite last ran on still gets only the quick tests' result.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new documentation test depends on exact prose and paragraph placement: it splits on '6.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 243,247
- Elapsed since build started: 12 min
- Changed lines: 31 (limit 5000)
- Follow-ups:
  - A 0630 AC3 turn test ("a full run doesn't wait for the max_parallel_tests turns") failed once under the load of a 222-file run and passed alone: speck/ideas/2026-11-11-steady-the-0630-full-run-turn-test-under-load.md.
  - Skipped: "0193 AC1 AC4: speck run ships with speck ship --auto" failed once reading the ticket mid-write; matches speck/ideas/2026-10-23-fix-the-0193-ship-test-that-fails-by-chance.md (dropped).
  - This ticket changed 0630 AC3's guard test so turns.mjs may import `fullCommand` for `speck test --recorded`, and nothing else from the full run.

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
    "reviewed_sha": "10ac401a66d69989084ec30aeb330e234d4b7efa",
    "session": "fresh",
    "thread_id": "01a1ca4d-b527-7d11-8767-701fa7d6ad0c",
    "builder_response": "- Tests run: `speck test --related test/recorded-0632.test.mjs test/full-suite-0630.test.mjs test/run-0193.test.mjs` (222 related files plus commands.checks), then `speck test --files test/full-suite-0630.test.mjs test/recorded-0632.test.mjs` again on its own (appended to the output).\n- Round 1. Notes on the test output:\n  - `0630 AC3: a full run doesn't wait for the max_parallel_tests turns…` failed once in the 222-file related run (timing: \"it didn't wait for the held turn\") and passed in the earlier related run and 3/3 alone and in the appended rerun. This change doesn't touch turns or the full run.\n  - In an earlier related run, `0193 AC1 AC4` failed once reading the ticket mid-write (TypeError in statusIn), and passed 3/3 alone. Unrelated race.\n- I changed an existing test, `test/full-suite-0630.test.mjs` (0630 AC3's guard): it said no script but full-suite.mjs, run.mjs and foreman.mjs may import from full-suite.mjs. This ticket's AC1 needs `speck test --recorded` (cmdTest in turns.mjs) to read the full suite's command so it can look up its recorded result. I let turns.mjs import only `fullCommand`, and the guard now asserts that's its only import from there and that `fullCommand(` appears only in the `showRecordedRun` call, so `speck test` still never runs the full suite (the guard's `speck test --fresh` check is unchanged). results.mjs and turns.mjs still don't name `test_full`, so the guard's other list is unchanged.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 136633,
      "cached_input_tokens": 86784,
      "cache_write_input_tokens": 0,
      "output_tokens": 748,
      "reasoning_output_tokens": 35
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 49849,
      "cached": 86784,
      "write": 0,
      "output": 748
    },
    "cost_usd": 0.1158564,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:11:24.755Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/results.mjs showRecordedRun prefers the full command's result; showRecorded identifies the full suite, commit and time. Passing 0632 AC1 behavioural tests cover precedence, output, exit status and rejecting results for different code or commands."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "showRecordedRun falls back to commands.test. Passing 0632 AC2 tests cover missing, blank and unrecorded full commands, plus the one-line response and exit 0 when neither result exists."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Only cmdTest's recorded-only branch supplies fullCommand. Ordinary tests, scripts/ship.mjs and scripts/full-suite.mjs still call testRun with their own command. Passing 0632 AC3 tests exercise command-specific reuse."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied related-test output and focused rerun show no persistent regression. The timing failure in full-suite-0630 passed on rerun; the affected run scheduling implementation is unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/recorded-0632.test.mjs:129",
        "issue": "The new documentation test depends on exact prose and paragraph placement: it splits on '6. In that folder', '`speck test --recorded` prints' and 'With neither recorded'. Rewording or moving these passages can fail the test without changing any documented fact. The review rules explicitly prohibit such tests.",
        "suggested_fix": "Remove the prose-dependent splitting. Check command and setting facts without depending on surrounding wording, numbering or paragraph order; assess the explanatory wording by review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change correctly prefers the full suite's recorded result for a build's baseline while preserving command-specific reuse elsewhere. One new test must be adjusted because harmless documentation edits would break it."
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
    "reviewed_sha": "41a9159fba5e3295ffd4660e1d8d98356aa4f181",
    "session": "continued",
    "thread_id": "01a1ca4d-b527-7d11-8767-701fa7d6ad0c",
    "builder_response": "- Tests run: test/recorded-0632.test.mjs test/full-suite-0630.test.mjs test/recorded-0238.test.mjs (plus commands.checks)\n- F1: fixed. The doc test in test/recorded-0632.test.mjs no longer splits on any prose: it checks only facts — the build skill names `commands.test_full`, the brief names it more than once (it named it once before, for speck run), and `speck help`'s --recorded line mentions the full suite. How the passages read is left to review.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 241899,
      "cached_input_tokens": 187904,
      "cache_write_input_tokens": 0,
      "output_tokens": 1348,
      "reasoning_output_tokens": 35
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4146,
      "cached": 101120,
      "write": 0,
      "output": 600
    },
    "cost_usd": 0.024404,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:12:50.399Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/results.mjs showRecordedRun prefers the result keyed by the full command and current code. showRecorded identifies the full suite, commit and time; cmdTest propagates its exit code. Passing 0632 AC1 tests cover these behaviours and reject results for different code or commands."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "showRecordedRun falls back to commands.test; cmdTest prints one line and returns successfully when neither result exists. Passing 0632 AC2 tests cover absent results and blank or missing commands.test_full."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Only cmdTest's recorded-only branch supplies fullCommand. Ordinary tests, scripts/ship.mjs and scripts/full-suite.mjs continue using testRun with their own command. Passing 0632 AC3 tests exercise this isolation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reported round-two run includes the ticket tests, full-suite-0630, recorded-0238 and commands.checks: 138 passed, 3 skipped and no failures. Code inspection reveals no further regression."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/recorded-0632.test.mjs:129",
        "issue": "The documentation test previously depended on exact prose and paragraph placement. Those dependencies have been removed; it now checks setting-name facts and CLI help.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Builds now use the full suite's recorded result when available, so existing slow-test failures are included in their baseline. Other test runs retain their existing reuse behaviour. The brittle documentation test is fixed, and all reported checks pass."
  }
}
```

</details>

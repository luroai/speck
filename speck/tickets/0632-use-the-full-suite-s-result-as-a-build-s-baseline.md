---
id: "0632"
title: "Use the full suite's result as a build's baseline"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0632 · Use the full suite's result as a build's baseline

**Status:** 🔍 reviewing

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

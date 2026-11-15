---
id: "0676"
title: Re-run only the failing files after a related test run fails                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:04.862Z"

---
# 0676 · Re-run only the failing files after a related test run fails

**Status:** 🔍 reviewing

## Problem
Before its first review round a build runs `speck test --related`: its own test files and every existing test file that names a file it changed. The build skill says to run it once, but the 41 builds here since 11 Nov ran it 125 times, about 3 each, 3.1 hours in all (a median 53 seconds a run, 225 at the 90th percentile). After a failing run, builds run the whole set again rather than the files that failed, and each run holds a test turn other builds wait for.

## Outcome
After a failing `--related` run, a build re-runs only the files that failed and its own.

## Acceptance criteria
1. A `speck test --related` run that fails ends its output with one line giving the command to run next: `speck test --files` followed by the files it was given and the file of each failing test, each once.
2. A passing `--related` run, any `--files` run, and a failing `--related` run whose failing tests' files can't be read from its output print no such line.
3. The build skill's step for the test run before the first review round (section 3 step 5) says that after a failing `--related` run the build fixes the failure and runs the command on that line, and that `--related` runs once per build and never in a later round. (checked by review)
4. The brief's `speck test` row describes the line.
5. No test that passed before this change fails.

## Out of scope
- Which test files `--related` picks (0447).
- Reusing a result when nothing has changed: 0677.

## Notes
- Measured 2026-11-15 from this repo's build logs.
- A full run already reads each failing test's file from `location:` in TAP output for its second try. The same reading serves here.
- Builds keep the run's output with `tee` for the review round, so the line comes last and mustn't read as a test's own output.
- Failing before this build: none
- Self-check: a run that stalled or was stopped by a signal gets no line, as its failing tests are only those that ended before it stopped; a file whose name starts with - is given as ./ so it isn't read as an option.
- Decision: the reminder sits in the command's output, where the build reads it at the moment the run fails. If builds still run the whole set again, a later ticket can make a second `--related` run narrow itself.

## In plain words
When a build checks its change against the related tests and some fail, speck now ends that run's output with one line saying exactly what to run next: only the build's own test files and the files where tests failed. The build's instructions say to run that rather than the whole related set again, and to run the related set only once per build. Builds should spend less time waiting for test turns, so tickets move through faster.

To see it, break a test on a ticket branch and run the related tests: the last line reads "Once the failure is fixed, run only the files that failed and your own:" followed by the command.

Worth watching: whether builds actually follow the line. If they still rerun the whole related set, a later ticket can make a second related run narrow itself.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none new. The ticket's own note already covers the next step if builds ignore the line.

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
    "reviewed_sha": "83cb9f2a25704e5195012e9062350c103f41d395",
    "session": "fresh",
    "thread_id": "01a1df72-4083-7b61-b160-a19b5c6f3008",
    "builder_response": "Round 1 response.\n\nWhat changed:\n- scripts/tap.mjs: nextRunFiles(text, given, repo, cwd) — the given files, then each failing test's file read from its TAP `location:`, each once, as paths from cwd. Null when the output isn't TAP, names no failing test, or a failing test has no location in an existing file inside the repo.\n- scripts/turns.mjs: `speck test --related` keeps its output in a file in the shared results cache (removed afterwards). When the run ends with a non-zero exit code (not stalled, not stopped by a signal), it prints, as its last line, `Once the failure is fixed, run only the files that failed and your own: speck test --files <file>…`. Names starting with - get ./, and odd characters are shell-quoted. `--files` runs and passing runs print nothing.\n- skills/speck-build/SKILL.md section 3 step 5 (AC3): --related runs once per build and never in a later round; after a failing run, fix it and run the command on that line; without the line, run --files with the same files.\n- docs/brief.md: the `speck test` row describes the line and when there's none; the build paragraph in that row says --related runs once.\n\nTests run (output attached): the first run was `speck test --related test/related-0676.test.mjs`, which failed one existing test (0197 AC3 in test/build-0197.test.mjs, checking the skill keeps the phrase \"run the files again\"). I kept the phrase in the skill and, as the new line said, ran `speck test --files test/related-0676.test.mjs test/build-0197.test.mjs` (with commands.checks alongside): all pass. That is the attached output.\n\nAC5: no previously passing test is changed; the related run above covered every test naming the changed files.\nSelf-check: stalled/signal-stopped runs get no line (their failing list is partial); a file starting with - is given as ./. Both have tests; the stall test fails with the guard removed (checked by hand).\n",
    "seconds": 41,
    "usage": {
      "input_tokens": 145350,
      "cached_input_tokens": 88192,
      "cache_write_input_tokens": 0,
      "output_tokens": 916,
      "reasoning_output_tokens": 45
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 57158,
      "cached": 88192,
      "write": 0,
      "output": 916
    },
    "cost_usd": 0.1322952,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:43:29.661Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/turns.mjs cmdTest prints the next command only inside the `if (only)` branch. When commands.test_files is blank, a failing --related run falls through to testRun and prints no command, even with readable failing locations. The new AC1 tests cover only a configured test_files command."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdTest restricts the line to non-zero numeric endings of related runs; nextRunFiles rejects missing locations. The reported passing AC2 tests exercise passing runs, --files, unreadable output and stalled runs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 3 step 5 explicitly says to run --related once per build, never in a later round, and fix failures before running the command on the final line."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's speck test row describes the final line, its command and included files. The reported AC4 test passes, although its wording assertion violates the review rules."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied run reports 160 passes, zero failures and three skips. No existing tests were changed; whole-suite regression verification remains with ship."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/related-0676.test.mjs:122",
        "issue": "The new brief test requires the entire prose reminder NEXT_RUN verbatim. This locks a document's exact wording and will fail after an otherwise valid rephrasing, which the review rules explicitly prohibit.",
        "suggested_fix": "Test factual elements such as `speck test --files` and TAP `location:` instead of requiring the full reminder sentence.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/turns.mjs",
        "issue": "cmdTest omits the required final command when --related falls back to commands.test because commands.test_files is blank. This supported configuration is not an exception in AC1.",
        "suggested_fix": "Generate the reminder for a failing fallback run with readable failing locations too, preserving the exclusions for stopped or stalled runs. Add coverage for this configuration.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The usual configured test run now gives a useful command for rerunning failures, and the build instructions explain how to use it. Two fixes remain: support the existing whole-suite fallback and replace a test that unnecessarily freezes the brief's wording."
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
    "reviewed_sha": "94af0782c7a8250b53e2fae65574e903f4179b98",
    "session": "continued",
    "thread_id": "01a1df72-4083-7b61-b160-a19b5c6f3008",
    "builder_response": "- Tests run: test/related-0676.test.mjs test/build-0197.test.mjs (with commands.checks alongside)\n- F1: fixed. The AC4 test no longer checks the reminder's wording: it checks only that the brief's --related text gives the line's command (a backticked `… speck test --files <file>…`) and that the files are read from TAP `location:`.\n- F2: fixed. scripts/turns.mjs cmdTest: when commands.test_files is blank and --related falls back to the whole suite through testRun, a failing run (not stalled, not stopped by a signal) reads its output with nextRunFiles and ends with the same line (shared printNext helper). New test \"0676 AC1: with commands.test_files blank, a failing --related run of the whole suite ends with the line too\". The brief's row now says so, and that a run that stalls or is stopped gets no line.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 377867,
      "cached_input_tokens": 297600,
      "cache_write_input_tokens": 0,
      "output_tokens": 1742,
      "reasoning_output_tokens": 64
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 23109,
      "cached": 209408,
      "write": 0,
      "output": 826
    },
    "cost_usd": 0.0754188,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:54:47.854Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/turns.mjs cmdTest prints the final command through printNext for both configured file runs and whole-suite fallback runs. scripts/tap.mjs nextRunFiles deduplicates given and failing files. Passing AC1 tests cover both paths, duplicates and leading hyphens."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdTest limits the reminder to failed related runs; nextRunFiles rejects unreadable failing locations. Passing AC2 tests cover passing runs, --files, missing locations, non-TAP output and stalls."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 3 step 5 says to run --related once per build, never in later rounds, and fix the failure before running the command on the final line."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's speck test row describes the reminder, included files, fallback behaviour and exclusions. The passing AC4 test now checks command and location facts rather than prose wording."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0676-tests.txt confirms 164 tests: 161 passed, zero failed and three skipped. Existing tests were not weakened or changed. Whole-suite verification remains with ship."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/related-0676.test.mjs",
        "issue": "The document test previously required the reminder's exact prose. It now checks only the command and TAP location field.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/turns.mjs",
        "issue": "The whole-suite fallback previously omitted the reminder. cmdTest now prints it for eligible failures, with a passing integration test covering this configuration.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both requested fixes are complete. Failed related runs now provide the narrower rerun command, including when file-specific testing is unavailable. The instructions match the behaviour, and all tests run for this review passed."
  }
}
```

</details>

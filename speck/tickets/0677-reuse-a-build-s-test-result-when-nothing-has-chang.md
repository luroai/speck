---
id: "0677"
title: "Reuse a build's test result when nothing has changed"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
after: ["0676"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:01:02.658Z"

---
# 0677 · Reuse a build's test result when nothing has changed

**Status:** 🔍 reviewing

## Problem
A full `speck test` reuses a recorded result for the same code (0112), but `--files` and `--related` runs record nothing. A build that runs the same files twice with nothing changed between, for instance once to see them pass and again to keep the output for the review round, runs them twice. Of 803 such runs here since 29 Oct (10.9 hours), about 180 (2.8 hours) repeated a passing run with no change to the code.

## Outcome
A `--files` or `--related` run with the same code, test command and test files as an earlier passing one prints that run's result without running.

## Acceptance criteria
1. A passing `speck test --files <file>…` or `speck test --related` run records its output against the code as it stands in the checkout (uncommitted changes and new files that git doesn't ignore included), the test command and the test files it ran. The brief's `speck test` row says so.
2. A later `--files` or `--related` run, in any worktree of the repo, that would run the same test files with the same command on the same code prints the recorded output and a line saying it's reused and when it ran, and exits 0 without running the tests or waiting for a turn.
3. It runs the tests when any file outside `speck/` differs, when the test files differ, and after a failing run: a failure is never reused.
4. `speck test --fresh` with `--files` or `--related` always runs the tests.
5. No test that passed before this change fails.

## Out of scope
- Full runs, which already reuse results (0112, 0237).
- `speck ship`'s own test runs.
- Reusing a failing result.

## Notes
- Measured 2026-11-15 from this repo's build logs, and approximate: a run counts as a repeat when the build changed no file between it and the passing run before it. A further 148 runs (1.4 hours) repeated a failing run with no change, to see whether it failed by chance. Those still run.
- A full run records only when nothing outside `speck/` is uncommitted. Builds test before they commit, so this record has to take uncommitted changes into account.
- `cmdTest` in `scripts/turns.mjs` runs the tests and `scripts/results.mjs` keeps the recorded results.
- Failing before this build: none
- Self-check: added a test that `--fresh` just after `--files` runs the tests and that `--fresh` with anything else gives the usage message without a stack trace; checked that the reviewer's summary still reads a reused run's output. Running the tests in parallel showed the key could change between runs: the copied index got a newer time, so git took a file edited in the same second as unchanged. The copy now keeps the index's own time.

## In plain words
When a build runs a few test files and they pass, speck now remembers that. If the build asks for the same tests again before anything has changed, speck shows the earlier result straight away, with a line saying it's reused and when it ran, instead of running them again or waiting for a turn. Builds spend less time waiting on tests they've already seen pass.

To see it, run the same set of test files twice without changing anything: the second run answers at once. Any change to the project's files outside speck's own folder, a different set of test files or a failing run makes the next run test again, and adding `--fresh` always runs them.

Worth keeping an eye on: speck only looks at the project's files. A test that depends on something else, such as a setting outside the project or a file git ignores, could be reused after that something changed; `--fresh` gets round it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups (Delivery log only, none went to the inbox):
- Known limit: the reuse key covers files git tracks or doesn't ignore, and the test command. Environment variables and ignored files (such as `node_modules`) aren't part of it, so a test that depends on them can be reused after they change. `--fresh` runs it anyway.
- Tidy-up: `speck help` doesn't yet mention `--fresh` with `--files` or `--related`. The usage message and the brief do.
- Known limit: a `--files` record keeps all of its run's output, and records are cleared only after 30 days, when a new one is recorded, so a long-running repo's cache can grow.

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
    "reviewed_sha": "45f4846d47ca6e924ce816890361717ed6df5143",
    "session": "fresh",
    "thread_id": "01a1dfa0-165b-7580-bfea-609bae7c4cde",
    "builder_response": "- Tests run: `speck test --related test/results-0677.test.mjs` first. It chose every test file that names `docs/brief.md`, `scripts/results.mjs` or `scripts/turns.mjs`. Five failed: three in results-0677 (the racy-index key bug, now fixed), test/recorded-0238.test.mjs (usage message) and test/turns-0239.test.mjs (\"records nothing\", which this ticket changes on purpose). After the fixes I ran the command its last line gave: `speck test --files test/results-0677.test.mjs test/recorded-0238.test.mjs test/turns-0239.test.mjs`, which passed (the attached output).\n- Changed existing test: test/turns-0239.test.mjs's \"records nothing\" now checks that no full run's result is recorded. A passing --files run now records a result marked `files: true` under a key that full runs never look up, as AC1 asks.\n- Design: `checkoutCode` hashes the tree `git add -A` writes into a copy of the checkout's index (copy keeps the index's mtime so racy-git detection still works), leaving out the top-level `speck` entry, together with the full test command (which names the test files and commands.checks). `filesRun` checks for a recorded pass before taking a turn (AC2), again once it has a turn, records a pass with its output only when the key is unchanged after the run, and clears a recorded pass for that key after a failing or stalled run (AC3). `--fresh` may come first or just after --files/--related (AC4).\n",
    "seconds": 43,
    "usage": {
      "input_tokens": 204838,
      "cached_input_tokens": 146304,
      "cache_write_input_tokens": 0,
      "output_tokens": 1037,
      "reasoning_output_tokens": 199
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58534,
      "cached": 146304,
      "write": 0,
      "output": 1037
    },
    "cost_usd": 0.1420684,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:33:35.866Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "checkoutCode and filesRun in scripts/results.mjs record passing runs with checkout changes included, as the AC1 tests demonstrate. The brief's speck test row describes this. However, record silently truncates passing output above 1,048,576 characters."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests cover reuse, output, timestamps and reuse from another worktree without waiting. However, filesRun can only print the truncated output saved by record, so larger runs do not reproduce their recorded output fully."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 tests exercise changes to tracked files, untracked files, test contents and selected files, plus repeated failures and invalidation of an earlier pass. filesRun deletes the matching pass after a failing run."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 tests exercise --fresh with both --files and --related. filesRun bypasses both reuse checks when fresh is true."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied final run reports 168 passes, zero failures and three skips across 171 tests, including the previously failing files. The changed existing assertion appropriately reflects the new scoped caching behaviour. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/results.mjs:61",
        "issue": "record applies the existing failure-output limit to passing file runs too. Once output exceeds 1,048,576 characters, reuse silently drops its beginning. This violates the promise to reproduce the run's output and can remove test results needed for review. The current output test only exercises a tiny run.",
        "suggested_fix": "Preserve complete output for passing file runs while retaining the existing full-run behaviour. Add a regression test with output exceeding the limit and verify that reuse retains both the beginning and end without running tests again.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Repeated passing test runs are reused successfully in the covered cases, including across worktrees. One fix is needed: larger runs silently lose the beginning of their output when reused, potentially hiding results from review."
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
    "reviewed_sha": "01368e3a4ad5c664583f08579fbf16e86be85cd0",
    "session": "continued",
    "thread_id": "01a1dfa0-165b-7580-bfea-609bae7c4cde",
    "builder_response": "- Tests run: test/results-0677.test.mjs test/recorded-0238.test.mjs test/turns-0239.test.mjs\n- F1: fixed. `record` in scripts/results.mjs now keeps all of a `--files`/`--related` run's output, pass or fail; full runs keep their existing limit. New test \"0677 AC2 F1\" runs a test file writing over 1.2 MB, then checks the reused run prints its start and its end without running again.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 330390,
      "cached_input_tokens": 265344,
      "cache_write_input_tokens": 0,
      "output_tokens": 1699,
      "reasoning_output_tokens": 199
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6512,
      "cached": 119040,
      "write": 0,
      "output": 662
    },
    "cost_usd": 0.031548,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:35:04.867Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/results.mjs checkoutCode hashes checkout contents and the expanded test command; filesRun records passing output. The AC1 tests cover uncommitted and untracked files. The brief's speck test row documents this behaviour."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "filesRun checks for reuse before acquiring a turn and prints the saved output with its timestamp. Passing AC2 tests cover --files, --related, cross-worktree reuse without waiting, and output exceeding the former truncation limit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests cover changes outside speck/, changes to test contents and selected files, repeated failures, and invalidation of an earlier pass. filesRun records only passes and clears the matching cache entry after failure."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdTest passes freshFiles to filesRun, which bypasses both reuse checks. Passing AC4 tests verify that --fresh runs tests with both --files and --related."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied round output reports 169 passes, zero failures and three skips across 172 tests, including the ticket's tests and previously failing test files. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/results.mjs:61",
        "issue": "Passing file-run output was truncated above 1,048,576 characters. The current record implementation preserves it completely.",
        "suggested_fix": "Implemented and covered by the passing '0677 AC2 F1' regression test, which verifies that a reused run retains the beginning and end of output exceeding 1.2 MB without running again.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Repeated passing test runs now reuse their complete output, including across worktrees, without waiting for a test slot. Changed code and failing runs trigger testing again, and --fresh forces a new run. The output-loss issue is fixed; no blocking findings remain."
  }
}
```

</details>

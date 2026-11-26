---
id: "0773"
title: "Keep test summaries working on Node 24"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-keep-test-summaries-working-on-node-24.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T23:48:45.099Z"
approved: "2026-11-26T23:57:14.913Z"

---
# 0773 · Keep test summaries working on Node 24

**Status:** 👍 approved

## Problem
speck reads `node --test` output as TAP to say which test files failed and what to run next. On Node 24 the default output is the spec reporter, so a failing `speck test --related` run ends without the command to run next and the reviewer gets the whole output.

## Outcome
`speck test`'s summary of a failing run works whether `node --test` prints TAP or Node's spec reporter.

## Acceptance criteria
1. For a failing run of `node --test {files}` printing Node's spec reporter (as Node 24 does by default), `speck test --related` ends with the failing files and the command to run only them, as it does for TAP.
2. The reviewer's summary of the run names the same failing tests from either output.
3. A passing run is recognised as passing from either output.
4. No test that passed before this change fails.

## Out of scope
- Changing a project's test command.

## Notes
- From 0741's note, checked with Node 24.18.1 (bundled with Cursor's server). This repo's `commands.test_files` is `node --test {files}`.
- Decision: read the spec reporter's output too, rather than adding `--test-reporter=tap` to every project's settings.
- Failing before this build: none
- Self-check: decides TAP or spec for each run rather than the whole output, so a spec run followed by a TAP second try reads both, and strips colour codes from spec output; tests added for both.
- Checked the converter with Node 24.22.1's own output as well as Node 22's spec reporter: the ticket's tests pass on both.

## In plain words
On newer Node versions, `node --test` prints its results in a friendlier layout instead of the plain format speck used to read. speck now reads both. So when tests fail, speck again says which test files failed and gives the short command to run just those, the reviewer gets a tidy summary rather than the whole output, and the full suite's failing tests are named again.

To see it, run a project's tests on Node 24 with a failing test: the run ends with the line saying what to run next. Worth keeping an eye on: if a test prints a line that looks exactly like a result line, speck could miscount it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 247,241
- Elapsed since build started: 8 min
- Changed lines: 94 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-11-26-steady-the-0245-claude-code-build-variable-test.md (0245 AC1 failed once with "Unexpected end of JSON input", then passed unchanged).
- Delivery log only: a line a test prints that looks exactly like a spec result line (a mark, a name and a time in brackets) would be read as a result; TAP doesn't have this, as it marks printed lines as comments.

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
    "reviewed_sha": "46b467dfaab9c6396f2ec26aa49133fd379b6e34",
    "session": "fresh",
    "thread_id": "01a21a49-ecbf-73a0-b08d-51d753ea38f0",
    "builder_response": "- Tests run: `speck test --related test/tap-0773.test.mjs` once (1951 passed, 3 failed: related-0676 AC4 and docs-0267, both because my first brief wording dropped `location:`, which I put back; run-0245 AC1 failed with \"Unexpected end of JSON input\" and passed on the re-run unchanged). Then the line's command: test/tap-0773.test.mjs test/docs-0267.test.mjs test/related-0676.test.mjs test/run-0245.test.mjs, all passing (this output).\n- Approach: scripts/tap.mjs converts each run of Node's spec reporter in the output into the TAP node --test would have written (results with subtests, a YAML block with location and error for each failing test from the \"✖ failing tests:\" section, totals from the ℹ lines). Every reader (summariseTap, tapCounts, failingTests, failingTestFiles, passingTests, nextRunFiles) goes through it, so TAP input is unchanged and spec input reads the same. Runs are split at the retry note / Flaky lines, so a full run's second try reads too.\n- The ticket's tests compare real TAP and real spec output of the same fixture tests (failing tests' names and files, summary's failing tests and id-named tests, counts, passing tests), plus Node 24's ⚠ todo mark from a literal fixture, a real `speck test --related` run with `--test-reporter=spec`, colour codes, and a spec run followed by a TAP second try. They also pass under Node 24.22.1.\n- Docs: brief and speck-review skill now say TAP or Node's spec reporter.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 246285,
      "cached_input_tokens": 181120,
      "cache_write_input_tokens": 0,
      "output_tokens": 956,
      "reasoning_output_tokens": 245
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 65165,
      "cached": 181120,
      "write": 0,
      "output": 956
    },
    "cost_usd": 0.158002,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T23:56:51.078Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/tap.mjs converts spec results and failure locations for nextRunFiles. Both AC1 tests pass, including a real failing speck test --related run that checks its final rerun command."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "AC2 tests compare summaries, failing names, files and counts from real TAP and spec output. Passing coverage includes nested tests, duplicate names, error details, retries, mixed reporters and colour codes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 test checks both reporters produce no failures, retain the ticket's passing result and return matching passing test names."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded final run reports 171 passed, 3 skipped and zero failures. Existing tests were not weakened or changed; the initial related-run failures were resolved and their files passed on rerun."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Test summaries now understand Node's spec output as well as TAP, restoring failing-file lists and the command to run next. The tests exercise real reporter output and retries. No blocking issues found."
  }
}
```

</details>

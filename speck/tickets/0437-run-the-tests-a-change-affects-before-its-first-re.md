---
id: "0437"
title: "Run the tests a change affects before its first review"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: [] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T21:55:26.036Z"
approved: "2026-10-23T22:07:38.378Z"

---
# 0437 · Run the tests a change affects before its first review

**Status:** 👍 approved

## Problem
A build runs only its own test files before review, and the whole suite runs only at ship. So a change that breaks an existing test is caught at ship, after the reviewer approved: speck run hands the ticket back, and the build re-tests, fixes and gets another review round. 0427, a font change, lost about 8 of its 25 minutes this way, to layout tests it hadn't run.

## Outcome
Before its first review round, a build also runs the existing tests that cover the files it changed, so it finds what it broke before review rather than at ship.

## Acceptance criteria
1. `speck test --related` runs, in one run as `speck test --files` runs files, every test file under `test/` whose text names a file the branch changed since it left the base branch, or that imports a module under `test/support/` whose text names one. A file is named by its path from the repo root or by its file name. Files under `speck/` don't count as changed.
2. Before it runs anything, `speck test --related` prints each test file it chose, with the changed file that brought it in. With none, it says so in one line, runs no tests and exits with 0. Like `--files`, it also runs `commands.checks`.
3. The `speck-build` skill runs `speck test --related` once before the first review round, as well as the ticket's own test files, and includes its output in that round's test output. The rule that a test failing before the build is never changed or fixed in the build still holds.
4. `docs/brief.md`'s `speck test` row names `--related` and says what it chooses.

## Out of scope
- Running the whole suite during a build: `speck ship` still does that.
- Which tests are slow (0429).

## Notes
- The user asked on 2026-10-23 why 0427 took 25 minutes. Its ship failed on 0140, 0151, 0155 and 0156's layout tests, which it hadn't run (`speck/.cache/runs/run.log`).
- `test/support/panel.mjs` names `templates/panel.html`, so a change to the panel brings in every test that imports it. That's most panel tests, a few minutes, once per build, against an 8-minute hand-back. After the split (0430 to 0433), this picks fewer tests for each change.
- `speck test` is in `scripts/turns.mjs` (0239). The skill is `skills/speck-build/SKILL.md`; `.claude/skills/` links to it.
- Waits for nothing: no open ticket changes these files.
- Failing before this build: none
- Self-check: no changes

## In plain words
Before a build's first review, speck now also runs the existing tests that mention a file the build changed, so a change that breaks an older test is caught before the reviewer looks at it, not at shipping. Before it runs them, it lists each test it chose and which changed file brought it in. To see it, run `speck test --related` on a ticket's branch. Keep an eye on how many tests it picks: a change to speck's main command file or to a skill picks nearly the whole suite, which takes a couple of minutes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new AC3 test locates the skill step by its exact opening wording and asserts exact prose sentences at lines 141–142.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 622,188
- Elapsed since build started: 12 min
- Changed lines: 117 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - `--related` picks nearly the whole suite for a change to `scripts/speck.mjs` (named by most test/support modules) or any `SKILL.md`: 374 of 390 files here. Sent to the inbox: `speck/ideas/2026-10-23-keep-related-tests-from-picking-the-whole-suite.md`.
  - The `speck-review` skill's "Before every round" still names only `speck test --files`; round 1's `--related` is in the build skill only, as AC3 asked. A tidy-up to mention it there too.
- The first `--related` run caught a real break (0238's usage-message test), fixed before round 1.

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
    "reviewed_sha": "a8a4a58b950a9342420b1dd0531144755216e837",
    "session": "fresh",
    "thread_id": "01a16acc-6640-7250-a778-29da42260f9c",
    "builder_response": "- Tests run: `speck test --related test/related-0437.test.mjs` (this ticket's new step: the ticket's own test file plus every related test file it chose, 374 files here, and commands.checks, in one run). Its output starts with the list of chosen files and what brought each in.\n- Self-check: no changes. One related test (test/recorded-0238.test.mjs) failed on the first --related run because I'd reworded the usage message; I kept the message's old start instead of changing that test, and the run above passes.\n- Note: the related set is nearly the whole suite for this branch, because test/support modules name scripts/speck.mjs (the CLI), which this change touches. That's what AC1 asks for; I'll list narrowing it as a follow-up.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 112033,
      "cached_input_tokens": 68608,
      "cache_write_input_tokens": 0,
      "output_tokens": 756,
      "reasoning_output_tokens": 71
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T22:06:05.596Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/related.mjs: changedFiles and relatedTests select tests by changed path or basename and direct support-module imports, excluding speck/. Four passing AC1 tests cover these selections and the branch point."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/turns.mjs: cmdTest prints relatedReport before running the combined files through the existing runner with commands.checks. Passing AC2 tests cover reporting, combined selection, checks and the empty result."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md step 5 specifies --related with the round's files, captures its output for the first reviewer, and preserves the prohibition on fixing previously failing tests. The passing AC3 test checks the command and rule, although its prose assertions need correction."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's speck test row documents --related and selection through changed-file names and test/support imports. The passing AC4 test checks the command and support-directory references."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/related-0437.test.mjs:138",
        "issue": "The new AC3 test locates the skill step by its exact opening wording and asserts exact prose sentences at lines 141–142. These are document wording checks explicitly prohibited by the review rules; harmless editorial changes would break the suite.",
        "suggested_fix": "Remove the exact prose and step-opening assertions. Retain checks of concrete facts such as the --related command, output file and tee invocation without depending on surrounding wording or step position.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change selects related tests, explains its choices and adds them to the first review run. The reported run passed. One new test must be revised because it locks documentation to exact wording, making routine edits break the tests."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9ace134e2454cc55c180dc4b9decb975e12e5739",
    "session": "continued",
    "thread_id": "01a16acc-6640-7250-a778-29da42260f9c",
    "builder_response": "- Tests run: test/related-0437.test.mjs (with commands.checks), via `speck test --files`. Only the ticket's own test file changed since round 1.\n- F1: fixed. test/related-0437.test.mjs's AC3 test no longer finds the step by its opening words or asserts its sentences: it checks only that the build skill's Implement section contains the command `speck test --related <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 204052,
      "cached_input_tokens": 156288,
      "cache_write_input_tokens": 0,
      "output_tokens": 1433,
      "reasoning_output_tokens": 120
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T22:06:41.479Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/related.mjs: changedFiles and relatedTests still implement changed-file selection, basename/path matching and support-module imports, excluding speck/. All four AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/turns.mjs: cmdTest reports selections before running the combined files with commands.checks, and returns without running tests for an empty selection. All AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md step 5 specifies --related before the first review, with the ticket's files and captured output. Step 1.6 retains the prohibition on fixing previously failing tests. The revised AC3 command check passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's speck test row names --related and explains direct changed-file references and references through test/support imports. The AC4 test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/related-0437.test.mjs:138",
        "issue": "The prose assertions were removed, but the replacement still depends on exact numbered headings and their order: BUILD.slice(BUILD.indexOf('## 3. Implement'), BUILD.indexOf('## 4. Review loop')). Renaming or renumbering either heading breaks the test even when the command remains correct. This retains the document wording/heading-order dependency prohibited by the review rules.",
        "suggested_fix": "Check the concrete command against BUILD directly, without slicing by document headings. Judge its placement before the first review by reading the skill.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The functionality still meets the ticket and the reported tests pass. The previous test issue is only partly fixed: it now depends on exact section headings. Remove that dependency before approval."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "8ebeb1009d484875df2690330f0fc70868380e66",
    "session": "continued",
    "thread_id": "01a16acc-6640-7250-a778-29da42260f9c",
    "builder_response": "- Tests run: test/related-0437.test.mjs (with commands.checks), via `speck test --files`. Only the ticket's own test file changed since round 2.\n- F1: fixed. The AC3 test no longer slices the skill by its headings: it checks only that the build skill contains the command `speck test --related <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`. Its placement before the first review is left to reading the skill.\n",
    "seconds": 14,
    "usage": {
      "input_tokens": 301935,
      "cached_input_tokens": 251392,
      "cache_write_input_tokens": 0,
      "output_tokens": 1979,
      "reasoning_output_tokens": 120
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T22:07:13.575Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/related.mjs: changedFiles and relatedTests select tests by changed path or basename and support-module imports, excluding speck/. All four AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/turns.mjs: cmdTest prints relatedReport before running the combined selection with commands.checks, and runs nothing for an empty selection. Passing AC2 tests cover these behaviours."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md step 5 requires --related with the round's files before the first review and captures its output for the reviewer. The prohibition on fixing previously failing tests remains. The revised command-fact test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's speck test row documents --related and selection by changed-file names or support-module references. The AC4 test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/related-0437.test.mjs:137",
        "issue": "The document wording and heading-order dependencies have been removed. The test now checks only the concrete command.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change runs related tests before the first review, explains why each was selected and includes configured checks. All criteria are met, the reported tests pass and the previous blocking finding is resolved."
  }
}
```

</details>

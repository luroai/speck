---
id: "0238"
title: "Start a build without running the whole suite"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0231","0235","0237"] # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:35:17.058Z"
approved: "2026-10-15T22:43:16.015Z"
finished: "2026-10-15T22:46:42.503Z"

---
# 0238 · Start a build without running the whole suite

**Status:** ✅ done

## Problem
Every build starts by running the whole suite, only to list the tests that already fail before it changes anything. Usually that reuses the result from the ship before it, but after any change to the base branch made outside a ship it's a whole run on a laptop that may already be busy, for a list that's nearly always "none".

## Outcome
A build lists the tests already failing from a result speck has recorded, and never runs the whole suite to find them.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `speck test --recorded` prints the result recorded for this checkout's code and test command, as `speck test` does when it reuses one, and exits with its exit code, without running any tests. With none recorded, it runs nothing, says so in one line and exits with code 0.
2. `/speck-build` tells the builder, before it changes anything, to run `speck test --recorded` instead of the whole suite, and to write `Failing before this build:` from it: the failing tests, `none`, or `not checked` when no result is recorded.
3. The reviewer prompt treats `Failing before this build: not checked` as an empty list: fixing a test unrelated to the ticket is still an unrelated change, but no test is singled out as listed.
4. `docs/brief.md` describes `speck test --recorded` and says a build doesn't run the whole suite before it starts.
5. No test that passed before this change fails.

## Out of scope
- Running only the ticket's own tests during review rounds (0235).
- Recording results anywhere new: this reads the ones `speck test` and `speck ship` already record (0112).

## Notes
- Results are recorded per code in `scripts/results.mjs` (`testedCode()`, `recorded()`); `speck test` is `cmdTest()` in `scripts/turns.mjs`. A ship records the result for the code it lands, so a build started after it usually finds one.
- The builder's step is `skills/speck-build/SKILL.md` section 1 step 6; the reviewer's scope rule is item 4 in `templates/reviewer-prompt.md`.
- 0235 changes the same skill and reviewer prompt, 0237 the same `testRun()` and `cmdTest()` code, and 0231 `scripts/speck.mjs`, where `speck test`'s usage lines are; all three come first.
- Failing before this build: none
- Self-check: the build skill's section 3 step 5 still said the whole suite ran before any change; reworded it, with a test.
- The older tests that asserted the full-suite starting run (baseline-0095 AC1, files-0113 AC4, build-0197 AC4) now assert `speck test --recorded`, as this ticket replaces that step.

## In plain words
A build no longer runs every test before it starts. It looks up the last test result speck already has for the same code, usually from the previous ship, and notes which tests were already failing from that. When there's no saved result, it writes "not checked" and carries on, and the reviewer treats that as no tests already failing. Every test still runs before anything ships. You can ask speck for the saved result yourself; it shows it without running any tests. Worth watching: right after a change made to the main code outside a ship, builds will say "not checked" until the next full run.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 328,936
- Elapsed since build started: 8 min
- Changed lines: 49 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "a83c4885b200b6388e0cce9bcea09e05c6305d80",
    "thread_id": "01a141b8-34be-7662-acad-ed5eefb2cb87",
    "seconds": 16,
    "usage": {
      "input_tokens": 112965,
      "cached_input_tokens": 68736,
      "cache_write_input_tokens": 0,
      "output_tokens": 515,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:39:29.521Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/turns.mjs cmdTest() handles --recorded through scripts/results.mjs showRecordedRun(), without invoking testRun(). Passing AC1 integration tests cover recorded passes and failures, exit codes, no recorded result, changed code and changed command, and verify that no tests run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 1 step 6 requires --recorded before changes and specifies failing tests, none and not checked. Both AC2 tests in test/recorded-0238.test.mjs pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/reviewer-prompt.md scope rule explicitly treats not checked as listing no tests while preserving the unrelated-change prohibition. The corresponding AC3 test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md documents --recorded and states that a build does not run the whole suite before starting. The corresponding AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full supplied test log confirms all 35 tests passed across the ticket's tests and three changed existing test files. Existing assertions were updated for the intended behaviour, retaining their other checks. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Builds now read previously recorded test results instead of running the whole suite before starting. Missing results are clearly marked as not checked. The implementation and instructions agree, all 35 reviewed tests pass, and no blocking issues were found."
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
    "reviewed_sha": "317ee30f52453f62f9560a70d818903c6d2d1047",
    "thread_id": "01a141b8-34be-7662-acad-ed5eefb2cb87",
    "seconds": 15,
    "usage": {
      "input_tokens": 214402,
      "cached_input_tokens": 160512,
      "cache_write_input_tokens": 0,
      "output_tokens": 1054,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:43:13.123Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/turns.mjs cmdTest() returns the result from scripts/results.mjs showRecordedRun() without running tests. Passing test/recorded-0238.test.mjs integration tests cover recorded success and failure, exit codes, missing results, code and command changes, and invalid arguments."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 1 step 6 requires --recorded before changes and specifies failing tests, none or not checked. Both AC2 tests pass; the foreground instruction is restored."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/reviewer-prompt.md explicitly treats not checked as an empty list while retaining the prohibition on unrelated changes. The AC3 test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md describes --recorded and states that builds do not run the whole suite before starting. The AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest test log records 57 passes and no failures across all six requested files, including both tests that failed during shipping. Their assertions remain unchanged; the implementation and instructions now satisfy them. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Builds read saved test results without running the suite before starting. Both regressions found during shipping have been corrected without weakening their tests. All 57 tests in this review run pass, and no blocking issues remain."
  }
}
```

</details>

---
id: "0482"
title: "Keep the related-tests count check from failing as the suite grows"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-keep-the-related-tests-count-check-from-failing-as-tests-grow.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:33:25.291Z"
approved: "2026-10-24T18:37:15.221Z"
finished: "2026-10-24T18:40:41.674Z"

---
# 0482 · Keep the related-tests count check from failing as the suite grows

**Status:** ✅ done

## Problem
0447's AC3 test checks that 0437's change (`scripts/turns.mjs`, the build skill and `docs/brief.md`) picks fewer than 100 related tests from a copy of this repo's own `test/` folder. It picks 98 today, and every new test that names `docs/brief.md` adds one, so within a few tickets `speck ship` will fail on it for a ticket that did nothing wrong.

## Outcome
The check still guards 0447's rules for `speck test --related`, without depending on how many tests the suite has.

## Acceptance criteria
1. 0447's AC3 check passes however many test files name `docs/brief.md`, `scripts/turns.mjs` or the build skill: with 100 more test files that each name `docs/brief.md` in the tests it measures, it still passes, where today it fails.
2. The check still fails when `--related` brings a test in through a support module for a skill's `SKILL.md`, and when it brings one in through a support module for a file more than a quarter of the support modules name: checked by turning each of those two rules off in `scripts/related.mjs` in turn and seeing the check fail.
3. Every test file that names `scripts/turns.mjs` is still among the tests 0437's change picks. No test that passed before this change fails.

## Out of scope
- Which tests `--related` picks: `scripts/related.mjs` doesn't change.
- Picking the tests that load the panel's page through `test/support/panel.mjs` (the inbox note "Bring in page tests for a panel script change").

## Notes
- From the inbox note, raised while building 0447. Measured on 2026-10-24 on main: 0437's change picks 98 test files, so two more tests that name the brief fail it.
- Today: `measuredRepo()` and the AC3 test in `test/related-0447.test.mjs` copy the live `test/` folder. history-0085 forbids commit ids in tests, so the check can't pin the folder to a commit.
- Failing before this build: none
- Measured on 2026-10-24 while building: no support module names `docs/brief.md` or `scripts/turns.mjs`, so with the quarter rule off 0437's change still picks the same 98 tests and the old count check passed. The check therefore also measures a change to `scripts/speck.mjs`, which more than a quarter of the support modules name (with that rule off it picks 417 tests rather than 84). The check asserts that neither change brings a test in through a support module, rather than counting.
- Self-check: kept the measured file names out of `test/support/related.mjs`, so that module, which names none of them, brings no test in through itself.

## In plain words
Nothing changes in what speck does. One of speck's own checks, which makes sure the "related tests" choice stays small and sensible, used to count the tests it picked and fail once that reached 100, which new tests would have pushed it past within a few tickets. It now checks the rules behind the choice instead, so a growing test suite no longer trips it and blocks shipping for a ticket that did nothing wrong. It also now catches a broken rule that the old count missed. There's nothing to watch for: the check runs with every ship.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 98,087
- Elapsed since build started: 4 min
- Changed lines: 0 (limit 5000)
Follow-ups: none.

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
    "reviewed_sha": "dde1bd990a31d441ab65bf21058765e5adffe9e0",
    "session": "fresh",
    "thread_id": "01a16f33-75ce-7141-86e7-03cdacfad503",
    "builder_response": "- Tests run: test/related-0482.test.mjs test/related-0447.test.mjs (via `speck test --related`, which chose those plus test/related-0437.test.mjs), with the repo checks.\n- Round 1. While building I found that the old count check never guarded the quarter rule: no support module names docs/brief.md or scripts/turns.mjs, so with that rule off 0437's change still picks 98. The check now also measures a CLI change (scripts/speck.mjs, named by more than a quarter of the support modules), and asserts that neither change brings a test in through a support module, instead of counting. See the ticket's Notes.\n- The measured file names are passed in from the test files, so test/support/related.mjs names none of them and brings nothing in through itself.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 97516,
      "cached_input_tokens": 54016,
      "cache_write_input_tokens": 0,
      "output_tokens": 571,
      "reasoning_output_tokens": 17
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T18:37:06.876Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/related-0447.test.mjs replaces the fixed count limit with checkMeasured(). The passing 0482 AC1 test calls that same check with 100 additional test files naming docs/brief.md and verifies they are all selected. No upper count limit remains."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0482 AC2 test loads copies of scripts/related.mjs with each support-module rule disabled separately, and verifies that checkMeasured() fails with a support-module assertion for each mutation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "checkMeasured() verifies inclusion of every measured test naming turns.mjs; the passing 0482 AC3 test independently checks that inclusion. The recorded run includes related-0437, related-0447, related-0482 and repository checks: 132 passed, 3 skipped, zero failed. scripts/related.mjs is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The check now verifies selection rules instead of imposing a fixed test count, so adding tests no longer trips an arbitrary limit. Tests confirm it still catches both rule regressions and includes tests naming turns.mjs. The recorded checks passed, and the change stays within scope."
  }
}
```

</details>

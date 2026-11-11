---
id: "0657"
title: "Run the panel's house-rule tests before every ship"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0656"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T17:39:36.477Z"
approved: "2026-11-11T17:56:40.026Z"
finished: "2026-11-11T17:59:04.151Z"

---
# 0657 · Run the panel's house-rule tests before every ship

**Status:** ✅ done

## Problem
Since 0631, speck ships on its quick tests, which leave out every test that starts a real panel or browser. Some of those check rules for the whole panel, such as every coloured background setting its text colour (0161 AC1) and the allowed text sizes (0427 AC1), so on 2026-11-11 two panel tickets shipped breaking them, and the full suite failed on `main` afterwards, showing Needs you.

## Outcome
A build or ship that breaks one of the panel's house rules fails before review and ship, not afterwards on `main`.

## Acceptance criteria
1. `node test/support/suite.mjs --quick` always runs every file listed in `commands.checks`, heavy or not, as well as the files it runs today.
2. `commands.checks` in `speck/config.yml` lists the test files that check a rule across the whole panel, `test/panel-0161.test.mjs` and `test/panel-0427.test.mjs` among them, and each listed file exists.
3. A change that sets 13 px text where 0427 forbids it, or a coloured background with text and no text colour of its own, fails `speck test --files` with any other file, and fails the quick run.
4. No test that passed before this change fails.

## Out of scope
- Moving other heavy tests back into ships.

## Notes
- 0631 made the quick run (`--quick` in `test/support/suite.mjs`); `commands.checks` already runs alongside `speck test --files` in builds (brief: `speck test`).
- After 0656, as these rules fail on `main` until it ships.
- Failing before this build: none
- Self-check: AC3's test copies skills/ too, so in its copy of the repo only the two broken rules fail, and it now requires exactly those two; heavy checks in a quick run keep to the heavy limit, with a test.
- Also listed in commands.checks: test/panel-0543.test.mjs (the page links to nothing outside the panel) and test/panel-0577.test.mjs (fonts from the panel itself), both rules across the whole panel. The four add about 18 s to each quick run.

## In plain words
The quick tests each ship waits for now always include the panel's house rules: readable colours, allowed text sizes, no links to outside pages and fonts served by the panel itself. Before, they ran only on the full test run after a ship, so a panel change could break a rule, ship and only then turn main red. Now a build that breaks one fails its own tests before review, and a ship that would break one is refused. To see it, set a 13 px text size in one of the panel's stylesheets on a branch and run the tests: the 0427 rule fails. Each ship's tests take roughly 15 to 20 seconds longer.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 157,072
- Elapsed since build started: 17 min
- Changed lines: 31 (limit 5000)
- Follow-ups: none for the inbox.
- Known limit: the four panel rule files add roughly 15 to 20 s to every quick run and every `speck test --files`, as each starts a real panel or browser for some of its tests.
- Note: one stray whole-suite run with `node --test` (no heavy limit) during the build saw `0264 AC3: speck run doesn't put shipping on hold` fail once; it isn't related to this change and the recorded full suite passed. Worth watching for flakiness under load.

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
    "reviewed_sha": "9639524865484432e53ed0afe9889f69d332a9ad",
    "session": "fresh",
    "thread_id": "01a1cbc0-7c4c-7a10-a9d4-d6486d799512",
    "builder_response": "- Tests run: `speck test --related test/house-rules-0657.test.mjs test/house-rules-full-0657.test.mjs test/related-0447.test.mjs test/docs-0267.test.mjs` (19 files, with the commands.checks files): all pass.\n- Round 1. Notes for the reviewer:\n  - `node test/support/suite.mjs --quick` now reads commands.checks from the folder's speck/config.yml (listedChecks in test/support/suite.mjs) and adds every listed file to the run, heavy or marked full-suite only. With no speck/config.yml (every suite fixture) nothing changes. A listed file that doesn't exist fails the run with checkFiles' own message.\n  - In a quick run, heavy checks keep to the heavy limit on 8 cores or fewer (isHeavy is no longer turned off for --quick; only checks can be heavy there).\n  - checkFiles moved to scripts/checks.mjs, re-exported from scripts/turns.mjs, because 0447 AC3 forbids a test support module naming scripts/turns.mjs.\n  - commands.checks adds test/panel-0161, -0427, -0543 (no link outside the panel) and -0577 (fonts served by the panel itself).\n  - AC3's test (test/house-rules-full-0657.test.mjs) is marked full-suite only: it copies scripts/, skills/, templates/, test/support/ and the two rule files to a temp repo, adds a 13 px rule and a filled rule with no text colour, and checks both `speck test --files test/other.test.mjs` and the quick run fail on exactly those two rule tests.\n  - AC4: the related run above, plus 0657 AC4's test that the quick and full runs are unchanged without checks. The whole suite runs at ship.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 156299,
      "cached_input_tokens": 118784,
      "cache_write_input_tokens": 0,
      "output_tokens": 773,
      "reasoning_output_tokens": 28
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37515,
      "cached": 118784,
      "write": 0,
      "output": 773
    },
    "cost_usd": 0.0946384,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T17:56:26.746Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/suite.mjs runSuite includes listedChecks after quick filtering and retains heavy concurrency limits. Passing 0657 AC1 tests cover heavy and full-suite-only checks, CLI invocation, failures and missing files."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "speck/config.yml lists panel-0161, panel-0427, panel-0543 and panel-0577. Passing 0657 AC2 test verifies membership and validates every listed file through checkFiles."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0657 AC3 test in test/house-rules-full-0657.test.mjs injects both CSS violations into a repository copy. Both speck test --files test/other.test.mjs and the quick runner report exactly the two broken rules while the other test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Recorded test output confirms 299 passes, zero failures and three skips across 302 tests. Passing 0657 AC4 covers unchanged quick/full selection without checks. The shared checkFiles implementation is preserved, and no unrelated changes were found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel’s house-rule tests now run before review and shipping, including checks previously excluded as heavy. Regression tests demonstrate that both specified styling violations stop the build and quick run. The reviewed test run passed, and no blocking concerns were found."
  }
}
```

</details>

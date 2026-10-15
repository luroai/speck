---
id: "0233"
title: "Run the heavy test files a few at a time"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0229"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:58:29.681Z"
blocked_at: ""
approved: "2026-10-15T22:54:58.414Z"
waited_seconds: 2538

---
# 0233 · Run the heavy test files a few at a time

**Status:** 👍 approved

## Problem
Test files that start real processes, panels or a browser run alongside everything else, so on a small machine they slow each other down and miss their time limits. On an 8 GB MacBook Air, 26 tests failed on `main` that way, and the machine stayed fully loaded throughout the run.

## Outcome
speck's heavy test files run a few at a time while the light ones run as many at once as today.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `npm test` runs the test files listed as heavy (those that start real processes, a panel or a browser) at most 2 at a time, and the other files as many at a time as today. The list of heavy files is kept in one place.
2. One `npm test` run still runs every file in `test/` once, its output is read by speck's test summary and retry as today, and it exits with a failure when any test fails.
3. No test that passed before this change fails.

## Out of scope
- Making any single test faster.

## Notes
- 135 of the 181 test files use a support module that starts processes, panels or a browser (`test/support/procs.mjs`, `run.mjs`, `panel.mjs`, `fake-chrome.mjs` and others); not all of them are heavy.
- Builds on the test runner 0229 changes.
- Failing before this build: none
- Measured 2026-10-15 on the build box (16 cores, 14 GB): 88 test files start a real panel, browser or `speck run` (48 of them a browser). The whole suite takes 2 min 47 s today; those 88 files alone, run 2 at a time, take 9 min 21 s, using 7 min of CPU in that time, so they mostly wait rather than work. Built as written, the suite would take over 9 minutes here, every review round of every build.
- Answered 2026-10-15 (blocked question): C. Heavy files run at most 2 at a time only on machines with 8 cores or fewer (as `os.availableParallelism()` counts them); on bigger machines every file runs as many at a time as today.
- The heavy list is `test/support/heavy.mjs`: the 86 test files that call a support helper starting a real panel, browser or `speck run` (`startPanel`, `browserPage`, `startRun`, `buildPanel`, `slowPanel`, `readyPanel`, `launched`). A test fails if a test file calls one of them and isn't listed.
- With the limit on, the other files keep today's concurrency (cores − 1) and the heavy ones run in a second `run()` of their own, 2 at a time, beside them. The two runs' reports are merged into one: each top-level test's lines kept together, numbered in turn, with one plan and one set of totals.
- Self-check: no changes. Checked an empty heavy list, every file heavy, listed files that don't exist, a heavy file that can't load, a todo failure, the terminal (spec) report as well as TAP, and that every file's time is still recorded.

## In plain words
On a smaller computer, with 8 cores or fewer like the MacBook Air, speck's own test run now starts only 2 of its heaviest tests at a time: the ones that open a real control panel, a browser or an automatic build. The rest of the tests still run as many at a time as before, beside them. On bigger computers nothing changes, so the test run takes as long as it did.

To see it, run speck's tests on an 8-core machine: the heavy tests stop crowding each other out, so fewer of them miss their time limits. The test results look the same as before, with one set of totals for the whole run.

Worth keeping an eye on: a new test that opens a panel or browser must be added to the list of heavy tests; a check fails if it isn't. A bigger computer that's short of memory isn't covered (saved to the inbox).

## Blocked question
Running the 88 heavy test files 2 at a time everywhere makes the whole suite more than 3 times slower on a big machine (2 min 47 s today, over 9 minutes, measured on a 16-core box), so which do you want?
- A: 2 at a time on every machine, as written, accepting the slower suite on big machines.
- B: scale with the machine: at most a quarter of its cores at a time, and never fewer than 2 (2 on an 8-core MacBook Air, 4 on a 16-core box, roughly 5 minutes there).
- C: 2 at a time only on machines with 8 cores or fewer, and as many as today on bigger ones.

I recommend C: it fixes the MacBook Air the ticket is about with the limit the ticket asks for, and costs bigger machines nothing.

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 144,424
- Elapsed since build started: 56 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: speck/ideas/2026-10-15-also-slow-the-heavy-tests-on-machines-short-of-memory.md (a machine with more than 8 cores and little memory still starts every heavy file at once).
- Known limit: the check that keeps the heavy list complete looks for calls to the support helpers that start a panel, browser or `speck run`. A test file that starts one another way, such as spawning `speck panel` itself, isn't caught.
- Known limit: with the limit on, up to 2 heavy files run on top of the other files' usual number, so for a while the run has 2 more test processes than before.

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
    "reviewed_sha": "9ca89e5fcbc713b70f1434ef008bcbc38824e622",
    "thread_id": "01a141c5-f7e2-7700-b4b7-837b5df93eec",
    "seconds": 20,
    "usage": {
      "input_tokens": 143792,
      "cached_input_tokens": 101376,
      "cache_write_input_tokens": 0,
      "output_tokens": 632,
      "reasoning_output_tokens": 106
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:54:35.325Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/suite.mjs uses heavyLimit() and the single HEAVY list to run heavy files at concurrency 2 on machines with at most 8 cores, alongside light files at their existing concurrency. Above 8 cores it uses one unrestricted group. The five passing AC1 tests exercise these rules and list completeness."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runSuite() partitions files without duplication; merged() combines reports and totals. Passing AC2 tests verify every fixture file runs once, sequential TAP numbering, summary and retry parsing, recorded timings, and failure exits including a file that cannot load. The existing npm-test entry-point test also passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The supplied full output confirms all 18 tests in suite-0229.test.mjs and suite-0233.test.mjs passed. Existing tests were unchanged. The implementation preserves the previous runner path on larger machines; whole-suite regression checks remain the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change applies the agreed limit of two heavy test files on machines with eight cores or fewer, while preserving existing concurrency on larger machines. The targeted tests pass and verify that combined results still support summaries, retries and failure detection. No blocking concerns found."
  }
}
```

</details>

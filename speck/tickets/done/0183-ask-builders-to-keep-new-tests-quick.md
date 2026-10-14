---
id: "0183"
title: "Ask builders to keep new tests quick"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T22:11:54.010Z"
approved: "2026-10-14T23:10:18.828Z"
finished: "2026-10-14T23:10:19.493Z"

---
# 0183 · Ask builders to keep new tests quick

**Status:** ✅ done

## Problem
Every ticket adds about ten tests, and each adds about a second to a full run of speck's own suite, which every build runs three or four times. Most of the suite's time goes on tests that start real browsers, panels or `speck run`: on 2026-10-14, tests over a second each took 73% of the test time, and the 50 real-browser tests 14%. The build instructions say nothing about how quick a test should be, so builders often start a real browser or process when a quicker check would test the same thing.

## Outcome
Builders write each new test the quickest way that still really checks its criterion, so test suites grow more slowly.

## Acceptance criteria
1. `/speck-build`'s instructions, where they say to write a test for each criterion, tell the builder to check each one the quickest way that really checks it. That means calling the code directly, or using a lightweight stand-in, rather than starting a real browser, server or long-running process, unless the criterion is about that real behaviour (for example, text selection in a browser).
2. They also tell the builder to wait for something to happen, with a time limit, rather than pausing for a fixed time, and to keep any pause that shows something doesn't happen as short as the check allows.
3. The words are general, with nothing specific to speck's own repo, since the instructions are installed in every project that uses speck.
4. This repo's `AGENTS.md` names its quick options (the fake page from `fakePage()`, and calling functions in `scripts/` directly) and its slow ones (`browserPage()`, `startPanel()` and starting `speck run`), with one line on when a slow one is worth it.
5. No test that passed before this change fails.

## Out of scope
- Rewriting existing tests to be quicker.
- Having the reviewer check test speed.
- How many times a build runs the full suite.

## Notes
- The place in the instructions: section 2, "Tests first", step 1 of `skills/speck-build/SKILL.md`. `.claude/skills/speck-build` links to it.
- Related: 0182 shares one Chromium per test file, and 0117 split the slowest test file.
- From the 2026-10-14 look at test suite cost. Moving later review rounds off the full suite was considered and left out: `speck ship` has to run the full suite after any fix anyway, so it would save only about a quarter of a run per ticket.
- Failing before this build: 0173 AC2: no test in test/ checks once that a process it stopped has gone (it flags panel-0177.test.mjs:159)
- Self-check: AGENTS.md no longer claims each slow option takes a second or more (no test backs a timing); it says each starts a real process instead.

## In plain words
The instructions an agent follows when it builds a ticket now ask it to test each requirement the quickest way that still really checks it, and to avoid starting a real browser or long-running program unless the requirement is about that. They also ask it to wait for things with a time limit rather than pausing for a set time. Speck's own guide for agents now lists which of its test helpers are quick and which are slow. To see the change, read the "Tests first" part of the build instructions. Keep an eye on whether full test runs grow more slowly as new tickets ship.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 392,286
- Elapsed since build started: 58 min
- Changed lines: 6 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The 0173 AC2 test fails on the base branch because a 0177 test checks once that a stopped process has gone: speck/ideas/2026-10-14-fix-the-0177-test-that-breaks-the-0173-rule.md

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
    "reviewed_sha": "a3ffc211b8f821fada573d15cada52a3dc020684",
    "thread_id": "01a13c80-646b-7b63-aace-a8ac01a3d607",
    "seconds": 21,
    "usage": {
      "input_tokens": 127248,
      "cached_input_tokens": 88192,
      "cache_write_input_tokens": 0,
      "output_tokens": 724,
      "reasoning_output_tokens": 11
    },
    "saved_at": "2026-10-14T22:20:30.681Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md, Tests first step 1, requires the quickest meaningful check and permits real browsers, servers or processes when the criterion concerns that behaviour. The 0183 AC1 test checks this wording and passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Tests first step 1 requires waiting for an event with a time limit and keeping absence-check pauses as short as possible. The 0183 AC2 test exercises both instructions and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The added build instructions use general examples without repository-specific helpers or paths. The 0183 AC3 test checks for repository-specific references and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AGENTS.md names fakePage(), direct scripts/ calls, browserPage(), startPanel() and speck run, and explains when real behaviour warrants a slow option. All three 0183 AC4 tests passed; test/support/panel.mjs confirms the named helpers exist."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0183-tests.txt: 1,680 passed, three skipped and one failed. The sole failure is the documented pre-existing 0173 AC2 failure. No existing tests were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The build guide now asks builders to choose quick, meaningful tests and avoid unnecessary fixed waits. This repository also documents its specific testing options. The wording and tests meet the ticket; the full suite shows only the recorded pre-existing failure."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "065681d6cf6c2760c73554bf55dcbef7f8cd0a81",
    "merge": true,
    "thread_id": "01a13c80-646b-7b63-aace-a8ac01a3d607",
    "seconds": 17,
    "usage": {
      "input_tokens": 262942,
      "cached_input_tokens": 169600,
      "cache_write_input_tokens": 0,
      "output_tokens": 1372,
      "reasoning_output_tokens": 25
    },
    "saved_at": "2026-10-14T23:10:15.086Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md, Tests first step 1, retains the quickest meaningful check instruction and the exception for real behaviour. The 0183 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Tests first step 1 retains bounded event waits and short absence-check pauses. The 0183 AC2 test checks both instructions and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The added build instructions remain general, without repository-specific helpers or paths. The 0183 AC3 test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AGENTS.md retains all requested quick and slow options and explains when a slow option is warranted. All three 0183 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0183-tests.txt: 1,683 passed, zero failed and three skipped. The previously failing 0173 AC2 now passes. Its fix came from merged base commit fb4283b4; this ticket makes no further changes to those tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves the approved guidance and tests. The previously failing test was fixed separately on the base branch, and the full suite now passes. No blocking concerns remain."
  }
}
```

</details>

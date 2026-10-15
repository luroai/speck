---
id: "0235"
title: "Run only the ticket's own tests during a build"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0227"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:41:27.429Z"
approved: "2026-10-15T22:12:35.120Z"

---
# 0235 · Run only the ticket's own tests during a build

**Status:** 👍 approved

## Problem
A build runs the whole test suite before review round 1, before every later round and after each merge, and `speck ship` runs it again on the merged result before anything lands. On a laptop where the suite takes 8 minutes, that's several whole runs per ticket, and with builds side by side the machine is loaded for hours. The run at ship is the one that decides whether a ticket lands, so the others mostly repeat it.

## Outcome
A build runs only the ticket's own tests, and the whole suite runs once per ticket, in `speck ship`.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `/speck-build` and `/speck-review` tell the builder, before every review round (round 1, later rounds and merge rounds alike), to run with `speck test --files` the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run, and never to run the whole suite (`speck test` without `--files`). The builder says in each round's response file which test files it ran.
2. The reviewer prompt says the test output covers only those files, and that a criterion asking that no test that passed before fails is checked by `speck ship`'s whole-suite run: the reviewer judges it from the tests that were run and the change, and doesn't fail it for want of a whole-suite run.
3. After a hand-back for failing tests (exit 16), "Tests fail together" in `/speck-build` runs the files of the failing tests `speck ship` named, plus the ticket's own, not the whole suite. The hand-back message and those steps say the tests failed on the ticket as it would land, whether because of its own change or with the base branch's newer changes, rather than saying only that the two don't work together.
4. `docs/brief.md` and `skills/speck-build/SKILL.md` say the whole suite runs in `speck ship` and not during a build, with no line left saying a build runs it before a review round.
5. No test that passed before this change fails.

## Out of scope
- Running only the tests related to the changed files, which speck can't work out for every project.
- Changing what `speck ship` runs.
- The run before the build changes anything (0238).

## Notes
- Decided 2026-10-15: a reviewer may approve a ticket that hasn't had a whole-suite run since its last changes. The whole-suite run in `speck ship` on the merged result, and its automatic hand-back when the tests fail there while the base branch's own pass (exit 16, `scripts/hand-back.mjs`), are what catch a break elsewhere. After two such hand-backs the build blocks the ticket and asks the user.
- Widened 2026-10-15 from rounds after the first to every round, replacing this ticket's earlier criteria.
- Lines that say otherwise today: `skills/speck-review/SKILL.md` ("from the whole suite… never `speck test --files`", and "This holds for every round"), `skills/speck-build/SKILL.md` section 1 step 1 ("Every build runs the whole suite at least once per review round"), section 3 step 5, section 4 and "Tests fail together" step 2, `templates/reviewer-prompt.md`, `handBackMessage()` in `scripts/hand-back.mjs`, and the `speck test` and `/speck-build` rows in `docs/brief.md`. `test/build-0197.test.mjs` and `test/brief-0111.test.mjs` pin some of this wording; change those tests only where they pin what this ticket changes.
- This repo builds from its installed copies in `.claude/skills/`, which here link to `skills/`.
- 0227 changes the same skills and comes first.
- Failing before this build: none
- Round 1 had no response file, so AC1's "each round's response file" needed `speck review` and `speck prompt` to pass `--response` to round 1: it goes in the prompt under `## Builder response`, before the test output, so a saved round-1 prompt still gives its test output back.
- Self-check: a round-1 response is now inserted as written (no `$&` or `{{…}}` substitution), and an unreadable `--response` file gives a plain error instead of a stack trace; tests added for both.

## In plain words
A build no longer runs every test in the project before each review. It runs only the tests that belong to the ticket, the existing tests it changed and any that failed last time, and the reviewer is told that's all it saw. The full set of tests now runs once per ticket, when it ships, on the ticket as it would land. On a slow machine with several builds going, that saves several long test runs per ticket.

To see it, watch a build: before each review it runs a handful of test files rather than the whole suite, and the note it hands the reviewer lists which ones it ran.

Worth keeping an eye on: a ticket that breaks a test elsewhere is now caught at ship rather than during its build. Ship then hands it back to its build to fix, and after two such hand-backs it stops and asks you. The one full run a build still does before it changes anything is unchanged; ticket 0238 covers that.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 133,002
- Elapsed since build started: 31 min
- Changed lines: 76 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- `speck ship`'s own message for exit 16 still says the ticket and the base branch's newer changes "fail together": saved as speck/ideas/2026-10-15-say-a-ship-s-failing-tests-may-be-the-ticket-s-own.md.
- Tidy-up: the review skill's "Wait for every command you start" bullet still says test runs between rounds are "`speck test`, with or without `--files`"; between rounds they're now only `--files` runs.
- Known limit: a `claude-subagent` reviewer's round-1 response reaches it through `speck prompt --response`, but `speck record` doesn't keep it in the round's record.
- This build ran the whole suite before round 1, following the skill as it was before this change. With other builds' tests running, it took over 10 minutes, so it ran detached and was waited on.

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
    "reviewed_sha": "cf85918ad8fe3e98f6056183d5f416c72865a653",
    "thread_id": "01a1419e-f8f7-7f70-ae75-c4154d087b67",
    "seconds": 22,
    "usage": {
      "input_tokens": 132400,
      "cached_input_tokens": 81792,
      "cache_write_input_tokens": 0,
      "output_tokens": 602,
      "reasoning_output_tokens": 60
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:12:01.456Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both skills require --files with all three categories before initial, later and merge rounds, and a fresh response listing files. Passing 0235 AC1 tests check these instructions and exercise response delivery through prompt and review commands."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/reviewer-prompt.md explicitly explains the limited test coverage and ship's whole-suite gate. The passing 0235 AC2 test checks this wording."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The build skill's 'Tests fail together' steps select the named failing files plus the ticket's own. handBackMessage() and the steps describe both possible causes. Both 0235 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md and skills/speck-build/SKILL.md reserve whole-suite runs after implementation for ship, retaining the explicitly out-of-scope initial baseline run. The 0235 AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Provided test output reports 1993 passed, zero failed and three skipped. Changes to existing tests match the revised workflow; ship's test execution is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Build instructions now require selected test files before every review round, while shipping retains the whole-suite check. Reviewers receive the test-file list from round one, and failed shipping checks give clearer recovery instructions. The reported tests pass, and no blocking issues were found."
  }
}
```

</details>

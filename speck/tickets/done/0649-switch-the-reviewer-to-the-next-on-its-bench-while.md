---
id: "0649"
title: "Switch the reviewer to the next on its bench while it's limited"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0645"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:39:24.694Z"
approved: "2026-11-11T15:15:36.502Z"
finished: "2026-11-11T15:22:03.307Z"

---
# 0649 · Switch the reviewer to the next on its bench while it's limited

**Status:** ✅ done

## Problem
When the reviewer's agent is limited, every build waits at its next review round until the reset (0623), even with another reviewer on its bench ready.

## Outcome
While the reviewer's agent is limited, review rounds run on the first reviewer on its bench that's ready, not limited and not the builder's own family.

## Acceptance criteria
1. When `speck review` finds the reviewer's agent held by a recorded usage limit, it runs the round on the first agent on `reviewer_bench` that's installed, signed in, not limited and allowed to review this build under the same-model rule, in a fresh session with the full history, and records which reviewer ran it.
2. The review pack and the round's summary line say the round ran on a stand-in and why.
3. With no such agent free, it ends as 0623 does, and the build waits for the reset.
4. Once the limit has reset, rounds go back to the reviewer's own agent, in a fresh session with the full history.
5. No test that passed before this change fails.

## Out of scope
- Changing the reviewer setting itself.

## Notes
- Failing before this build: none
- Reviewer limits: `scripts/reviewer-limit.mjs` (0623); same-model rule: `scripts/same-model.mjs`; a round whose reviewer differs from the last already starts a fresh session with the full history.
- Self-check: a stand-in is no longer refused when the bench names the ticket's own reviewer (only the settings' reviewer is checked by loadConfig); a bench that can't be read when choosing a stand-in now keeps the reviewer's own limit message; added a test of a stand-in taking over from round 2.
- A round the reviewer refuses for its limit, in a build `speck run` started, is recorded as before and then runs on the stand-in straight away. A stand-in that is itself refused ends the round as 0623 does, under its own name: there's one stand-in try per round.
- Changed an existing test's setup: 0623's tests of a refused or held round now give their repo an empty list of your agents, so no agent of this machine's (such as a signed-in Claude Code) stands in for them; they still check exit 18 and that the reviewer isn't started. With that list empty, no agent is asked whether it's ready.
- Pictures: none, because the visible change is only words added to the review pack's lines, and no ticket in this repo has a round run on a stand-in to show.

## In plain words
When your reviewer hits its usage limit, reviews no longer just wait for the reset. Each review round runs instead on the first agent on the reviewer's bench that's set up, signed in, not limited itself and allowed to review the build (not the same model family as the builder, unless you allow that). It runs on that agent's own default model, and starts afresh with everything the earlier rounds said. Once the limit has reset, rounds go back to your own reviewer, again starting afresh with the full history.

To see it, look at a ticket's review pack or its review log: a round that ran on a stand-in says, for example, "claude, standing in for codex, as the codex reviewer's usage limit is reached until 16:44 UTC". The reviewer's bench is set with `speck config set reviewer_bench "claude, cursor"`; left blank, it's your agents in order.

Worth knowing: if nothing on the bench is free, the build waits for the reset as before. A round tries one stand-in only: if that one turns out to be limited too, the build waits for its reset.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Consecutive rounds on the same stand-in resume its previous session, contrary to AC1's fresh-session requirement and the printed promise.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 513,774
- Elapsed since build started: 36 min
- Changed lines: 114 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - A stand-in round clears its build's record of the reviewer's limit, so later rounds ask the limited reviewer first: saved as `speck/ideas/2026-11-11-remember-the-reviewer-s-limit-while-a-stand-in-reviews.md`.
  - A round tries one stand-in only: saved as `speck/ideas/2026-11-11-try-the-next-on-the-bench-when-a-stand-in-is-limited-too.md`.
  - 0630 AC3's full-run turn test failed once under the related run's load; skipped as it matches `speck/ideas/2026-11-11-steady-the-0630-full-run-turn-test-under-load.md`.
  - 0264 AC3's ship queue test failed once under the same load; skipped as it matches `speck/ideas/2026-11-11-steady-the-0264-ac3-ship-queue-test.md`.
  - The build and review skills still say exit 18 means the build waits; that's now only when no stand-in is free, which they read correctly as it is. A docs tidy-up at most, not saved.

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
    "reviewed_sha": "8aec4c62f82576cce6b30032734d342f0a87acd7",
    "session": "fresh",
    "thread_id": "01a1cb21-9758-7ab0-8ced-7d57d159b118",
    "builder_response": "- Tests run: `speck test --related test/review-stand-in-0649.test.mjs test/reviewer-limit-0623.test.mjs` (this ticket's tests, 0623's changed test file, and every test file naming a file this branch changed).\n- Two tests outside this change failed once under the load of the 1,574-test related run, and pass alone: 0630 AC3 (full-suite turns, in the first run) and 0264 AC3 (ship queue hand-back, in this run; already saved as a flaky idea by 0645). Neither touches the review, bench or limit code.\n- Changed an existing test's setup: 0623's tests give their repo an empty list of your agents, so no agent this machine has set up stands in for them (before that, a signed-in Claude Code on the machine running the tests took their rounds). They still check exit 18, the record and that the reviewer isn't started.\n- Design: the stand-in is chosen only after the reviewer's own round ends with exit 18, either held by another build's record (`holdOnLimit`) or refused by the reviewer itself. One stand-in try per round; a stand-in that is refused too ends the round as 0623 does.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 228158,
      "cached_input_tokens": 171520,
      "cache_write_input_tokens": 0,
      "output_tokens": 1276,
      "reasoning_output_tokens": 214
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56638,
      "cached": 171520,
      "write": 0,
      "output": 1276
    },
    "cost_usd": 0.143188,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:03:06.214Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "Selection and first takeover are covered by the passing 0649 AC1 tests. However, standInRound preserves prior sessions, and runCommandReview/runCodexReview resume a consecutive round on the same stand-in instead of starting fresh with full history."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0649 AC2 tests exercise reviewPack, printRound and close's review log, verifying the stand-in and usage-limit reason."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing '0649 AC3: with no agent on the bench free, the round ends as a refused one does' verifies exit 18, no reviewer launch, no recorded round and the reset-wait record."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing combined AC1/AC2/AC4 integration test verifies return to Codex after expiry, a fresh session and full review history."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied related run passed 1,570 tests with one reported unrelated timing failure, which the builder reports passes alone. No regression attributable to this change was identified; shipping still requires whole-suite validation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review-stand-in.mjs",
        "issue": "Consecutive rounds on the same stand-in resume its previous session, contrary to AC1's fresh-session requirement and the printed promise. standInRound leaves prior history eligible for resumption; both reviewer runners select the previous thread when reviewer and model match. A direct read-only check of resumableSession with stand-in metadata returned the previous thread C1. Existing tests only cover takeover from a different reviewer.",
        "suggested_fix": "Force stand-in rounds to start fresh and receive historyPrompt in both command and Codex runners. Add coverage for two consecutive rounds on the same stand-in while the original reviewer remains held, checking that no resume occurs and the second prompt contains the full history.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change selects eligible backup reviewers and explains why they took over. Reset waiting and return to the original reviewer are covered. One gap remains: repeated rounds on the same backup reuse its session despite the ticket requiring a fresh session with full history."
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
    "reviewed_sha": "8ddbe3d041102af4debb0bcf183379476c503719",
    "session": "continued",
    "thread_id": "01a1cb21-9758-7ab0-8ced-7d57d159b118",
    "builder_response": "- Tests run: test/review-stand-in-0649.test.mjs test/reviewer-limit-0623.test.mjs\n- F1: fixed. Every round on a stand-in now starts a fresh session with the full history, in both runners: `runCommandReview` (scripts/reviewers.mjs) no longer offers a stand-in round a session to resume, and `runCodexReview` (scripts/review.mjs) treats a stand-in round as fresh, each saying \"because it stands in for <reviewer>\". New test \"0649 AC1: each round on a stand-in starts a fresh session with the full history, the same stand-in's included\" runs two rounds on the same stand-in and checks the second isn't resumed, its prompt has the full history and its record says `session: fresh`.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 350449,
      "cached_input_tokens": 287488,
      "cache_write_input_tokens": 0,
      "output_tokens": 1799,
      "reasoning_output_tokens": 214
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6323,
      "cached": 115968,
      "write": 0,
      "output": 523
    },
    "cost_usd": 0.0294728,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:04:29.425Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "standInFor checks bench order, readiness, recorded limits and the same-model rule. Both reviewer runners now force fresh stand-in sessions with full history and record stand_in metadata. Passing AC1 tests include two consecutive rounds on the same stand-in."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests verify that printRound, reviewPack and the closing review log identify the stand-in and explain the usage limit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 integration test verifies exit 18, no reviewer launch or recorded round, and preservation of the reset-wait record when no eligible agent is free."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 integration test verifies return to the original reviewer after expiry, using a fresh session containing the earlier review history."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest supplied run reports 153 passed, zero failed and three skipped across the ticket's tests and the changed reviewer-limit test file. No regression attributable to the change was identified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review-stand-in.mjs",
        "issue": "Consecutive rounds on the same stand-in previously resumed its session instead of starting fresh with full history.",
        "suggested_fix": "Implemented in both reviewer runners; the new passing consecutive-round integration test checks no resume, full history and session: fresh.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Eligible backup reviewers now take over while the original reviewer is limited, with the reason shown in the review pack. Every backup round starts fresh with the full history, and reviews return to the original agent after reset. The previous finding is resolved; the reviewed tests pass."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "68e8d8b28cb0851d96d11f00e0236418b5c97672",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1cb21-9758-7ab0-8ced-7d57d159b118",
    "builder_response": "Merge round: main merged into the branch after ship hit a conflict.\n\n- Tests run: test/review-stand-in-0649.test.mjs test/reviewer-limit-0623.test.mjs test/usage-limit-0644.test.mjs\n- scripts/review.mjs (added-lines): both sides added an import; kept both (this ticket's review-stand-in import, main's agent-usage `keepUsage`).\n- scripts/reviewers.mjs (added-lines): the same; kept this ticket's `standInMeta` import and main's `keepUsage` import.\n- scripts/reviewer-limit.mjs (logic): main (0644) moved `reviewerRefused`/`resetIn` into limit-words.mjs and added `keepBuildUsage`; this ticket added `readLimit` to the usage-limit import. Kept all of them. Because 0644 now records a Codex or Cursor builder's usage limit as it does Claude's (`readLimit(runs, agent)`), `agentHeld` now checks the builder limit of whichever agent it's asked about, not only Claude's, so a stand-in held by its own builder limit is skipped. New test: \"0649 AC1: Codex or Cursor held by its own usage limit as a builder (0644) counts as held\".\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 511415,
      "cached_input_tokens": 427264,
      "cache_write_input_tokens": 0,
      "output_tokens": 2359,
      "reasoning_output_tokens": 214
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 21190,
      "cached": 139776,
      "write": 0,
      "output": 560
    },
    "cost_usd": 0.0619576,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:15:33.942Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "standInFor retains ordered readiness, limit and same-model checks. Both runners force fresh stand-in sessions with full history and record the reviewer used. Passing AC1 tests cover consecutive stand-in rounds and builder usage limits; agentHeld now uses main's readLimit(runs, agent)."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 integration tests verify that the review pack, printed round summary and closing review log identify the stand-in and explain why it ran."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 integration test verifies exit 18, no reviewer launch or saved round, and the reset-wait record when no eligible stand-in is available."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 integration test verifies return to the original reviewer after expiry, in a fresh session containing earlier review history."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied post-merge run reports 169 passed, zero failed and three skipped, covering this ticket, reviewer-limit behaviour and main's 0644 usage-limit tests. The resolved files retain main's keepUsage calls, keepBuildUsage integration and limit-words imports."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review-stand-in.mjs",
        "issue": "Consecutive stand-in rounds previously resumed the same session instead of starting fresh with full history.",
        "suggested_fix": "Resolved in both reviewer runners; the passing consecutive-round integration test verifies no resume, full history and session: fresh. The merge preserves this fix.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves backup reviewer selection, fresh sessions, clear explanations and return after reset. It also preserves main's usage recording and skips backups held by their own builder limits. The reviewed tests pass, with no open blocking findings."
  }
}
```

</details>

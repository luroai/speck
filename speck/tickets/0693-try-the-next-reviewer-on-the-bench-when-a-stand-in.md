---
id: "0693"
title: "Try the next reviewer on the bench when a stand-in is limited too"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-try-the-next-on-the-bench-when-a-stand-in-is-limited-too.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0692"]                # ticket ids that must be done first
created: 2026-11-15
built_on: "0692"
started: "2026-11-15T21:37:52.776Z"
approved: "2026-11-15T21:52:54.768Z"

---
# 0693 · Try the next reviewer on the bench when a stand-in is limited too

**Status:** 👍 approved

## Problem
A review round gets one stand-in from `reviewer_bench` when the reviewer is limited. If that stand-in is limited too, the round ends and the build waits for the stand-in's reset, even with a third agent free on the bench, and the refusal overwrites the record of the reviewer's limit with the stand-in's.

## Outcome
A round goes to the next agent on the bench that can take it, rather than waiting while one is free.

## Acceptance criteria
1. When the stand-in refuses a round for its own usage limit, the round runs on the next agent on `reviewer_bench` that is ready, free of a usage limit and of another family from the ticket's builder, in bench order.
2. With no agent on the bench able to take it, the build waits and is carried on after the earliest reset among the reviewer and the agents on its bench, as it would be by the one that resets first.
3. A stand-in's limit is recorded as that agent's, and doesn't replace the record of the reviewer's limit.
4. No test that passed before this change fails.

## Out of scope
- The builder's bench.

## Notes
- From 0649. Waits for 0692, which changes how the reviewer's limit is recorded.
- Failing before this build: not checked
- Self-check: no changes

## In plain words
When your reviewer has run out of usage and the first agent standing in for it has run out too, speck now hands the review to the next agent on the reviewer's bench, rather than stopping the build. Only when every agent that could review is out of usage does the build wait, and it then carries on as soon as the first of them resets, not just when the stand-in does. Each agent's limit is kept as its own, so speck still knows your reviewer is out of usage and when it resets.

To see it, put two or more agents on the reviewer's bench and let speck run build while your reviewer and the first of them are out of usage: the review should say it ran on the next one. Worth watching: speck run's status line still names your reviewer's own limit, even when the build is waiting for a stand-in's.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 164,998
- Elapsed since build started: 15 min
- Changed lines: 131 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: speck run's status line (the queue's view) names the longest limit on record, so while a build waits for a stand-in's earlier reset it still names the reviewer's own limit and time. Only the announcement and the carry-on say it's the stand-in's.
- Known limit: a stand-in's own limit is kept under its agent's name (for example `claude`), so a ticket whose reviewer is `claude-subagent` isn't held by it until it refuses itself, as before.

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
    "reviewed_sha": "ddec461c5bb8fd9acdc638587468700cff8df95e",
    "session": "fresh",
    "thread_id": "01a1e132-5f9b-71f0-8a0d-a08ed0912bba",
    "builder_response": "- Tests run: `speck test --related test/review-bench-0693.test.mjs` (162 test files: the ticket's own, every related test file and commands.checks), 1732 tests, 0 failing.\n- Round 1. A stand-in's refusal for its own limit (stopOnLimit with `standIn`) now records only that agent's own limit (reviewer-held/<agent>.json), leaving the build's record of the reviewer's limit as it was. `speck review` then tries the next agent on reviewer_bench that is ready, not held, and allowed under the same-model rule (benchFor, split out of standInFor), until one takes the round. When none can, waitForFirst rewrites the build's record, still naming the ticket's reviewer, with the times of the first limit to reset among the reviewer and the bench agents held by a limit, plus `stand_in` naming that agent when it isn't the reviewer; speck run's queue announces and carries it on from those times.\n- AC4: the related run above passed; the whole suite runs at ship. I checked the e2e AC1 test fails on the code before this change (the round ended on claude's limit).\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 164245,
      "cached_input_tokens": 113536,
      "cache_write_input_tokens": 0,
      "output_tokens": 753,
      "reasoning_output_tokens": 129
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50709,
      "cached": 113536,
      "write": 0,
      "output": 753
    },
    "cost_usd": 0.1203016,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:52:43.766Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/review.mjs cmdReview retries successive stand-ins; benchFor filters readiness and builder-family eligibility. Three passing AC1 tests cover fallback order and skipped agents."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/reviewer-limit.mjs waitForFirst selects the earliest eligible carry-on time, and reviewerLimitQueue resumes the build then. Three passing AC2 tests cover exhausted benches, existing limits and queue resumption."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "stopOnLimit passes standIn through to refuse, which preserves the build's reviewer record while saving the stand-in's own limit. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0693-tests.txt: 1732 tests, zero failures and three skips. The related tests show no regressions; the whole-suite check remains part of shipping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The review now tries the next eligible bench agent when a stand-in hits its usage limit. If none can review, the build waits for the earliest available reset. Each agent's limit stays separately recorded. The tests cover these behaviours and passed; no blocking issues found."
  }
}
```

</details>

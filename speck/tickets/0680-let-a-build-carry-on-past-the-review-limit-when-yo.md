---
id: "0680"
title: "Let a build carry on past the review limit when you say so"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0679"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:29:50.734Z"

---
# 0680 · Let a build carry on past the review limit when you say so

**Status:** 🔍 reviewing

## Problem
A ticket that reaches `limits.max_review_rounds` without approval blocks with a question, and its recommendation can be to allow another round. Answering that changes nothing: the resumed build asks for a round, `speck review` refuses with "Max review rounds reached", and the ticket blocks again with the same question. With `watch: decide`, speck can take such a recommendation up to three times in a row, each one resuming a build that can only block again.

## Outcome
Your answer to a review-limit question lets the build take two more rounds, and speck never takes that recommendation by itself.

## Acceptance criteria
1. A build that blocks at the review limit adds `Review limit: yes` on a line of its own beside its question's other facts, as the build skill tells it to, and `speck status --json` gives it as `blocked_review_limit`.
2. Once you've answered such a question, with the panel's Answer, its Go with the recommendation button or `speck answer`, the ticket may have up to 2 more review rounds: `speck next` says `fix`, and `speck review` and `speck record` accept them. If neither approves, it blocks again with `Review limit: yes`, and your next answer allows 2 more.
3. speck never goes with the recommendation of a `Review limit: yes` question by itself: with `watch: fix` or `decide` the question waits for you, and speck says why once.
4. The ticket's Review rounds, its review log and the review pack mark each of those rounds as one you allowed, `limits.max_review_rounds` in `speck/config.yml` is left as it is, and the brief's Max rounds reached line and `speck watch` row say so.
5. No test that passed before this change fails.

## Out of scope
- The extra round a ticket gets by itself when one blocking finding is left (0242).
- Merge rounds and `limits.max_merge_rounds`.
- A block for a repeated disagreement or an escalation by the reviewer: your answer resumes the build as today.

## Notes
- `nextAction` and `extraRound` in `scripts/review.mjs` enforce the limit. `goWith` in `scripts/go-with.mjs` refuses what speck may not take by itself, as it does for a size guard question that isn't a split.
- The build skill forbids a build to change `limits.max_review_rounds`, which stays. The build needs a way your answer opens instead.
- Decision: 2 rounds for each answer, enough for one fix and the round that checks it, without an endless loop.
- This repo has blocked at the review limit 5 times in its history (counted 2026-11-15), so this is about the stall each one causes, not how often it happens.
- Failing before this build: none
- Self-check: the review-limit rules moved from scripts/review.mjs into scripts/review-limit.mjs (re-exported) to keep every script under 600 lines; the test's allowance helper adds to an existing Notes section rather than adding a second one.
- Pictures: none, because nothing anyone sees in the panel changed.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "053805ea9cab941acb7b4ad50a6815de505a1370",
    "session": "fresh",
    "thread_id": "01a1dfa9-4525-7943-abb1-ae393db1fa10",
    "builder_response": "- Tests run: `speck test --related test/review-limit-0680.test.mjs` (every test file naming a changed file: 3559 passed, 3 failed in test/review-0242.test.mjs, which matched the old refusal's exact words). I kept those words (\"… Block the ticket.\") and put the review-limit hint after them, then ran `speck test --files test/review-limit-0680.test.mjs test/review-0242.test.mjs`: 162 passed, 0 failed (this round's test output).\n- Design: an answer to a `Review limit: yes` question (Go with the recommendation by the user, or `speck answer` / the panel's Answer to speck's question while the ticket is blocked there) adds `- Review limit: you allowed 2 more review rounds (<when>).` to the ticket's Notes. `allowedRounds(raw)` counts those lines × 2; `nextAction(all, cfg, allowed)` says fix while fewer rounds marked `meta.allowed` than that have been used. `speck review` and `speck record` save such rounds with `allowed: true`. limits.max_review_rounds is never touched.\n- The round-limit rules (openBlocking, isMergeRound, mergeRun, ordinaryRounds, extraRoundDue, extraRound, nextAction) moved unchanged apart from 0680's additions from scripts/review.mjs into scripts/review-limit.mjs, re-exported from review.mjs, so no script is over 600 lines (test/split-0078's check).\n- speck never takes it: fixable/decidable leave out `blocked_review_limit`; goWith refuses `by: 'foreman'`; `speck watch decide` (cantDecide) refuses; foremanFixQueue says why once per ticket with watch fix or decide.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 137964,
      "cached_input_tokens": 84480,
      "cache_write_input_tokens": 0,
      "output_tokens": 909,
      "reasoning_output_tokens": 115
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 53484,
      "cached": 84480,
      "write": 0,
      "output": 909
    },
    "cost_usd": 0.124506,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:43:26.927Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "question-facts.mjs parses reviewLimit; statusData exposes blocked_review_limit. The passing AC1 test checks both and the build skill instruction."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "Passing AC2 tests exercise goWith, review and record. None exercises the new allowance branch in foremanReply used by speck answer and the panel's Answer; the integration helper writes allowance notes directly."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 test checks fix/decide exclusion, goWith refusal and one-time queue explanation. cantDecide also refuses review-limit questions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise roundsLine, reviewPack and close's review log. The brief describes user allowances and watch refusal; the review integration test verifies config stays unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported final targeted run passed 162 tests with no failures; the earlier related run's three refusal-message failures were corrected and rerun."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/review-limit-0680.test.mjs",
        "issue": "The new speck answer / panel Answer allowance path has no test. The tests only exercise the recommendation button and manually insert allowance notes, leaving an explicit part of AC2 unverified.",
        "suggested_fix": "Exercise foremanReply or its CLI/panel entry points against a review-limit question and verify the allowance is recorded and enables two rounds. Cover dismissal and an ordinary question granting none.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md",
        "issue": "The instruction identifies exhausted review rounds by a reason starting 'No approval after', but nextAction also uses that prefix when max_merge_rounds is exhausted. It therefore tells builds to mark merge-limit questions Review limit: yes, contrary to the ticket's exclusion of merge rounds. Answers then record ordinary-round allowances that cannot unblock the merge limit.",
        "suggested_fix": "Distinguish ordinary review-limit exhaustion from merge-limit exhaustion in the instruction or structured next-action result, and test that merge-limit blocks do not receive this marker or allowance.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/review-limit-0680.test.mjs",
        "issue": "The brief test asserts the prose phrase 'review limit' in the watch row. This checks document wording rather than a command, setting or other concrete fact, which the review rules explicitly prohibit.",
        "suggested_fix": "Replace the prose assertion with a check of a concrete fact, such as the documented Review limit: yes marker, or revise the criterion to be checked by review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The recommendation button enables two more rounds, and automatic recommendations correctly wait for you. Changes are needed to verify the Answer routes, keep merge-limit questions outside this feature, and remove a fragile documentation wording test."
  }
}
```

</details>

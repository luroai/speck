---
id: "0763"
title: "Review again after an answered escalation at the review limit"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T11:39:35.777Z"

---
# 0763 · Review again after an answered escalation at the review limit

**Status:** 🔍 reviewing

## Problem
When a ticket has used its review rounds and the last round escalated a question, answering it (Go with the recommendation, `speck answer` or the panel) allows 2 more rounds, but `speck review` still refuses the next round: the escalation is checked before the rounds you allowed. 0758 is stuck on this on 2026-11-26, holding up 0762 and the 1.7.0 release.

## Outcome
An answered escalation at the review limit is followed by the review rounds the answer allowed.

## Acceptance criteria
1. When a ticket's ordinary rounds have reached `max_review_rounds`, its last round escalated, and its Notes allow more rounds than it has used, `speck review` runs the next round as an allowed round rather than refusing.
2. In that case the builder's next step, as speck works it out after the round, is to act on the answer and review again, not to block.
3. An escalation at the limit with no allowed rounds left, or with all of them used, still blocks as today, and so does an escalation before the limit that no one has answered.
4. With 5 ordinary rounds, the 5th escalated, and one "Review limit: … allowed 2 more review rounds" line in the Notes, a 6th and a 7th round can run, and an 8th is refused.
5. No test that passed before this change fails.

## Out of scope
- How many rounds an answer allows (0680).

## Notes
- Found on 2026-11-26 when 0758 blocked asking for this ticket; after it ships, 0758's question is answered saying so and its build carries on.
- `extraRound` and `nextAction` in `scripts/review-limit.mjs`: `nextAction` returns `block` for a last verdict of `escalate` before it counts the rounds `allowedRounds` allows, so `extraRound` throws.
- Failing before this build: none
- An escalation counts as answered when at least 2 allowed rounds (one answer's worth) are left unused: an escalation in an allowed round with only 1 left over from an earlier answer still blocks until it's answered again.
- Self-check: no changes

## In plain words
When a ticket has used up its review rounds and the reviewer's last round asked you a question, answering it now lets the build carry on with the extra review rounds your answer gives, instead of stopping again straight away. To see it, answer such a question (Go with the recommendation, the panel's Answer or `speck answer`): the build goes on to another review round. A question the reviewer asks in one of those extra rounds still waits for your answer before the last one runs. Once it ships, 0758's question can be answered so its build carries on.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "7ef5f8ce35d55b769d08f379175602b91cbcb3d5",
    "session": "fresh",
    "thread_id": "01a217a8-f027-7551-a6ec-d2e603558c6a",
    "builder_response": "- Tests run: test/review-limit-0763.test.mjs test/review-limit-0680.test.mjs (plus the commands.checks files speck adds)\n- Round 1. `nextAction` now returns `fix` for an escalation when the round is ordinary, ordinary rounds have reached max_review_rounds, and at least ROUNDS_ALLOWED (2, one answer's worth) allowed rounds are still unused. `extraRound` then lets the next round run as an allowed one through its existing path.\n- Why \"at least 2 left\" and not \"more than used\": an escalation in an allowed round with only 1 round left over from an earlier answer hasn't been answered yet (an answer would add 2). Requiring 2 left keeps AC3's \"an escalation no one has answered still blocks\" true there. It's recorded in the ticket's Notes.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 117786,
      "cached_input_tokens": 82688,
      "cache_write_input_tokens": 0,
      "output_tokens": 588,
      "reasoning_output_tokens": 25
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35098,
      "cached": 82688,
      "write": 0,
      "output": 588
    },
    "cost_usd": 0.0843448,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T11:41:38.057Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/review-limit.mjs: nextAction recognises an answered escalation at the limit; extraRound permits and marks the allowed round. Passing 0763 AC1 tests exercise this path."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "nextAction returns fix when at least two allowed rounds remain after an escalation at the limit. Passing 0763 AC2 tests cover the initial answer and a subsequent answer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0763 AC3 tests verify blocking with no allowance, exhausted allowance, an unanswered escalation before the limit, and only one unused round from an earlier answer."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0763 AC4 test runs rounds 6 and 7 through extraRound after five ordinary rounds, then verifies round 8 is refused. Existing 0680 tests cover parsing allowance lines from Notes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified test output reports 157 passed, zero failed and three skipped across 160 tests. The change is confined to escalation handling and its regression tests; no existing tests were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Answered escalations at the review limit now let the builder continue using the review rounds the answer granted. Unanswered escalations and exhausted allowances still block. The regression tests pass, and I found no blocking concerns."
  }
}
```

</details>

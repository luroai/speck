---
id: "0712"
title: "Point answers at the review limit to speck answer"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-let-an-answer-given-by-hand-allow-more-review-rounds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T13:44:39.001Z"
approved: "2026-11-24T13:52:24.638Z"

---
# 0712 · Point answers at the review limit to speck answer

**Status:** 👍 approved

## Problem
Only Go with the recommendation, `speck answer` and the panel's Answer add the line that opens 2 more review rounds. The speck-build skill tells you to answer in the ticket and run `/speck-build`, which resumes a build that can only block again with the same question.

## Outcome
An answer to a question at the review limit always goes through `speck answer` or the panel, so the build gets its 2 more rounds.

## Acceptance criteria
1. Where the speck-build skill tells the user how to answer a question asked at the review limit, it names `speck answer <id> "<answer>"` or the panel's Answer, not editing the ticket and running `/speck-build`.
2. The speck-build skill's resume steps tell the builder that, when resuming a ticket blocked at the review limit with no line after the block allowing more rounds, it stops and points the user to `speck answer` rather than carrying on.
3. The builder still can't write the line that allows more rounds itself: the skill doesn't tell it to.
4. No test that passed before this change fails.

## Out of scope
- A new command or ticket field for allowing more rounds.

## Notes
- `allowedRounds` (`scripts/review-limit.mjs`) counts lines written by `go-with.mjs` and `foreman-answer.mjs` (`speck answer`, the panel's Answer). The skill text is `skills/speck-build/SKILL.md`, sections on blocking and resuming.

- Failing before this build: none
- Self-check: no changes
- Pictures: none, because nothing visual changes

## In plain words
If a build stops because it ran out of review rounds, the build instructions now tell you to answer with the answer command or the panel's Answer button, because that is what gives it 2 more rounds. Editing the ticket and restarting the build used to leave it stuck on the same question. If you try that anyway, the builder now stops and points you to the right way. Nothing else changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 119,874
- Elapsed since build started: 8 min
- Changed lines: 6 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "b1340a2d12f94d4b2c08c88a66cb0d12166a7b45",
    "session": "fresh",
    "thread_id": "01a20dd3-e04d-7fa2-9509-06eb87f8f929",
    "builder_response": "- Tests run: test/skill-build-answer-0712.test.mjs test/skills.test.mjs (plus the related files via --related, which all passed; the one failure there was my naming the SKILL.md as a test file)\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 119291,
      "cached_input_tokens": 97664,
      "cache_write_input_tokens": 0,
      "output_tokens": 583,
      "reasoning_output_tokens": 44
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 21627,
      "cached": 97664,
      "write": 0,
      "output": 583
    },
    "cost_usd": 0.0588504,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:52:20.208Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md sections 4 and 6 explicitly direct review-limit answers through speck answer or the panel's Answer. The passing 0712 AC1 test checks both sections."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Pre-flight step 2 explicitly stops a review-limit-blocked resume without a subsequent allowance line and directs the user to speck answer or the panel. The passing 0712 AC2 test checks the resume instructions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 4 retains the explicit prohibition against the builder writing the allowance line. The passing 0712 AC3 test checks this prohibition."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified recorded test output: 156 passed, 3 skipped, no failures. Changes are confined to the skill instructions, their tests and ticket metadata; no runtime code changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The instructions now direct review-limit answers through the command or panel that grants two more rounds, and tell builders to stop if that permission is missing. Builders remain forbidden from granting themselves extra rounds. The relevant tests pass, and no blocking concerns were found."
  }
}
```

</details>

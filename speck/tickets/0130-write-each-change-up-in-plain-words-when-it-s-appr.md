---
id: "0130"
title: "Write each change up in plain words when it's approved"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:03:34.983Z"

---
# 0130 · Write each change up in plain words when it's approved

**Status:** 👍 approved

## Problem
Everything a build leaves behind (the review pack, the review rounds, the delivery log) is written for someone who reads code. A user who doesn't can't tell from it what actually changed for them or how to see it for themselves.

## Outcome
Every ticket the builder takes to approval has a short account of the change in plain words, written into the ticket by the builder.

## Acceptance criteria
1. The ticket template has an `## In plain words` section, empty apart from a comment saying the builder fills it in before approval, so `speck new` creates tickets with it.
2. The `/speck-build` skill tells the builder to fill in `## In plain words` before it runs `speck close`, covering: what's different for someone using the product, how to see the change for yourself, and anything worth keeping an eye on.
3. The skill tells the builder to write that section for someone who doesn't read code: no file paths, code, function names or test names.
4. `speck lint` neither fails nor warns on a ticket whose `## In plain words` section is empty or missing, so draft tickets and tickets made before this change still pass.
5. No test that passed before this change fails.

## Out of scope
- Showing the section in a review pack: that's 0131.
- Making `speck close` refuse a ticket without it.
- Writing it up for tickets already shipped.

## Notes
- The builder writes it, not the reviewer, because the builder knows what it changed and why. The reviewer's summary stays as it is.
- Failing before this build: none
- AC4 was already met before this build: lint only checks the sections it knows, so its tests passed from the start and guard it from now on.
- Self-check: moved the instruction into section 5 step 1, after the follow-ups, because an existing test needs follow-ups to come before `speck close` there.

## In plain words
Every new ticket now has a short "In plain words" part, and the builder fills it in just before the ticket is approved. It says what changed for someone using speck, how to see it for yourself and anything to watch, without any code talk. To see it, open this ticket: this part is the first one written that way. Make a new ticket and you'll find the empty part waiting there. Older tickets don't have it, and that's fine: nothing complains about it being missing or empty. For now it lives only in the ticket; showing it in the review pack comes in a later ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 120,410
- Elapsed since build started: 4 min
- Changed lines: 7 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Tidy-up: the "How to read a ticket" list in `speck/README.md` doesn't mention the new `## In plain words` section yet.

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
    "reviewed_sha": "feddf0a8f0e8fde6754aae61953ce48cb127a52c",
    "thread_id": "01a13183-3611-7b23-ada5-ea223a3864ef",
    "seconds": 30,
    "usage": {
      "input_tokens": 119705,
      "cached_input_tokens": 83712,
      "cache_write_input_tokens": 0,
      "output_tokens": 705,
      "reasoning_output_tokens": 23
    },
    "saved_at": "2026-10-12T19:07:55.005Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/ticket.md adds the comment-only section. scripts/speck.mjs reads that template when creating tickets. Both AC1 tests pass, including the real speck new integration test."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 5 step 1 requires all three requested topics before speck close and commits the completed section. Both AC2 tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md explicitly addresses someone who doesn't read code and prohibits file paths, code, function names and test names. The AC3 test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 integration tests invoke speck lint on tickets with an empty or missing section, checking successful exit and no warnings. Both pass; lint implementation remains unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0130-tests.txt: 1165 tests, 1162 passed, 3 skipped, zero failures. Existing tests were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "New tickets now include space for a plain-language account, and builders are instructed to complete it before approval. It covers what changed, how to try it and anything to watch. Older tickets remain compatible, and the full test suite passes. No blocking concerns found."
  }
}
```

</details>

---
id: "0712"
title: "Point answers at the review limit to speck answer"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0712 · Point answers at the review limit to speck answer

**Status:** 📝 draft

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

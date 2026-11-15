---
id: "0680"
title: "Let a build carry on past the review limit when you say so"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0680 · Let a build carry on past the review limit when you say so

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

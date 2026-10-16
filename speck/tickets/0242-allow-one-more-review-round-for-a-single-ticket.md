---
id: "0242"
title: "Allow one more review round for a single ticket"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-allow-one-more-review-round-without-editing-config.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0241"]                # ticket ids that must be done first
created: 2026-10-16

---
# 0242 · Allow one more review round for a single ticket

**Status:** 📝 draft

## Problem
When a build blocks at the review round limit and the user answers "give it one more round", the builder has to raise `limits.max_review_rounds` in `speck/config.yml` for every ticket and remember to put it back. It happened on 0218 on 2026-10-16, and on 0008, 0011 and 0061 before.

## Outcome
The user can allow more review rounds for one ticket, without changing the limit for any other.

## Acceptance criteria
1. A ticket's `max_review_rounds` field, when it's a whole number of 1 or more, is that ticket's limit on review rounds in place of `limits.max_review_rounds` in `speck/config.yml`: `speck review` and `speck record` accept rounds up to it, `speck next` says `block` only after it, and the review pack's "round N of M" names it. A ticket with no such field, or a blank one, uses the config limit as today.
2. `speck set <id> max_review_rounds <n>` sets it, and refuses anything but a whole number of 1 or more with a plain message. `speck lint` reports an error for any other value already in a ticket. Other tickets and `speck/config.yml` are unchanged.
3. The ticket's Delivery log, written by `speck close`, says when the ticket's own limit was used and what it was.
4. The build skill says: when a build blocks because it reached the round limit, the question offers more review rounds as one of the options; when the user's answer allows them, the builder runs `speck set <id> max_review_rounds <n>` (the review rounds so far that count towards the limit, plus the rounds allowed: one unless the user says otherwise) and records the answer in the ticket's Notes. It never raises the limit otherwise, and never changes `limits.max_review_rounds` in `speck/config.yml` to get past a block.
5. No test that passed before this change fails.

## Out of scope
- A panel button or field for it.
- A per-ticket limit on merge rounds (`max_merge_rounds`).
- How re-reviews after an approval are counted (0241).

## Notes
- The limit is read in `reviewSetup()` and `nextAction()` in `scripts/review.mjs`, and shown in `scripts/pack.mjs`. `speck set`'s checks are `checkSetValue()` and `checkSetTicket()` in `scripts/speck.mjs`; the ticket field checks `speck lint` runs are in `scripts/core.mjs` (as for `reviewer_effort`).
- The field follows `reviewer_model` and `reviewer_effort`: a ticket value in place of the config one.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

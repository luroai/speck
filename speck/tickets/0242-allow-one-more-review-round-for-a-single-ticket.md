---
id: "0242"
title: "Give a ticket one extra review round when it's one finding from approval"                # one outcome, no "and"
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
# 0242 · Give a ticket one extra review round when it's one finding from approval

**Status:** 📝 draft

## Problem
A build that reaches the review round limit blocks, even when the reviewer has only one finding left. The user then has to step in just to allow one more round, which means raising `limits.max_review_rounds` in `speck/config.yml` for every ticket and putting it back. It happened on 0218 on 2026-10-16, and on 0008, 0011 and 0061 before.

## Outcome
A ticket that's one finding from approval at the round limit gets one more review round by itself, and blocks only if that round doesn't approve.

## Acceptance criteria
1. When a ticket's review rounds that count towards `max_review_rounds` reach it, and the last of them didn't approve but left no more than one blocking finding open, `speck next` says `fix` instead of `block`, and `speck review` and `speck record` accept one more round: the extra round.
2. A ticket gets at most one extra round. If the extra round doesn't approve, `speck next` says `block`. A round at the limit that left two or more blocking findings open blocks as today, and so does an escalation or a repeated dispute, whether or not it's in the extra round.
3. The review pack names the extra round (for example "round 4 of 3, an extra round"), and the ticket's Delivery log, written by `speck close`, says when the ticket had one.
4. The build and review skills say the builder takes the extra round like any other, without asking the user, and never changes `limits.max_review_rounds` in `speck/config.yml` to get past a block.
5. No test that passed before this change fails, except checks that a ticket blocks at `max_review_rounds` with no more than one blocking finding open, which are changed to check AC1.

## Out of scope
- A panel button, a setting or a ticket field for extra rounds.
- Extra merge rounds (`max_merge_rounds`).
- How re-reviews after an approval are counted (0241).

## Notes
- Asked for 2026-10-16: "if it warrants an extra round it should be done automatically, then if we need another after that, then the ticket stops." "Warrants" is read as the round at the limit leaving no more than one blocking finding open.
- The limit is applied in `reviewSetup()` and `nextAction()` in `scripts/review.mjs`, and shown in `scripts/pack.mjs`; the Delivery log's rounds line is `reviewTotals()` in `scripts/pack.mjs`, written by `scripts/close.mjs`.
- 0218 would have qualified: its round 3 left one blocking finding (F2) open.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0241"
title: "Give every re-review after an approval rounds of its own"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-16-give-a-handed-back-ticket-s-re-review-rounds-of-its-own.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16

---
# 0241 · Give every re-review after an approval rounds of its own

**Status:** 📝 draft

## Problem
When a ticket's ship is refused after approval and the builder fixes it without merging anything new from the base branch (for example a test its own change broke), its re-review counts towards `max_review_rounds`. A ticket approved in its last allowed round then blocks on a tiny fix, as 0223 did on a three-line rename, and only the user can unblock it.

## Outcome
Every review round that follows an approved round has rounds of its own, whether or not the branch merged the base branch in.

## Acceptance criteria
1. A review round whose previous round approved is a merge round, whether or not the branch merged the base branch in since that round. Like every merge round today, it and the rounds after it until one approves don't count towards `max_review_rounds` and are capped by `limits.max_merge_rounds`. This holds for rounds run with `speck review` and rounds saved with `speck record`.
2. For example, with `max_review_rounds: 3`, a ticket approved in round 3 whose code then changes, with no merge, can have round 4 reviewed and approved, and `speck next` then says `ship`.
3. When the branch didn't merge the base branch in, the reviewer is given the changes since its last review, as in any later round, and isn't told that the round follows a merge.
4. The brief's "Merge rounds" paragraph says a round is a merge round whenever the round before it approved. No test that passed before this change fails, except checks that a round after an approval without a merge counts towards `max_review_rounds`, which are changed to check AC1.

## Out of scope
- One extra review round for a ticket that reaches the round limit one finding from approval (0242).
- Renaming merge rounds, or changing how they're marked in the Review rounds, the review log or the review pack.
- Any change to rounds that don't follow an approval.

## Notes
- The rule is `isMergeRound()` in `scripts/review.mjs`, which today also needs `merged` from `reviewSince()`; `speck record` works it out on its own path in the same file. 0097 set today's rule.
- Seen on 0223 (2026-10-16): its ship failed on a test its own change broke while main hadn't moved, so there was nothing to merge.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

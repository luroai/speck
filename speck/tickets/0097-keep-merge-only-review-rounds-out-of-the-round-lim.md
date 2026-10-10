---
id: "0097"
title: "Keep merge-only review rounds out of the round limit"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:16.364Z"

---
# 0097 · Keep merge-only review rounds out of the round limit

**Status:** 🔨 building

## Problem
When an approved ticket has to merge the base branch in before it can ship, the reviewer checks the merge in another round, and that round counts towards `max_review_rounds`. A ticket approved in its last allowed round then can't be re-reviewed at all, as 0086 found on 2026-10-10, and someone has to raise the limit by hand.

## Outcome
A review round that checks only a merge after an approval doesn't count towards `max_review_rounds`. Merge rounds have a small limit of their own.

## Acceptance criteria
1. A round is a merge round when the branch merged the base branch in since the previous round and that previous round approved. `speck review` and `speck next` don't count merge rounds towards `max_review_rounds`.
2. A new setting, `limits.max_merge_rounds` (default 2), caps merge rounds in a row. When it's reached without an approval, `speck next` says `block` with a plain reason. `speck config set` accepts it like the other limits.
3. The ticket's Review rounds, its review log and the review pack mark merge rounds as merge rounds.
4. The rule on repeated disputes still applies across merge rounds, and ordinary rounds work as before.

## Out of scope
- Who runs the merge and the round (0101).

## Notes
- speck already detects a merge since the last round (`merged` in `reviewSince`) and tells the reviewer.
- Replaces `speck/ideas/2026-10-09-allow-one-more-review-round-without-editing-config.md`.
- Interpretation of AC1 with AC2: a merge round that doesn't approve is followed by a fix round re-reviewing the same merge. Taken strictly, AC1 would make that an ordinary round, which a ticket approved in its last allowed round can't have (the 0086 problem again), and "merge rounds in a row without an approval" could then never exceed one. So the rounds after a merge round, until one approves, are merge rounds too (`isMergeRound` in `scripts/review.mjs`), and `max_merge_rounds` caps that run. An approval ends the run, so a later merge starts a new one.
- Merge rounds are recorded as `"merge": true` in the round's meta. Rounds saved before this change have no flag and count as ordinary rounds.
- The 0048 test of the Delivery log after a merge re-review now expects `- Review rounds: 2, 1 of them a merge round`, the AC3 wording for its merge round.
- Self-check: `speck record` now looks up whether the base branch was merged in only when the previous round approved, so a record that isn't after an approval can't fail on that lookup.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

# Give a handed-back ticket's re-review rounds of its own

Captured: 2026-10-16 · Status: ticketed (0241)
From ticket: 0223

## What
When `speck run` hands an approved ticket back because its ship failed, the re-review after the fix should count as a merge round (with `max_merge_rounds`), whether or not the build merged in new commits from the base branch.

## Why
Today a re-review after an approval only gets its own allowance when the branch merged the base branch in since the last round. 0223's ship failed on its own change while main hadn't moved, so there was nothing to merge, its re-review counted towards `max_review_rounds`, and having used all 3 it blocked on a three-line rename. The user had to raise the limit for it.

## Notes
- `isMergeRound()` in `scripts/review.mjs` decides by `merged` alone; the ship record (`hand_backs` in the run record) already says a ticket was handed back.
- Related: speck/ideas/2026-10-09-allow-one-more-review-round-without-editing-config.md (dropped), which also came up again on 0218 today.

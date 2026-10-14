# Ship a simple merge without another review

Captured: 2026-10-11 · Status: ticketed (0192)

## What
Let `speck ship` accept a ticket that merged the base branch in after it was approved, without another review round, when every conflict in that merge was `added-lines` or `lockfile` (as `speck merge-check` classes them) and the tests pass.

## Why
Today `speck ship` refuses any ticket whose files outside `speck/` changed after the reviewer approved it (`shipChecks` in `scripts/ship.mjs`), and merging the base branch in always changes them. So every conflict merge, however simple, costs a merge round before it can ship.

## Notes
- Comes from 0101's blocked question (options b and c). 0101 went with option (a): the `speck-integrate` skill sends every conflict merge to a merge round, which doesn't count towards `max_review_rounds` (0097).
- The original shipping agent idea (`speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md`) wanted these simple conflicts handled with no extra review. This is the part 0101 left out.
- That ship check is what guarantees nothing ships unreviewed, so loosening it needs care.
- Open question: how does `speck ship` know which conflicts the merge had, and that the resolution kept both sides rather than editing them? Does it re-run `merge-check` against the approved commit, or trust a record the shipping agent wrote?
- Open question: should `speck/config.yml` have a setting to turn this off, for people who want every merge reviewed?

# Say what a merge-round run re-reviewed when it blocks

Captured: 2026-10-16 · Status: dropped
Triaged: 1
From ticket: 0241

## What
When `limits.max_merge_rounds` merge rounds in a row don't approve, `speck next` blocks with "No approval after N merge rounds in a row re-reviewing the merge of <base branch>". Since 0241, a run of merge rounds can follow a fix after an approval with no merge at all, so the reason should name what was re-reviewed (a merge, or changes after the approval).

## Why
A user reading the blocked ticket after a fix-only run is told about a merge that never happened, which sends them looking for the wrong cause.

## Notes
- From the builder's self-check on 0241. The message is in `nextAction()` in `scripts/review.mjs`; test/review-0097.test.mjs checks its opening words.

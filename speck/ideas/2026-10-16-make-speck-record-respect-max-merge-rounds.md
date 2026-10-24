# Make speck record respect max_merge_rounds

Captured: 2026-10-16 · Status: dropped
Triaged: 1
From ticket: 0242

## What
`speck record` should refuse a merge round once `limits.max_merge_rounds` merge rounds in a row haven't approved, as `speck review` already does, and record nothing.

## Why
A build using a reviewer subagent records its rounds with `speck record`, so it can keep recording merge rounds past the limit until one approves, while a Codex or command reviewer is stopped. The limit then only holds for some reviewers.

## Notes
- Builder's own note while building 0242, which made `speck record` check `max_review_rounds` and the extra round, but left merge rounds out of scope.
- The merge-round check is in `reviewSetup()` in `scripts/review.mjs`; it could share a guard with `cmdRecord()` the way 0242's `extraRound()` does.

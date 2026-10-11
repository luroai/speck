# Let merge-check check against the remote's base branch

Captured: 2026-10-10 · Status: inbox
Triaged: 1
From ticket: 0098

## What
`speck merge-check <id>` always checks the merge of the local base branch. Let it take the ref to check against (for example `origin/main`), or fetch the way `speck ship` does, so it checks the same commits a ship would merge.

## Why
When `speck ship` catches up with the remote before merging, its exit-13 message tells the build to merge `<remote>/<base_branch>`, which the local base branch may not have yet. Run then, merge-check reports on the wrong commits, and the shipping agent (0101) could miss a conflict or classify it wrongly.

## Notes
- From the builder's own note on 0098, after approval. Open question: an optional `--onto=<ref>` argument, or fetching inside merge-check (which changes remote-tracking refs, so it's no longer read-only).

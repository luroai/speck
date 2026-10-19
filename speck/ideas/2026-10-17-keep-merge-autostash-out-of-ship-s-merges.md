# Keep merge.autoStash out of ship's other merges

Captured: 2026-10-17 · Status: inbox
Triaged: 1
From ticket: 0265

## What
`speck ship`'s other merges where the base branch is checked out, the fast-forward that catches up with the remote and the merge of the ticket itself, should pass `--no-autostash`, as 0265's merge of the remote's base branch does.

## Why
With `merge.autoStash` set in git's config, git can stash uncommitted edits, move the base branch, then put the edits back with conflicts instead of refusing. Someone working in the base branch's checkout while builds ship would find their edits conflicted, and ship's checks for files in the way would be skipped.

## Notes
- From review round 1 of 0265 (finding F1), which fixed it only for the new merge in `scripts/ship-remote.mjs`. The catch-up and ticket merges in `scripts/ship.mjs` still inherit the setting. Not yet checked whether ship's own undo puts things right afterwards.

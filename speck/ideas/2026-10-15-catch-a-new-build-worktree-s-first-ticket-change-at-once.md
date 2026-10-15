# Catch a new build worktree's first ticket change at once

Captured: 2026-10-15 · Status: inbox
From ticket: 0187

## What
A ticket changed in a build's worktree straight after the worktree is made should reach the panel within a second every time, not just most times.

## Why
Under full-suite load, the 0187 AC1 check "a ticket changed in a build's own worktree, made after the panel started, reaches an open stream within 1 second" now and then misses its 1-second limit. It failed once in a `/speck-ship 0187` run and passed when run alone and in later full runs. If the cause is real, a build's first status change (`speck start` writes it just after making the worktree) could show on the panel up to 15 seconds late.

## Notes
- From 0187's ship refusal, after main was merged. Not investigated to the end.
- Likely cause (unconfirmed): the panel watches a folder that doesn't exist yet through its parent. If the worktree's `speck/tickets` appears between the panel's check for it and that watch starting, its creation is missed until the next look, every 5 seconds, and an edit made in that gap shows only at the 15-second re-read. A slow board reading under load (some took about 1.5 seconds) could add to it.
- Possible fix: after starting new watches, look again at once, and read the board in case something changed before they started.

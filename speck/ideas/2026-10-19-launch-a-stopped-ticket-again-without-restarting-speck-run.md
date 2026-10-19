# Launch a stopped ticket again without restarting speck run

Captured: 2026-10-19 · Status: inbox
From ticket: 0327

## What
When `speck stop` ends a build and its ticket is later set ready again and committed, the speck run that launched it should launch it again on its next check, as 0327 now does for a build that never started its ticket.

## Why
speck run keeps every ticket it launched in its `launched` list, and a stopped one is never taken off it, so it's held until speck run restarts, even though speck run says it's waiting for the ticket to be set ready again and committed. Someone who stops a build and sets it ready again sees nothing happen.

## Notes
- From my own note while building 0327: `ownWait` in `scripts/run.mjs` checks `launched` before `heldByStop`, so `heldByStop`'s commit check only takes effect after a restart.
- Not the same as `speck/ideas/2026-10-10-put-a-stopped-build-back-in-the-queue.md` (dropped), which is about how to set such a ticket ready.

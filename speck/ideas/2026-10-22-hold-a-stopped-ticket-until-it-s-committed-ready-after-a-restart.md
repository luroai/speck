# Hold a stopped ticket until it's committed ready, after a restart

Captured: 2026-10-22 · Status: dropped
From ticket: 0376

## What
A speck run that was restarted after `speck stop` ended a build should wait, as the speck run that stopped it now does, until the ticket has been committed ready again before launching it.

## Why
After a restart, speck run counts the stop's own commit, which blocks the ticket, as the ticket being committed again. With worktrees on, the base branch still has the ticket committed as ready, so a stopped ticket set ready in its worktree but not committed is launched straight away. Someone who's still editing the ticket gets a build they didn't ask for yet.

## Notes
- From the builder's own note on 0376: `heldByStop` in `scripts/build-records.mjs` compares only commit hashes. 0376's `readyAfterStop` also checks that the last commit has the ticket ready, and could replace it for a ready ticket.
- Without worktrees, the check that the ticket is committed as ready on the base branch already holds it.

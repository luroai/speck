# Drop a waiting watch resume once the ticket has moved on

Captured: 2026-11-09 00:09 · Status: ticketed (0618)
From ticket: 0567
Raised by: agent

## What
When the watch agent asks for a build to be resumed and speck run has to wait for a free build slot, drop that resume if the ticket has moved on in the meantime, as a waiting `decide` now is.

## Why
A waiting resume can restart a build the user has already carried on by hand, or one on a ticket that has since finished. It wastes a run and can act on an old instruction.

## Notes
- From round 1 of 0567's review. 0567 fixed this for `speck watch decide` only, as `speck watch resume` was out of its scope.
- The check is `movedOn` in `foremanAgentQueue`, in `scripts/foreman-agent.mjs`. A resume would need to keep its commit, session and status as `decide` does.

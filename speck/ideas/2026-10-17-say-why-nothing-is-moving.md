# Say why nothing is moving

Captured: 2026-10-17 · Status: idea

## What
When tickets are ready but aren't building or shipping, speck tells you why in plain words, without you reading `run.log`. Maybe as a general status that comes back from speck run: one line on what it's doing now, and on each waiting ticket, what it's waiting for. The user isn't sure yet how.

## Why
On 2026-10-17 it was confusing three times in one morning, and each time the reason was only in `speck/.cache/runs/run.log`:
- 0257 sat approved overnight because local `main` and `origin/main` had diverged, so its ship was refused and the queue waited for a new commit.
- Shipping was on hold for a failing `main`, which also held up the fix ticket 0262.
- 0268 and 0269 were ready, with 0258 shipped, but didn't start because speck run was waiting for 0265's build to end before switching to its new code.

## Notes
- Examples of reasons: waiting for a ticket in `after:`; all build slots are in use; speck run is off; speck run is switching to new code once named builds end; shipping is on hold until `main` has a new commit; a ship was refused and is waiting for `main` or the branch to have a new commit, with the refusal.
- Related: 0105 shows the ship queue and its hold in the panel; `speck/ideas/done/2026-10-15-say-an-auto-ship-ticket-waits-for-speck-run-when-it-s-off.md`.
- Open: where it shows: a line at the top of the panel, on each ready or approved ticket's card, in `speck status`, or all of them?
- Open: does speck run write its current state somewhere the panel and `speck status` read, rather than each working it out?
- Open: should it tell you when something has been stuck a long time (a push notification, say), or only when you look?

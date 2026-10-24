# Push a handed-back pull request again

Captured: 2026-10-19 · Status: dropped
From ticket: 0323

## What
In pull request mode, once a ticket handed back for a conflict has merged the base branch in and been approved again, speck run should push the new commits to its pull request, so the next ship can merge it.

## Why
Today nothing pushes them: speck run's next ship refuses because the branch has commits its pull request doesn't, and says to run `speck pr`. An auto-shipped ticket then sits approved until someone does, which is the stall 0323 set out to end.

## Notes
- From 0323's self-check. The pull request queue only runs `speck pr` for a ticket with no pull request link yet. Open question: should the queue run `speck pr` again when the branch is ahead of its pull request, or should `speck ship --auto` push it, as it already does for the commit that files the ticket as done?

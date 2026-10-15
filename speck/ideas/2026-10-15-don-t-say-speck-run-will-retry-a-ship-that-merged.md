# Don't say speck run will retry a ship that merged

Captured: 2026-10-15 · Status: inbox
From ticket: 0204

## What
When an auto-ship merges a ticket but can't push, speck run's log says the ticket "didn't ship" and that it will try it again once the base branch or its branch has a new commit. The ticket is done, so speck run never tries it again. The log should say it merged but wasn't pushed, and how to push it.

## Why
Someone reading speck run's output is told to wait for a retry that never comes, while the remote stays behind.

## Notes
- From the builder's own note while building 0204: the panel and `speck status --json` now say "Merged, but not pushed", but speck run's ship queue message wasn't in that ticket's scope.

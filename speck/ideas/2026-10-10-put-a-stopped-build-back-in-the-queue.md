# Put a stopped build back in the queue

Captured: 2026-10-10 · Status: dropped
From ticket: 0108

## What
Give a clear way to put a build ended by `speck stop` back in `speck run`'s queue. `speck run` says it won't relaunch such a ticket "until its ticket is set ready again and committed", but that ticket lives in its worktree on the ticket branch, where `speck set <id> status ready` now refuses (0108 commits only on the base branch), and the base branch's copy already says ready.

## Why
Someone who stops a build and later wants `speck run` to pick it up again has no speck command that does it, so they edit and commit the ticket by hand, the kind of improvising 0108 set out to stop.

## Notes
- From my own note while building 0108. Resuming the session or running `/speck-build <id>` still works.
- Open question: should this be `speck play`, a `speck requeue <id>`, or `speck set` allowed in the build's own worktree?

# Hold the pull request queue while the main checkout is bare

Captured: 2026-11-24 20:47 · Status: ticketed (0750)
From ticket: 0740
Raised by: agent

## What
In pull request mode, have speck run's pull request queue hold its merges while the main checkout's `core.bare` is true, as the local ship queue does since 0740, and try them again once it's set back.

## Why
`speck ship` now refuses while the main checkout is bare, in either ship mode. The local ship queue doesn't count that as a try, so it ships once `core.bare` is set back. The pull request queue does count it, so after you set it back a ticket waits until its pull request, the base branch or its branch changes, and auto-ship looks stuck.

## Notes
- From 0740's build, noticed while adding the check to `testLanding()` in `scripts/pr-ship.mjs`. The pull request queue is in `scripts/pr-queue.mjs`.

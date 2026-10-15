# Fix the race in the 0153 second-ship test

Captured: 2026-10-15 · Status: inbox
From ticket: 0193

## What
The test "0153 AC2: a second speck ship for the same ticket refuses, saying a ship is already running, and changes nothing" takes its snapshot as soon as the first ship's record appears. It should wait until the first ship has reached its tests (the gate's `reached` file), so the first ship's own checkout of the worktree isn't counted as a change.

## Why
Under the full suite's load the first ship can still be checking out the ticket's worktree when the snapshot is taken, so the test fails with "nothing changed" though nothing is wrong. A flaky test fails builds and ships for no reason.

## Notes
- Seen once in a full-suite run during 0193's build; it passed 4 times out of 4 run on its own, with and without 0193's change.
- 0195 (retry failing tests once) would hide it, not fix it.

# End a stalled test run's detached processes too

Captured: 2026-10-15 · Status: inbox
From ticket: 0180

## What
When a test run stalls, speck ends only the test command's process group. It should also end processes the tests started in a group of their own, or whose parent has already exited, as the reviewer time limit now does.

## Why
A stalled run can leave background processes running for good, using memory and slowing later runs and builds on the same machine.

## Notes
- From the 0180 review: Codex found the reviewer limit missed detached and orphaned processes, fixed there by also ending descendants found with `ps` and processes carrying a per-run environment marker. The test stall handling from 0152 still uses the process group alone.
- Open question: share one helper between the stall and reviewer-limit scripts rather than copying the code.

# Steady the 0630 full-run turn test under load

Captured: 2026-11-11 11:12 · Status: inbox
From ticket: 0632
Raised by: agent

## What
The test "0630 AC3: a full run doesn't wait for the max_parallel_tests turns, so it takes none a ship or build waits for" should wait for the held turn with a time limit rather than a fixed timing, so it passes on a busy machine.

## Why
It failed once ("it didn't wait for the held turn") in a 222-file related run during 0632's build, and passed alone three times. A ship whose suite includes it could be handed back for a failure that isn't real.

## Notes
- Seen in 0632's first related run; the change there didn't touch turns or the full run.

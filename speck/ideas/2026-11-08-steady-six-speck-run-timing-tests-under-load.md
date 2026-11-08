# Steady six speck run timing tests under load

Captured: 2026-11-08 23:25 · Status: inbox
From ticket: 0565
Raised by: agent

## What
Make these tests hold up on a busy machine, waiting on what they check rather than on a fixed time or a tight tolerance: 0549 AC4, 0217 AC3, 0109 AC1, the two 0166 AC2 tests and 0300 AC1, AC3.

## Why
A build running its related tests sees them fail for no reason, and has to spend time showing that to its reviewer. A failure like that can also hide a real one.

## Notes
- From 0565's build: they failed in two related runs at load averages of 21 to 59, a different set each time, and all passed when run again.
- 0166 AC2's failures were a few seconds outside its tolerance ("186 isn't about 180", "246 isn't about 240").

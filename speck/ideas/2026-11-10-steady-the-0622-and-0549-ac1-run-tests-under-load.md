# Steady the 0622 and 0549 AC1 speck run tests under load

Captured: 2026-11-10 23:29 · Status: inbox
From ticket: 0625
Raised by: agent

## What
Make two tests hold up on a busy machine: "0622 AC1 AC2 AC3: a build that hit the limit while speck run was off" and "0549 AC1, AC3, AC5: speck run starts each build with the settings as they are then".

## Why
A build running its related tests sees them fail for no reason and has to show that to its reviewer. A failure like that can also hide a real one.

## Notes
- From 0625's build: each failed once in a related run at load averages of 20 to 26, and passed three times out of three by itself.
- The 0622 test sets the limit to reset three seconds ahead, so a speck run that takes longer than that to start misses the wait.
- Close to `speck/ideas/2026-11-08-steady-six-speck-run-timing-tests-under-load.md`, which names 0549 AC4 but not these two.

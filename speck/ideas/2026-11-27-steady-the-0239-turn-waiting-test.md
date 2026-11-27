# Steady the 0239 turn-waiting test

Captured: 2026-11-27 01:17 · Status: inbox
From ticket: 0771
Raised by: agent

## What
"0239 AC1: speck test --files waits for a turn held by another run, says so once, then runs and records no full run's result" holds a test turn for only 1.5 seconds. Make it hold the turn until speck test has said it's waiting, or long enough for a busy machine, while still failing when speck test doesn't wait.

## Why
On a busy machine speck test can take longer than 1.5 seconds to start, find the turn already free and never wait, so the test fails for no fault. It failed that way once in 0771's related run, under a load average of about 95 (its output was only "ran a.test.mjs"), and passed when run again. Any build whose related tests include it can go red for nothing.

## Notes
- My own note from 0771's build, not a review finding. The hold is `holdTurnFor(dir, 1.5)` in test/turns-0239.test.mjs.
- 0775 steadies the 0067 panel restart tests the same way; this one isn't in its scope.

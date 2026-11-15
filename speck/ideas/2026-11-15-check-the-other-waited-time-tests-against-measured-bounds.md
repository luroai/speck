# Check the other waited-time tests against measured bounds

Captured: 2026-11-15 21:25 · Status: inbox
From ticket: 0689
Raised by: agent

## What
The 0166 AC1 tests and the 0217 AC2 test still check a waited time against a fixed ±5 s tolerance (`near`). They could use `assertCounted` from `test/support/timing.mjs`, as the 0166 AC2 and 0217 AC3 tests now do.

## Why
Each runs a speck command between moving a time back and reading what speck counted. On a very busy machine that command can take over 5 seconds, so a build could see a failure that isn't real.

## Notes
- From the builder's own note while building 0689, which changed only the tests its Problem named. None of them failed in 5 runs at load averages up to 96, so this is a guard, not a known failure.

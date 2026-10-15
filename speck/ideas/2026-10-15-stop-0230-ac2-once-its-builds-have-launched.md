# Stop 0230 AC2's speck run once its builds have launched

Captured: 2026-10-15 · Status: inbox
From ticket: 0232

## What
0230 AC2's test runs speck run until the test helper's 10-second time limit ends it. It could stop speck run as soon as its builds have launched, as 0075 AC1 and 0100 AC3 now do with `runUntilLaunched`.

## Why
It spends about 10 seconds of every suite run waiting for nothing, which every build after it pays for.

## Notes
- From 0232's own note: 0230 AC2 took 10.4 s on the build box, and wasn't in 0232's list.
- Other runOnce callers in test/run.test.mjs end on their own (speck run refuses to start), so they don't wait.

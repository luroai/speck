# Run the speck CLI in-process in every test file

Captured: 2026-10-15 · Status: dropped
Triaged: 1
From ticket: 0231

## What
Move the test files that still start `node scripts/speck.mjs` themselves, about 59 of them, onto the shared helper that runs a command inside the test process, keeping a process only where a test is about speck as a process.

## Why
0231 switched only the shared helpers. Each command a test file starts on its own still costs about 0.2 s before it does anything, so the suite is slower than it needs to be for every build.

## Notes
- From 0231's own note: the summed test time fell about 12% with only the helpers switched.
- Tests that kill speck, signal its builds or find it among the processes need `speckProcess` instead, as the 0196 and 0212 ship tests do.

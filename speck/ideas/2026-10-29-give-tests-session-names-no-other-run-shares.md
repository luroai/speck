# Give tests session names no other run shares

Captured: 2026-10-29 16:13 · Status: inbox
From ticket: 0559
Raised by: agent

## What
Tests that start a stand-in agent process with a fixed session name, such as `hand-0001` in `test/seen-builds-0300.test.mjs`, should give it a name unique to the test run, as 0559 did for `resumed-0002`.

## Why
speck finds a resumed build by looking for its session name across every process on the machine. When the same test file runs twice at once, for example a build's own runs beside `speck ship`'s suite or two worktrees testing together, one copy can find the other's stand-in and fail by chance, stopping a ship that broke nothing.

## Notes
- From 0559's own runs: `0300 AC2` failed once beside the suite because it found the suite's copy of its `resumed-0002` stand-in.
- Check which other tests start processes named by a fixed session and are found through the process table, rather than handed over directly.

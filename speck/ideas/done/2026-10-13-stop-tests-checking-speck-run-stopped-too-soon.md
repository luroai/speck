# Stop tests checking speck run has stopped too soon

Captured: 2026-10-13 · Status: ticketed (0173)
From ticket: 0159

## What
Tests that turn speck run off and then check straight away that its process has gone should wait (with a time limit) for it to exit, rather than checking once.

## Why
On a busy machine the process can take a moment to exit, so these tests fail now and then even though nothing is wrong. That stalls builds and ships for no reason.

## Notes
- Seen while building 0159, with two full suites running side by side: "0148 AC2: the Auto-build switch turns speck run on and off from the --url page" failed once ("speck run has stopped", `alive(pid)` still true), and "0128 AC3: a speck run started from the panel can be turned off from it, and turned on again" failed once. Both passed in every normal run.
- Other tests may check that a process has gone in the same way: worth a search.

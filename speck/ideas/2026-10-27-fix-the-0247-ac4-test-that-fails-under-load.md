# Fix the 0247 AC4 test that fails under load

Captured: 2026-10-27 · Status: inbox
From ticket: 0524
Raised by: agent

## What
The `0247 AC4` test in `test/run-0247.test.mjs` (new code that can't start leaves the old one running) failed once in a large parallel `speck test --related` run and passed when its file ran alone. Make it wait for what it checks with a time limit rather than counting on how quickly things happen.

## Why
A test that fails by chance can fail `speck ship` for a ticket that didn't break it, and makes builders re-run files to show the failure isn't theirs.

## Notes
- Seen in 0524's build: one failure in a run of 1,704 tests, none in two runs of its file alone. `0384 AC3` failed in the same runs and already has an idea (`speck/ideas/2026-10-24-fix-the-0384-running-round-test.md`).

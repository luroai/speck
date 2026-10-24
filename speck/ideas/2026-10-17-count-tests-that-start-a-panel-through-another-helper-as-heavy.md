# Count tests that start a panel through another helper as heavy

Captured: 2026-10-17 · Status: dropped
Triaged: 1
From ticket: 0271

## What
Treat a test file as heavy when it starts a real panel, browser or `speck run` through a support helper that does so itself, such as `onPhone` (queue-phone.mjs) or `idleCpu` (quick-run.mjs), not only when it calls `startPanel`, `browserPage`, `startRun` and the rest directly.

## Why
Since 0271 the runner finds heavy files from the helpers they call directly. `test/panel-0190.test.mjs` and `test/build-log-0176.test.mjs` start a real panel and browser, or `speck run`, only through those other helpers, so they now run with no limit of their own on machines with 8 cores or fewer. That can make heavy tests miss their time limits again there.

## Notes
- From 0271's self-check: the old hand-kept list named these two files by hand.
- Open question: name these helpers in the pattern, or work out which support helpers start one by reading the support modules.

# Share one panel across a browser test file

Captured: 2026-10-15 · Status: ticketed (0234)
From ticket: 0198

## What
In the real-browser test files whose page stub answers every request the page makes (such as 0155 and 0160), start one repo and one `speck panel` for the whole file, kept until the file ends, instead of a new repo and panel for each test.

## Why
Each of those tests spends about 0.6 s of its 1 s or so making a repo and starting a panel it only uses to serve the page. Tried on `test/panel-0155.test.mjs` during 0198, the file went from about 25 s to 9 s with all 22 tests passing. 0155 and 0160 are the next slowest files after 0198's five, and every build runs the full suite several times.

## Notes
- From 0198's own measurement; it was undone there because 0155 wasn't among that ticket's five files.
- The shared panel's repo needs a `speck-keep-*` folder, which test/support/tmp.mjs leaves alone between tests.
- Related: 2026-10-14-shorten-the-slowest-browser-tests-waits.md is about fixed pauses, not set-up.

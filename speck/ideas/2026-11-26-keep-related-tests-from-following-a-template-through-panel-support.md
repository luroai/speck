# Keep related tests from following a template through the panel's test support

Captured: 2026-11-26 20:48 · Status: inbox
From ticket: 0767
Raised by: agent

## What
`speck test --related` brings in every test that imports test/support/panel.mjs whenever any template it can read changes, such as floor.html, so a change to the factory floor chose 533 test files, close to the whole suite.

## Why
A build's one related run then takes longer than the builder's 10-minute shell limit, so it's killed and the builder has to pick the files by hand. Builds of floor or panel tickets run slower and less checked than they should.

## Notes
- From 0767's build: "templates/floor.html, through test/support/panel.mjs" brought in hundreds of panel tests that never load the floor. 0766's build hit the same (625 files).
- The earlier fix (ideas/done/2026-10-23-keep-related-tests-from-picking-the-whole-suite.md) didn't cover a support file that reads any page by name.

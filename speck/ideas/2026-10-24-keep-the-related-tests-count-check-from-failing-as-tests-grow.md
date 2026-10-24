# Keep the related-tests count check from failing as tests grow

Captured: 2026-10-24 · Status: inbox
From ticket: 0447

## What
0447's AC3 test checks that 0437's change (`scripts/turns.mjs`, the build skill and `docs/brief.md`) picks fewer than 100 related tests, on a copy of the repo's current `test/` folder. Today it picks 96, 70 of them because they name `docs/brief.md` themselves. Make the check stable, or make a change to a doc as widely tested as the brief pick fewer tests.

## Why
Each new test that names the brief adds one to that count. A few more and the test fails `speck ship` for whichever unrelated ticket crosses the line, though nothing that ticket did is wrong.

## Notes
- From my own note while building 0447. The test can't pin the tree to a commit, because history-0085 forbids commit ids in tests.
- Open question: should a doc named by many tests (like `docs/brief.md`) bring in only the tests that check its facts, or should the check use a fixed fixture instead of the live tree?

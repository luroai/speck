# Stop tests depending on files under speck/

Captured: 2026-10-11 · Status: ticketed (0121, 0122)
From ticket: 0112

## What
Change the tests that read this repo's own files under `speck/` so they no longer depend on them, or make speck's recorded test results take those files into account.

## Why
`speck test` and `speck ship` now reuse a result when nothing outside `speck/` has changed (0112). A test that reads `speck/` can then pass or fail on a reused result that a fresh run would give differently, until someone runs `speck test --fresh`.

## Notes
- From the builder's own check during 0112: test/luro-0082.test.mjs reads speck/tickets/done, test/product-0068.test.mjs checks speck/product.md, and test/speck.test.mjs reads speck/config.yml.
- Open question: fix the tests, or let a project list paths under speck/ that its tests read?

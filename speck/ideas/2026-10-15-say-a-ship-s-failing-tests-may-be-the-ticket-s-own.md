# Say a ship's failing tests may be the ticket's own

Captured: 2026-10-15 · Status: inbox
From ticket: 0235

## What
When `speck ship` refuses because the tests fail on the ticket merged with the base branch while the base branch's own tests pass (exit 16), its message still says the ticket and the base branch's newer changes "fail together". Say instead that the tests failed on the ticket as it would land, either because of its own change or with the base branch's newer changes, as the hand-back message and `/speck-build` now do.

## Why
Since 0235 a build runs only the ticket's test files, so `speck ship`'s whole-suite run is the first to catch a test elsewhere that the ticket's own change breaks. Ship's message then points the user (and the review pack) at the wrong cause.

## Notes
- From the builder's own note on 0235: changing `speck ship` was out of scope there. `docs/brief.md`'s `speck ship` paragraph says the same and would change with it.

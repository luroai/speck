# Keep related tests from picking the whole suite

Captured: 2026-10-23 · Status: ticketed (0447)
From ticket: 0437

## What
`speck test --related` chooses every test that names a changed file, directly or through a module under `test/support/`. Most support modules name `scripts/speck.mjs` (the CLI they run), so any change to it brings in nearly the whole suite: 374 of 390 test files for 0437. A change to any `SKILL.md` brings in every test that names one, whichever skill changed. Make the choice narrower for files like these, for example by matching the path rather than the file name when the name isn't unique, or by not counting a support module's mention of the CLI.

## Why
For a change to the CLI or a skill, the run before the first review takes about as long as the whole suite (2.5 minutes for 0437), which is what `speck ship` runs anyway. Builds that touch those files lose that time.

## Notes
- From my own note on 0437's first --related run. Open question: which rule keeps the tests that would really catch a break, such as 0238's usage-message test, which 0437's run did catch.

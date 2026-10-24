# Bring in page tests for a panel script change

Captured: 2026-10-24 · Status: inbox
Triaged: 1
From ticket: 0468

## What
`speck test --related` brought in only 6 test files for 0468's change to `templates/panel.js` and `templates/panel.css`, though about 160 test files load the page through `test/support/panel.mjs`, which names those files with `path.join(ROOT, 'templates', 'panel.js')`. Make `--related` count a support module that builds a changed file's path from its parts, so a change to the panel's script brings in the tests that load it.

## Why
61 existing tests broke with 0468's change, and `--related` would have found none of them before review: the build had to run every panel test file by hand, or ship would have handed it back. Any build that changes the panel's look or script has the same gap.

## Notes
- From the builder's own note on 0468. Related to 0447 (the other way round: picking too many). Open question: which rule keeps that narrow while matching paths built from parts.

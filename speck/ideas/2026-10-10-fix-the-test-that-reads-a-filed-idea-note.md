# Fix the test that reads a filed idea note

Captured: 2026-10-10 · Status: inbox
From ticket: 0087

## What
`test/luro-0082.test.mjs` (AC4) reads `speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md`, which was filed into `speck/ideas/done/` when it was ticketed. Point the test at the filed note, or have it look in both folders.

## Why
`npm test` fails on main with three failures (that test and two in `private-words-0084.test.mjs` that run it), so every build reports failures that aren't its own and real ones are easier to miss.

## Notes
- Found while building 0087: the same three tests fail on main before and after the change.

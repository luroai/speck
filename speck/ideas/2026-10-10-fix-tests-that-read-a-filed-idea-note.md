# Fix the tests that read a filed idea note

Captured: 2026-10-10 · Status: inbox
From ticket: 0091

## What
Three tests (luro-0082 AC4, and private-words-0084 AC2 and AC3, which run 0082's checks) read speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md. That note was moved to speck/ideas/done/ when it was ticketed (0086–0089), so they fail on main. Point them at the note wherever it is filed, or stop them depending on a live idea note.

## Why
`npm test` fails on main, so every build reports failures that aren't its own, and auto-ship's test run can't pass.

## Notes
- Found while building 0091: the same three tests fail on main before the change.

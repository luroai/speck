# Say plainly when a file given to speck is missing

Captured: 2026-10-10 · Status: dropped
Triaged: 2
From ticket: 0078

## What
`speck record <id> <file>` with a file that doesn't exist crashes with a Node stack trace (`ENOENT`) instead of a plain error. `speck prompt <id> --tests=<file>` reads its file the same way. They should say which file is missing and what to do, and change nothing.

## Why
A builder (or a person) who mistypes a path gets a stack trace, against speck's rule that every failure gives a plain message. An agent may misread it as a bug in speck.

## Notes
- Found while building 0078: its AC4 test ran `speck record 1 nope.json` and got the stack trace from both the old and the split CLI. The step was dropped from that test, since stack traces name file paths and line numbers.
- Open question: check `--response=` and `--tests=` on `speck review` too.

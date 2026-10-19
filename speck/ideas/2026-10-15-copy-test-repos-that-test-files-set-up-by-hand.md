# Copy the test repos that test files set up by hand

Captured: 2026-10-15 · Status: inbox
Triaged: 1
From ticket: 0230

## What
Test files that make their own temporary speck repo with `git init` and setup commits, rather than through the shared helpers in `test/support/`, should get theirs from a copy made once per test file too, as the shared helpers now do.

## Why
0230 copied only the shared helpers' repos, so these tests still set up each repo from scratch, which keeps the suite slower than it needs to be on a small laptop.

## Notes
- From 0230's own notes: hand-made repos were out of its scope. `copied()` in `test/support/copy.mjs` can be reused.
- Before and after suite times in 0230 moved only a little (128.7 s to 124.8 s, on a busy machine), so measure which files cost most before choosing which to change.

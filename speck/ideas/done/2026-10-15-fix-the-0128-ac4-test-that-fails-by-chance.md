# Fix the 0128 AC4 test that fails by chance

Captured: 2026-10-15 · Status: inbox
From ticket: 0195

## What
The test "0128 AC4: off the base branch, or with speck run already on, the panel gets speck run's own error" sometimes fails in a full run and passes when run again. Find what it races with and make it steady.

## Why
Since 0195, a chance failure no longer fails the run, but it still costs a second run of its file and shows up in the flaky log. A test that fails by chance can also hide a real failure.

## Notes
- From 0195's build: it failed once in a full run on 2026-10-15 and passed on the retry. The cause hasn't been looked into.

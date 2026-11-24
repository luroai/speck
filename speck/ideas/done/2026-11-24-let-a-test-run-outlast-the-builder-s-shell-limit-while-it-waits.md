# Let a test run outlast the builder's shell limit while it waits

Captured: 2026-11-24 13:43 · Status: ticketed (0744)
From ticket: 0711
Raised by: agent

## What
When `speck test` waits for a turn behind other builds' runs (`max_parallel_tests`), it can wait longer than the builder's shell allows a command to run, so the shell kills it before it has run anything. Let it hand back before that limit, as `speck review` does with exit 12 and `--wait` (0384), or say how long it may wait.

## Why
In 0711's build, a `speck test --files` run waited the whole 10 minutes behind two other builds' runs and was killed without running a test. The build skill tells builders to run every test run in the foreground, so a busy machine stops a build partway for no reason of its own.

## Notes
- From 0711's own build: the run printed "Waiting for a turn to run the tests: max_parallel_tests is 2, and 2 runs are already going" and nothing else before the shell's 10-minute limit. Run again a minute later, it passed.

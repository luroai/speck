# Use the full suite's result as a build's baseline

Captured: 2026-11-11 10:31 · Status: inbox
From ticket: 0630
Raised by: agent

## What
When a build records which tests already fail ("Failing before this build"), it should also use the full suite's recorded result on the base branch (commands.test_full), not only commands.test's.

## Why
Once commands.test is only the quick tests, a build's baseline no longer covers the slow tests, so a slow test that was already failing looks like the build broke it.

## Notes
- From 0630's Notes, which said a recorded full run on the base branch gives builds a better baseline; 0630 left it out of scope. `speck test --recorded` reads only commands.test's result today.

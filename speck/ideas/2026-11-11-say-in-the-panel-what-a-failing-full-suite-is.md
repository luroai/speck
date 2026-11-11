# Say in the panel what a failing full suite is

Captured: 2026-11-11 10:31 · Status: inbox
From ticket: 0630
Raised by: agent

## What
When the full suite (commands.test_full) fails on the base branch, the panel should say so where you look: which commit and which tests failed, for example a row under Needs you in the Build lane or a line in the bar's detail.

## Why
Since 0630 the bar's count goes up by one for a failing full run, but nothing in the panel says what it is: you only find out from `speck status` or by reading through the Pipeline log.

## Notes
- My own note from 0630's build: speck run's record carries the failing run as `full` (commit, tests, exit code), and foremanView gives it back as `full`, so the page already has it.

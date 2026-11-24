# Accept Node's spec reporter in TAP checks

Captured: 2026-11-24 15:07 · Status: inbox
From ticket: 0720
Raised by: agent

## What
Update checks that still expect TAP lines such as `# fail 2` (tmp-cleanup, and related-0676's failing-run line) so they accept Node's current default reporter (`ℹ fail 2`), or run those child suites with an explicit TAP reporter.

## Why
Every `speck test --files` run fails on tmp-cleanup's AC1 AC2 on this machine's Node, so builds spend review rounds explaining an unrelated check failure.

## Notes
- Seen during 0720's related and `--files` runs; fails the same way alone.
- related-0676's AC1 tests failed in the same related run for the same reporter change.

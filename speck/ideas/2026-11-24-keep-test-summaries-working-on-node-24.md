# Keep test summaries working on Node 24

Captured: 2026-11-24 23:15 · Status: inbox
From ticket: 0741
Raised by: agent

## What
Get TAP from `node --test` runs that speck reads, even on Node 24, where its spec reporter is the default.

## Why
With `node --test {files}` as the test command, a failing `speck test --related` run on Node 24 ends without the command to run next, and the reviewer gets the full output instead of the summary.

## Notes
- From 0741, checked with Node 24.18.1, which is bundled with Cursor's server. This repo's own `commands.test_files` is `node --test {files}`.
- Open: add the reporter in speck's setup and config, or read the spec output too.

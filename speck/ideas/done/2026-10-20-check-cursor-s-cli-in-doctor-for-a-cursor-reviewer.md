# Check Cursor's CLI in doctor for a Cursor reviewer

Captured: 2026-10-20 · Status: ticketed (0378)
From ticket: 0332

## What
With `reviewer: cursor` and no command under `reviewer_options`, `speck doctor` should check that Cursor's CLI (`agent` or `cursor-agent`) is on the PATH, as it checks `claude` for `reviewer: claude`.

## Why
Since 0332 speck runs a Cursor reviewer itself, but doctor checks nothing for it, so a missing CLI only shows up when the first review round fails.

## Notes
- Builder's own note: `doctorChecks` in `scripts/install.mjs` has a branch for `claude` with no command, none for `cursor`.

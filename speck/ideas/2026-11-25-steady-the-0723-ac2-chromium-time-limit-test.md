# Steady the 0723 AC2 Chromium time limit test

Captured: 2026-11-25 00:36 · Status: inbox
From ticket: 0751
Raised by: agent

## What
Make "0723 AC2: the 0182 AC3 check still fails when Chromium is left running" pass reliably on a busy machine.

## Why
Its test file didn't finish within 60 s. An unsteady test can fail a ship and hand a finished ticket back to its build.

## Notes
- Failed once in 0751's related-tests run (465 files), then passed on rerun with no code change. Not reproduced on the base branch alone.

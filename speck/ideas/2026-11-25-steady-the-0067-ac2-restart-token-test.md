# Steady the 0067 AC2 restart token test

Captured: 2026-11-25 00:36 · Status: inbox
From ticket: 0751
Raised by: agent

## What
Make "0067 AC2: the token survives a restart" pass reliably on a busy machine.

## Why
The panel's restart wasn't seen within 5 s. An unsteady test can fail a ship and hand a finished ticket back to its build.

## Notes
- Failed once in 0751's related-tests run (465 files), then passed on rerun with no code change. Not reproduced on the base branch alone.

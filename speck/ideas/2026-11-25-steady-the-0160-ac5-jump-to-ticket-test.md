# Steady the 0160 AC5 jump-to-ticket test

Captured: 2026-11-25 00:36 · Status: inbox
From ticket: 0751
Raised by: agent

## What
Make "0160 AC5: in the home-screen app, jumping to a ticket shows it below the header" pass reliably on a busy machine.

## Why
It read the highlighted row when it wasn't there. An unsteady test can fail a ship and hand a finished ticket back to its build.

## Notes
- Failed once in 0751's related-tests run (465 files), then passed on rerun with no code change. Not reproduced on the base branch alone.

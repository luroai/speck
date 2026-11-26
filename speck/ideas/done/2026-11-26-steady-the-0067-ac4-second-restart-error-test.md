# Steady the 0067 AC4 second restart error test

Captured: 2026-11-26 09:50 · Status: ticketed (0775)
From ticket: 0761
Raised by: agent

## What
Make "0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again" pass reliably on a busy machine.

## Why
It waited 5 s for the panel's second restart error and didn't see it. An unsteady test can fail a ship and hand a finished ticket back to its build.

## Notes
- Failed once in 0761's related-tests run (4408 tests, about 7 minutes), at "not within 5000 ms: the second error", then passed on rerun with no code change. 0761 changes only the panel page's styles and header script.
- The same file's AC2 has the same 5 s wait on a restart: speck/ideas/2026-11-25-steady-the-0067-ac2-restart-token-test.md. One ticket could steady both.

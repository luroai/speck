# Blame the base branch when its failing run names no tests

Captured: 2026-10-17 · Status: inbox
From ticket: 0264

## What
When a ship's tests fail and the base branch's own run fails without naming any test (its output isn't TAP, for example it crashed before the tests started), ship should blame the base branch (exit 14) rather than hand the ticket back.

## Why
Since 0264, a test counts as failing on the base branch only when one of the same name fails there. A base branch that fails without naming tests counts as failing none, so every named failure on the ticket is put down to the ticket, and its build is sent to fix tests that may be broken on the base branch too.

## Notes
- From the builder's own note on 0264: its AC4 asked for this behaviour, so it was kept.
- Open question: should it also blame the base branch when its run names fewer failures than it really had, such as a test file that crashed?

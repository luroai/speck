# Steady the quick checks' real-panel tests under load

Captured: 2026-11-27 00:11 · Status: inbox
From ticket: 0774
Raised by: agent

## What
Stop the real-panel tests in the quick checks (0161 AC1–AC4, 0427 AC1, 0543 AC2–AC4) failing with "panel didn't start" on a busy machine.

## Why
They are in `commands.checks`, so a busy machine can fail any build's test run for no real reason.

## Notes
- Seen in 0774's build before it changed any fake, at a load of about 60: 7 tests failed. The same files passed in a later run.

# Steady the 0319 outside-speck-run test

Captured: 2026-11-12 22:04 · Status: inbox
From ticket: 0670
Raised by: agent

## What
Find why 0319 AC1–AC4 once saw speck run call build 0002 "already being built" instead of "being built outside speck run", and make the test (or speck run) steady.

## Why
It failed once in 0670's related run at a load of about 20, then passed when run again alone. A chance failure like this can fail the full suite on main and stop the ship queue.

## Notes
- Seen in 0670's build. The test writes 0001's and 0002's run records just after speck run starts watching; speck run may read 0002's record before its `seen: true` is in it, or the label may really race. Look at which before changing anything.

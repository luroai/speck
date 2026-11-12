# Fix 0182 AC3 failing in the full suite

Captured: 2026-11-12 12:45 · Status: inbox
From ticket: 0663
Raised by: agent

## What
The test "0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout" failed in the full suite's run on main at 0352dcf. Find out whether it fails every time or only under load, and make it pass.

## Why
While it fails, the full suite on main stays red, so speck run keeps raising fix tickets and builds can't trust the recorded baseline.

## Notes
- Seen in the recorded full-suite result 0663 started from; 0663 left it alone as failing before that build.
- Its inner test file timed out at 1500 ms as intended; the failure is in what the outer test checks afterwards. Not yet looked into.

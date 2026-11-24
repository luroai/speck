# Steady the 0182 AC3 per-test time limit test

Captured: 2026-11-24 12:53 · Status: ticketed (0743)
From ticket: 0723
Raised by: agent

## What
The 0182 AC3 test "Chromium has closed within 10 s of a test file finishing whose test timed out waiting on its page" gives its inner test a 1.5 s time limit that also covers starting Chromium. Let it allow longer when Chromium hadn't started in time, as 0723 did for the --test-timeout test.

## Why
On a busy machine Chromium can take longer than 1.5 s to open its first page (0723 saw this at a load average of 125), so the test can fail on its pid count and turn the full suite on main red for no real fault.

## Notes
- From 0723's own note: it steadied only the --test-timeout test, as the ticket put other timing tests out of scope. Not yet seen failing.

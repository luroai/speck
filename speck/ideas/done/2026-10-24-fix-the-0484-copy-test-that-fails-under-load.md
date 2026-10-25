# Fix the 0484 copy test that fails under load

Captured: 2026-10-24 · Status: inbox
From ticket: 0485

## What
The 0484 test "a closed card's line … copies as it did before 0484" expects the blocked bug ticket's time to read 99:5x, but its ticket starts 5990 seconds before the test file loads, so the window is only 10 seconds. Give it a stopped clock or a wider match, so the time it checks doesn't depend on how fast a real panel starts.

## Why
Under load, when several test files run together, the panel takes more than 10 seconds to start, the time reads 100:00 and the test fails though nothing is wrong. That can hand a ticket back at ship for no reason.

## Notes
- Seen twice in 0485's related test run (actual: `speck will answer · Review 2 · 100:00 · bug`); the file passed on its own.

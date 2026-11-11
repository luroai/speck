# Keep speck run's tests off your real agents

Captured: 2026-11-11 15:36 · Status: inbox
From ticket: 0648
Raised by: agent

## What
Tests that start a real `speck run` while Claude is limited should read a stand-in list of ready agents, not the machine's own, so 0647's builder stand-in never picks a real Cursor or Codex.

## Why
On a machine where Cursor is installed and signed in, "0622 AC1 AC2 AC3: a build that hit the limit while speck run was off…" fails every time: 0647 moves the test's new ticket to the real Cursor, which takes the only build slot, so the stopped build is never resumed. It may also start a real Cursor build from a test.

## Notes
- From 0648's build: the related run failed on it, and it failed the same with 0648's changes stashed. It's left out of the quick suite, so ship doesn't hit it, but the full suite on main does.
- Different from `speck/ideas/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md`: that one is load, this one fails on an idle machine.

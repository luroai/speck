# Fix the 0285 Auto-build switch panel tests

Captured: 2026-11-11 15:50 · Status: inbox
From ticket: 0654
Raised by: agent

## What
`test/foreman-0285.test.mjs`'s two 0285 AC3 tests fail on `main`: the Settings switch stays Off after a click, and a refused switch shows "The server refused (200)." instead of speck run's own message. Find what changed and make them pass again.

## Why
They're in the full suite, so it fails on `main` and counts under Needs you until they pass. It may be the panel itself, not only the tests: the Auto-build switch in Settings may not show speck run turning on.

## Notes
- Seen in 0654's related run; they fail the same way without 0654's change, run alone. Not checked: which commit started it (the fake page's queued answers may be off by one since a new Settings request, perhaps 0646's usage).

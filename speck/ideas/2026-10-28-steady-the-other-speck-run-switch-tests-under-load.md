# Steady the other speck run switch tests under load

Captured: 2026-10-28 · Status: inbox
From ticket: 0541
Raised by: agent

## What
Give the other tests of speck run's switch to new code the same time-limited waits 0541 gave 0247 AC4: `0247 AC1, AC2` and `0247 AC1, AC3`, the 0301 tests in `test/run-switch-0301.test.mjs`, the 0321 tests in `test/run-lock-0321.test.mjs` and `0300 AC5` in `test/seen-builds-0300.test.mjs`.

## Why
On a busy machine they fail by chance: they wait only 8 or 20 seconds for processes to start, ship or switch. A test that fails by chance can stop `speck ship` for a ticket that didn't break it.

## Notes
- Seen in 0541's build, at load averages of 75–106 on 16 cores: `0247 AC1, AC2` failed once (its ship took 16 s, past its 20 s wait), and eight 0247, 0301 and 0321 tests failed in one related run. All passed on a quiet machine.
- `watching(run, ms)` in `test/support/run-switch.mjs` already takes a time limit (0541).
- Open question: the switch itself gives new code 10 s to get ready (`SWITCH_START_MS`), which a very busy machine can exceed. Should tests be able to raise it?

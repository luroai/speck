# Steady 0150 AC2's wait for the Settings view

Captured: 2026-10-29 15:22 · Status: inbox
From ticket: 0557
Raised by: agent

## What
0150 AC2 (Enter or Space on the focused button starts or pauses speck run) waits 10 s for the Settings view to finish loading its agents' lists. Give that wait as long as 0472 AC3's now is, so it passes on a busy machine.

## Why
It failed twice in 0557's busy whole-suite runs with "timed out waiting for the Settings view". The agents' lists come from the agents themselves, which took up to 12 s under load in 0557's timing, so a ship on a busy machine can hand a ticket back for nothing.

## Notes
- From 0557's own whole-suite runs (Delivery log). The wait is in test/panel-0150.test.mjs, on "Loading your agents" going.
- Open question: whether other tests wait on the agents' lists with the 10 s default too.

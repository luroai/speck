# Hold the clock still in 0140's phone-rules comparison

Captured: 2026-10-24 · Status: inbox
From ticket: 0441

## What
0140 AC2 (at 700 px the phone rules change nothing) compares two snapshots of every element's computed style and position, taken at different times. A running timer's text can change between them, so the test should stop or ignore the ticking clock before it compares.

## Why
It failed once in 0441's related run of 281 test files and passed on its own, with and without 0441's change. A flaky test makes `speck ship` hand back tickets that broke nothing, which stalls the ship queue.

## Notes
- From my own note on 0441: the failing element was `SPAN.sub` in the header, and its width moved the elements after it.

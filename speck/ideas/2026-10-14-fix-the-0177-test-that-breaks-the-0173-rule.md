# Fix the 0177 test that breaks the 0173 rule

Captured: 2026-10-14 · Status: dropped
From ticket: 0183

## What
A test added by 0177 (`test/panel-0177.test.mjs`, line 159) checks once that a process it stopped has gone, with `assert.ok(!alive(…))`. 0173's check that no test does this now fails on the base branch. Change that test to wait, with a time limit, for the process to go, as 0173 set out.

## Why
The full suite fails on the base branch, so every build records it as failing before, and the one-off check can fail at random on a slow machine.

## Notes
- Seen as the only failing test in 0183's full runs, before and after its change ("0173 AC2: no test in test/ checks once that a process it stopped has gone").

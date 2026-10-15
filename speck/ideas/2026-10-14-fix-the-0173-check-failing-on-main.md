# Fix the 0173 check failing on main

Captured: 2026-10-14 · Status: dropped
From ticket: 0182

## What
The test "0173 AC2: no test in test/ checks once that a process it stopped has gone" fails on main, because it flags line 159 of the 0177 panel test file. Either that check in the 0177 test should wait and retry, or the 0173 check should accept it.

## Why
Every build sees one failing test before it starts and has to record and carry it, and auto-ship's test run on main can't come back clean while it fails.

## Notes
- Found in 0182's run before building: `assert.ok(!alive(…))` at test/panel-0177.test.mjs:159.
- Open question: is the 0177 check really a one-off "has it gone" check (a flaky pattern 0173 meant to stop), or a false alarm in 0173's scan?

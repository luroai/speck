# Steady the 0517 AC3 frame-time test under load

Captured: 2026-11-08 23:24 · Status: inbox
From ticket: 0571
Raised by: agent

## What
0517 AC3 (a lane change's first frame within 50 ms) should give the same result on a busy machine, or keep only the part of the check that doesn't depend on the clock.

## Why
It reads the clock in a real browser, so a busy machine can fail it with nothing wrong. A failure in `speck ship`'s whole-suite run hands a ticket back for nothing, as 0150 AC2's wait could.

## Notes
- From 0571's AC4 run: one frame took 81 ms with a load average of about 57, and it passed three runs out of three alone straight after.
- 0557 also saw it fail once under load and didn't follow it up, so this is the second time.
- The test also checks that no redraw or measuring runs in that frame, which doesn't depend on the clock. Open question: keep the 50 ms budget with a larger allowance, or rely on that check.

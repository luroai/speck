# Keep build timers counting smoothly

Captured: 2026-10-11 · Status: idea

## What
The panel's build timers sometimes skip a second (12, 14) or show one twice (13, 13). They should count up one second at a time, every time.

## Why
The jumping makes the panel look unreliable, right where you look to see a build is alive.

## Notes
- Cause (checked 2026-10-11): the timers run on the browser's own one-second `setInterval` (`templates/panel.html`, `startCounters` and `tickCounters`), separate from the 2-second state refresh. Each tick lands a few milliseconds early or late, so when ticks fall near the turn of a second, the floored seconds skip or repeat.
- Likely fix: schedule each tick for the moment the displayed second changes (from the build's start time), rather than every 1,000 ms.
- Separate from moving the panel to real-time updates (`speck/ideas/2026-10-11-update-the-panel-in-real-time.md`): that wouldn't fix this, since the timer counts in the browser.

# Keep the 0177 one-second tests passing on a busy machine

Captured: 2026-10-14 · Status: ticketed (0207)
From ticket: 0191

## What
The 0177 AC3 tests check that Stop build and Ship answer within 1 second while a slow board reading is going on. Give them enough headroom, or a check that doesn't depend on machine load, so they pass when two builds' test suites run at once.

## Why
During 0191's build, a whole-suite run failed two of them (1306 ms and 1106 ms) while another build's suite was running at the same time, then passed on the next run. A failure like that can mark main as failing and hold back auto-ship for no real reason.

## Notes
- From the builder's own note in 0191. Open question: what limit still shows the panel isn't waiting for the 5-second reading (for example 2–3 seconds), or should the tests compare against the reading's time instead?

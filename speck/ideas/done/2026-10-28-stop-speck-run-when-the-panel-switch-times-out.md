# Stop speck run when the panel's switch times out

Captured: 2026-10-28 · Status: ticketed (0551)
From ticket: 0544
Raised by: agent

## What
When the panel's speck run switch gives up after 10 seconds because speck run hasn't said it's watching, stop the speck run it started, as `speck run --background` now does, rather than leave it running.

## Why
The switch shows an error, but the speck run it started may carry on and start builds a moment later, so the user sees it off-and-failed while it's actually on.

## Notes
- From 0544's build: `--background` stops the process it started on a time-out (`stopStarted` in scripts/run-background.mjs); the panel's `panelRunOn` still only reports the time-out. Could the switch reuse `stopStarted`?

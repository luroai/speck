# Keep Settings still when a setting's button is pressed

Captured: 2026-10-22 · Status: dropped
From ticket: 0370

## What
Pressing "This machine only" or "The repo, for everyone", "Clear this machine's value" or "Keep this machine's value" in the Settings view should update only that setting's row, as changing a list or box does since 0370, rather than drawing the whole view again.

## Why
Those buttons still redraw the whole Settings view, so it jumps back to the top and the button loses the keyboard focus, which looks like the page reloaded, the same confusion 0370 fixed for lists, boxes and ticks.

## Notes
- Dropped 2026-10-23: 0397 removes those buttons from the rows, as the user chose.
- From the builder's own note on 0370, whose criteria cover only lists, text and number boxes and ticks. A Save that's refused before sending (no place picked, nothing ticked) redraws the whole view too.

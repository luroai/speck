# Return focus after the full ticket pane closes

Captured: 2026-10-09 · Status: inbox
From ticket: 0060

## What
When the full ticket pane closes, by Close, Escape or a click outside, put the keyboard focus back on the **Full ticket** button that opened it, when that ticket is still open in the list.

## Why
The pane takes the focus when it opens and the page behind is inert, so on closing the focus falls to the page body.
A keyboard user then has to Tab from the top of the page to get back to where they were.

## Notes
- From the builder's own note on 0060.
- The button may have been rebuilt by a refresh while the pane was open, so it would need finding again by ticket id.

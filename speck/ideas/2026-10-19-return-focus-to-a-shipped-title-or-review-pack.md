# Return focus to a Shipped title or Review pack button when the pane closes

Captured: 2026-10-19 · Status: inbox
From ticket: 0326

## What
When the side pane was opened from a Shipped ticket's title or a Review pack button, closing it should put the keyboard focus back on that title or button, as 0326 does for Full ticket.

## Why
After 0326, only the Full ticket button gets the focus back. Closing a pane opened from Shipped or a Review pack still drops the focus to the page, so a keyboard user has to Tab from the top again.

## Notes
- The builder's own note on 0326, which kept to the Full ticket button. 0137 deferred the Shipped title's focus to the idea 0326 came from.
- The Shipped list and the Review pack buttons are redrawn on refresh too, so each would need finding again by ticket id.

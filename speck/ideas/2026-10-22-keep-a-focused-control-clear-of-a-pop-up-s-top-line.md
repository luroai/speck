# Keep a focused control clear of a pop-up's top line

Captured: 2026-10-22 · Status: dropped
From ticket: 0379

## What
When Tab or Shift+Tab moves the focus to a control in a pop-up (a document, Settings or the Foreman), scroll it so it sits below the pop-up's held top line, not under it.

## Why
Since 0379 the top line with Close stays at the top while the rest scrolls under it. A control the browser scrolls into view while it's focused can end up hidden under that line, so someone using the keyboard can't see where the focus is.

## Notes
- From the builder's own self-check on 0379. The page's header already does this for the board (0160, with scroll-padding-top kept to the header's height); the pop-ups' top line changes height as a long path wraps, so it would need measuring the same way.

# Keep a scrolled-up log reader's place

Captured: 2026-10-09 · Status: dropped
Triaged: 2
From ticket: 0052

## What
When the reader has scrolled up in an open log that's already at its 200-line tail, each update drops the oldest lines, so the text under them moves up while the box's scroll position stays.
Keep the lines they're reading in view instead, for example by scrolling the box up by the height of the dropped lines.

## Why
Someone reading back through a busy build sees the text drift upwards every second, and a selection in lines that drop out of the tail is lost.

## Notes
- From 0052 (own note): AC3 asks that the box stays where the reader left it, which the build met by keeping `scrollTop` unchanged.
- Open question: once the lines being read have dropped out of the tail, what should the box show?

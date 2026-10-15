# Keep a queued ticket's tags tappable above a linked id

Captured: 2026-10-14 · Status: ticketed (0224)
From ticket: 0190

## What
On a phone, when a queued ticket's line reads "Queued · unlocks 0205" or "Queued · waiting on 0204", the linked id's tap area reaches about 14 px up into the tap areas of the tags just above it. Taps on the bottom edge of those tags then go to the id instead. Each tag should keep its full 44 by 44 px tap area there, as 0165 asks, while each id keeps the 44 px tap area 0164 gave it.

## Why
A user on a phone who taps just under a tag such as "low" on a chained ticket jumps to another ticket instead of seeing what the tag means. 0165's test doesn't catch this because its board has no linked ids.

## Notes
- Found while building 0190: a browser check on a chained ticket showed two points of the "low" tag's tap area landing on the "unlocks 0205" id.
- Fully separating them would need about 22 px more space between the tags and that line. Should the space grow, should the id's reach upwards shrink, or should the tag win where they overlap?

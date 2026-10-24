# Give the dots in a details line their gaps back

Captured: 2026-10-23 · Status: ticketed (0442)
From ticket: 0427

## What
The " · " between the parts of a card's details line, and of a shipped ticket's line and the shipped stats, should have a visible gap on each side in the interface font, for example "18:56 · 20 min" rather than "18:56·20 min".

## Why
The gaps either side of each dot are narrowed by 3 px, which suited a monospace's wide spaces. In a proportional font, such as the system font the panel now uses, the spaces are only about 3 px wide, so the dot touches the words beside it and the parts run together.

## Notes
- From the builder's own note on 0427: removing the narrowing fixes how it looks, but then 0419's browser test fails, because on the build machine the interface font comes out as a monospace (see the note on measuring the panel's layout in a proportional font).
- Open question: a fixed gap, such as a margin either side of the dot, instead of narrowed spaces?

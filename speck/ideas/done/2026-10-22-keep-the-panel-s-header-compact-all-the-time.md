# Keep the panel's header compact all the time

Captured: 2026-10-22 · Status: ticketed (0364)

## What
Keep the panel's header in its compact, scrolled-down form all the time, but have it still show all the information the full header shows. The repo we're in should always be visible.

## Why
The header doesn't look great when the panel is open inside Cursor or the Claude desktop app, where the pane is narrow. Today it starts full and compacts as you scroll, which hides the project name. Knowing which repo the panel is for matters most when several are open.

## Notes
- Builds on 0160, which slims the header to one row once scrolled at under 700 px and hides the project name and base branch. 0150 and 0309 set the header's current layout and the size of its mark and title.
- When compact, the header shows speck twice: the logo, and the builder character on the Foreman's button, which the user knows as the Auto-build one (from 0285 and 0303). The user asked for a suggestion when this is ticketed. Options to weigh: drop the logo mark and keep the title, let the builder character stand in as the logo, or keep the logo and leave the character out of the compact header.
- Open question: should the base branch always show too, or only the repo name?
- Open question: does "all the information" include the "control panel" label, or can that go?

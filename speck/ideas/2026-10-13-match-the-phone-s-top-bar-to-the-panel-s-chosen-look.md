# Match the phone's top bar to the panel's chosen look

Captured: 2026-10-13 · Status: inbox
Triaged: 1
From ticket: 0149

## What
When the panel runs as a home-screen app, the colour of the phone's top bar should follow the light or dark look chosen with the panel's button, not only the phone's own light or dark setting.

## Why
Someone who picks dark in the panel on a phone set to light gets a light top bar over a dark page, which looks broken.

## Notes
- From the builder's own note on 0149: its `theme-color` tags follow only the system setting, through media queries. The page's theme script could update the tag when the choice changes.

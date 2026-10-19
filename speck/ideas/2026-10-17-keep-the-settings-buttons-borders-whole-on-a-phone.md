# Keep the Settings view's buttons' borders whole on a phone

Captured: 2026-10-17 · Status: inbox
Triaged: 1
From ticket: 0281

## What
Give the Settings view's Close, Save, "this machine" and Save all buttons the same treatment 0281 gave its info buttons and boxes: edges on a whole pixel and borders at least one device pixel wide, so a phone draws all four sides.

## Why
0281 covered only the info buttons, lists, text boxes and number boxes. The view's other buttons still have half-pixel borders, and their right edges can fall on a fraction of a pixel, so an iPhone may drop one of their sides as it did the info buttons' left border.

## Notes
- From the builder's own note while building 0281. Not seen on a phone yet: check one before building.
- The rest of the panel's half-pixel borders were out of 0281's scope too; worth checking on a phone at the same time.

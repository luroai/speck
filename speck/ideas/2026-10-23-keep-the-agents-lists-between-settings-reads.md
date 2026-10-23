# Keep the agents' lists between Settings reads

Captured: 2026-10-23 · Status: inbox
From ticket: 0407

## What
Keep the agents' sign-in checks and model lists that the panel last read for a short while, so opening Settings again, or reading it again after a Save, fills in the lists at once instead of asking every agent's CLI again.

## Why
Since 0407, Settings opens at once, but each opening still asks Codex, Cursor and the others again, so the lists say they're loading for a few seconds every time. After a Save the old lists stay on show, but they're read again in full.

## Notes
- From the builder's own note on 0407. Open question: how long a kept list stays good, and whether Add or Remove in Your agents should clear it.

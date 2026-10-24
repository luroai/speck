# Skip speck's events from while the panel was hidden

Captured: 2026-10-23 · Status: ticketed (0446)
From ticket: 0414

## What
When the panel's tab has been hidden or the screen asleep, speck's screen shouldn't replay every pipeline event it saw meanwhile, one after another, when you come back. It could play only the latest few, or none older than a minute or so.

## Why
0414 plays every event in turn. The page keeps noting events while its tab is hidden, but the screen only plays them once it's drawn again, so after a few hours away you'd watch minutes of old ships and questions before speck shows what's happening now.

## Notes
- From the builder's own self-check on 0414. The reviewer held that 0414's criterion 4 asks for every event to play, so the cap was taken out: this needs a product decision on how stale an event may be.

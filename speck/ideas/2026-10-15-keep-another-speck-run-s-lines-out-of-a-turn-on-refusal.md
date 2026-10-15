# Keep another speck run's lines out of a Turn on refusal

Captured: 2026-10-15 · Status: inbox
From ticket: 0207

## What
When the panel turns speck run on, a refusal shows everything written to the shared run.log since the click. If a speck run is already on and writes a line in that moment (for example "Launched 0012"), the refusal shown on the page includes that line. The refusal should show only what the refusing speck run said.

## Why
The user sees a confusing message that mixes another run's news with the reason speck run didn't start. It's the same kind of mix-up 0207 fixed for speck run's first line, which only covered the moment just after it was turned on.

## Notes
- From 0207's own note while fixing 0128 AC4. Rare: it needs a build launch or exit to land within the half second a refusing speck run takes.
- One way: have speck run send its refusal somewhere of its own, for example to the panel's stderr, while it hasn't yet taken its lock.

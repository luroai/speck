# Find how two speck runs watched one repo

Captured: 2026-10-18 · Status: inbox
From ticket: 0319

## What
On 2026-10-18 two speck runs were watching this repo at once: process 434685, started on 16 Oct, and process 1571492, which took the lock at 14:54. speck run's lock should allow only one. Find how the second got past it, and stop that happening.

## Why
Two speck runs both launch, watch and ship the same tickets. Each reports the other's builds (0319 now calls them "already being built" rather than "outside speck run"), and each logs a build stopping, so run.log says it twice. They could also race to launch or ship the same ticket.

## Notes
- Found while building 0319: run.log showed every launch followed by the other run adopting it a check later.
- Open question: was the lock file removed by hand or by the panel, or taken over as stale while its holder was alive?

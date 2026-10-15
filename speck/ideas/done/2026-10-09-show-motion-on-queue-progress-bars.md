# Show motion on the queue's progress bars

Captured: 2026-10-09 · Status: ticketed (0055)

## What
More visual feedback when a ticket is in the build queue. Something like a dot of light moving side to side on its progress bar.

## Why
The bars in the panel's Queue don't move between steps, so the panel can look frozen while an agent works. Movement would make the user feel that something is working in the background.

## Notes
- This builds on the five-step bars from 0034 (done).
- It's motion only, not real progress. The panel shows only what's in the ticket files, and "live agent activity" is a separate, later idea (see `speck/ideas/2026-10-08-speck-board.md`).
- Which tickets get it: only in-flight ones (`building`, `reviewing`), or `ready` (Queued) ones too? It shouldn't suggest work is happening for a `blocked` ticket waiting on the user, or an `approved` one waiting to ship.
- Should the dot move across the whole bar or only on the current step?
- Should it respect the browser's reduced-motion setting?

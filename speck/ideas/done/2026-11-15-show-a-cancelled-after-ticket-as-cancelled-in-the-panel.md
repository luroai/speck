# Show a cancelled after: ticket as cancelled in the panel

Captured: 2026-11-15 21:05 · Status: ticketed (0704)
From ticket: 0686
Raised by: agent

## What
When a ready ticket's `after:` lists a cancelled ticket, the panel should say that ticket was cancelled and should be taken out of `after:`, rather than showing a lock and "Waiting on <id>".

## Why
speck run and `speck start` now say the cancelled ticket must come out of `after:`, but the panel's card still shows the ticket as waiting for it, so someone reading only the panel waits for a ticket that will never ship.

## Notes
- From 0686's own note: `waiting_on` still lists cancelled tickets (only done ones are left out); 0686 added `after_cancelled` to `speck status --json`, which the panel could read.

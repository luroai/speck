# Say an auto-ship ticket waits for speck run when it's off

Captured: 2026-10-15 · Status: inbox
From ticket: 0196

## What
When `speck run` is off, an approved ticket that `auto_ship` covers should say it's waiting for speck run (or for you to ship it), not "Approved · waiting to ship" with its builder badge at work.

## Why
Only `speck run`'s ship queue ships these tickets. With it off, nothing will ship them, yet the panel looks as if they're on their way, so the user may wait for a ship that never starts.

## Notes
- From the builder's own note on 0196, which shows these tickets as on their way whether or not `speck run` is on.
- Open question: should it turn purple (waiting for you), or say "waiting for Auto-build" in the normal colour?

# Hand back a pull request refused for private words

Captured: 2026-10-25 · Status: inbox
From ticket: 0506

## What
In pull request mode, when `speck ship --auto` refuses a ticket because a file under `speck/` holds a private word or the home folder's path (exit 17), speck run's pull request queue should hand the ticket back to its build, as its ship queue does in local mode.

## Why
Today the pull request queue hands back only a conflict (exit 13), so a ticket refused for private words waits for the Foreman or the user, even though its build has steps to take them out.

## Notes
- From 0506's own note: the ship check runs in both modes, but only the local ship queue maps exit 17 to a hand-back.

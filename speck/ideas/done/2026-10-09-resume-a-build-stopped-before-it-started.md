# Resume a build stopped before it started its ticket

Captured: 2026-10-09 · Status: ticketed (0219)
Triaged: 1
From ticket: 0072

## What
When `speck stop` ends a build before the build has run `speck start`, the ticket is blocked in the main checkout with no branch. `/speck-build <id>` on a blocked ticket runs `speck start`, which refuses because the ticket isn't ready. Give that case a clear way to carry on, for example letting `speck start` (or `speck set <id> status ready`) take a blocked ticket with no branch back to a fresh start.

## Why
Someone who stops a build in its first seconds gets a blocked ticket that `/speck-build` can't pick up, and has to work out to set it ready by hand.

## Notes
- From my own note while building 0072. Resuming its session (the panel's resume command) still works.
- Open question: should a ticket stopped before it started simply go back to ready rather than blocked? 0072's AC2 asks for blocked.

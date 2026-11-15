# Say in the panel when a waiting ticket can start

Captured: 2026-11-15 15:31 · Status: inbox
From ticket: 0675
Raised by: agent

## What
Where the panel says a ready ticket is waiting for an after: ticket, say instead that it can start on that ticket's approved work when `speck status --json` gives it a `starts_on`, and that an approved ticket waits to ship after the one it was built on (`ships_after`).

## Why
speck run now starts such a ticket while the panel still shows it as waiting, so the board reads as stuck when it isn't.

## Notes
- From 0675's own note: the panel's wording was out of its scope. The new fields are `starts_on` and `ships_after`.

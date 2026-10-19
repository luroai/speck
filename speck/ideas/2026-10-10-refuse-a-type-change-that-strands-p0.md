# Refuse a type change that leaves priority 0 on a non-fix ticket

Captured: 2026-10-10 · Status: dropped
Triaged: 2
From ticket: 0100

## What
`speck set <id> type <value>` should refuse to change a fix ticket at priority 0 to another type (or check `type` values at all), as `speck set <id> priority 0` already refuses on a non-fix ticket.

## Why
Today `speck set 0100 type bug` on a P0 fix ticket goes through, leaving a priority only lint catches later. Until then the ticket quietly drops to the bottom of every list, as an invalid priority.

## Notes
- From the builder's own self-check on 0100. `speck set` checks only `status` and `priority` values today.

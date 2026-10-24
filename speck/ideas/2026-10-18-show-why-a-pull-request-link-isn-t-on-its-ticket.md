# Show why a pull request link isn't on its ticket

Captured: 2026-10-18 · Status: dropped
Triaged: 1
From ticket: 0295

## What
When speck opened a ticket's pull request but couldn't write its link on the ticket, the panel's review pack should show the link and why it wasn't written, together, not just the link.

## Why
Today the panel shows only the link, so you can't tell from the panel that the ticket's own record is missing it, or that `speck pr <id>` would fix it. Only `speck pr`, `speck close` and speck run's output say so.

## Notes
- From the reviewer's minor finding F3 in 0295's round 2: prPart in the panel returns as soon as there's a link, hiding `pull_request.error`.
- `speck status --json` already gives both the link and the error.

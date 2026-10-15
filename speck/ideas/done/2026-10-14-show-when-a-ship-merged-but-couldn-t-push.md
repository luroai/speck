# Show when a ship merged but couldn't push

Captured: 2026-10-14 · Status: ticketed (0204)
From ticket: 0153

## What
When `speck ship` merges a ticket but the push to the remote fails, the panel should say so on the ticket, with speck ship's message, instead of showing it as plainly shipped.

## Why
speck ship sets the ticket done before it pushes. If the push fails, the panel moves the ticket to Shipped as if all went well, and the user doesn't learn that the base branch still needs pushing unless they were watching the terminal or the build log.

## Notes
- From the builder's own note on 0153: its ship record keeps an auto-ship's failure message, but the panel shows that only on an approved ticket, and a ticket whose push failed is already done.
- Open question: should this cover a ship the user started too, or only auto-ships?

# Show a panel ship in progress after a reload

Captured: 2026-10-12 · Status: inbox
From ticket: 0133

## What
When a ticket is shipping from its review pack and the panel page is reloaded or opened in another tab, show that it's still shipping, and show the result once it ends. The server already knows which ticket is shipping; `/api/state` could say so.

## Why
Only the page that clicked Ship knows a ship is running. After a reload the ticket shows as approved with a Ship button again until the ship ends, and a second click is refused with "is shipping". A failed push's message is lost too, so the user might not notice the remote wasn't updated.

## Notes
- From the builder's own note on 0133. Open question: keep the last ship's result on the server until it's read, or only while it runs?

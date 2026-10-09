# Set a ticket's priority with a click

Captured: 2026-10-09 · Status: ticketed (0076, 0077)

## What
A clickable priority on each ticket in the panel, so the user can set or change it there and triage fast.

## Why
Priority decides the order of the Tickets list and the order `speck run` builds ready tickets in, but today it's only shown as a `P<n>` tag. Changing it means editing the ticket file, which is slow when sorting through many tickets.

## Notes
- The panel already shows priority as a `P<n>` tag (`P1` highlighted) in `templates/panel.html`.
- Builds on the panel's write path from 0042 (Set ready): same `Origin` and token checks, and presumably the same "commit only that ticket's file" rule.
- Pairs with the Inbox idea (`2026-10-09-one-inbox-for-my-ideas-and-agent-notes.md`), where promoted tickets start with no priority set.
- Open questions:
  - Which tickets: drafts in Shaping only, or `ready` tickets in the queue too? Changing a ready ticket's priority changes what `speck run` builds next.
  - How the click works: cycle through P1–P5 and blank, or open a small picker?
  - Can it be cleared back to no priority?
  - Should in-flight and done tickets be editable? Probably not.

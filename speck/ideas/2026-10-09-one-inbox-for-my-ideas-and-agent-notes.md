# One Inbox for my ideas and agent notes

Captured: 2026-10-09 · Status: idea

## What
Merge the panel's Ideas and Inbox tabs into one view called **Inbox**. It lists the user's own ideas (from conversations with the agent) and the inbox notes build agents raise, with the agent ones labelled simply "agent". Each item gets a **Promote** and a **Cancel** button so the user can sort them. The folders stay as they are: everything in `speck/ideas/`. Promoting creates the ticket or tickets as `draft`, with no priority set.

## Why
One place to triage both the user's ideas and the things build agents spot and highlight to note or fix, rather than two tabs.

## Notes
- Changes delivered work: 0038 (done) made Inbox a separate Shaping tab with its own colour, and kept build follow-ups out of Ideas. 0056 (done) hid ticketed ideas from the Ideas list. 0037 (done) added triage from chat, which promote/cancel would give the panel a version of.
- "Agent" items are notes with `Status: inbox` (written by builds, with a `From ticket:` line). The user's own are `Status: idea`.
- Cancel presumably sets the note's `Status:` to `dropped`, as triage does, and leaves it in `speck/ideas/`.
- Promote: the panel can't write a ticket's problem, outcome and criteria by itself. Does it make one draft ticket from the note with `speck new --source=<note>` for the user to fill in, or hand the note to an agent to run `/speck-ticket`, which may split it into several tickets?
- "No priority set": the ticket template sets `priority: 3`, so promoted tickets need it left blank. Pairs with the clickable priority idea (`2026-10-09-set-a-ticket-s-priority-with-a-click.md`).
- Open questions: should agent items show which ticket raised them (as Inbox does today)? Should Cancel ask to confirm? What happens to the Inbox tab's own colour?

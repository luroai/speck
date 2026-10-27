# One Inbox for my ideas and agent notes

Captured: 2026-10-09 · Status: ticketed (0520)

## What
Merge the panel's Ideas and Inbox tabs into one view called **Inbox**. It lists the user's own ideas (from conversations with the agent) and the inbox notes build agents raise, with the agent ones labelled simply "agent". Each item gets a **Cancel** button so the user can clear out what's no longer wanted, and a short hint to talk to an agent to turn it into tickets. There's no Promote button. The folders stay as they are: everything in `speck/ideas/`. Tickets made from an idea start as `draft`, at P3 like every new ticket.

## Why
One place to triage both the user's ideas and the things build agents spot and highlight to note or fix, rather than two tabs.

## Notes
- Changes delivered work: 0038 (done) made Inbox a separate Shaping tab with its own colour, and kept build follow-ups out of Ideas. 0056 (done) hid ticketed ideas from the Ideas list. 0037 (done) added triage from chat, whose drop step Cancel would give the panel a version of.
- "Agent" items are notes with `Status: inbox` (written by builds, with a `From ticket:` line). The user's own are `Status: idea`.
- Cancel presumably sets the note's `Status:` to `dropped`, as triage does, and leaves it in `speck/ideas/`.
- Decision (user, 2026-10-09): no Promote button. Turning an idea into tickets needs a conversation with an agent, because an idea can still have unanswered questions or have gone stale since it was captured. The panel only hints at it, for example "Ask an agent to ticket this: /speck-ticket <path>".
- Priority: new tickets start at P3 (decided 2026-10-09, 0076 cancelled) and are re-prioritised from the panel (0077).
- Open questions: should agent items show which ticket raised them (as Inbox does today)? Should Cancel ask to confirm? What happens to the Inbox tab's own colour?

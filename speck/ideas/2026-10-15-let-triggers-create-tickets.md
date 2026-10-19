# Let triggers create tickets

Captured: 2026-10-15 · Status: idea

## What
Set up triggers that create work in speck by themselves. For example, an email inbox watcher that drafts a reply, or leaves a ticket for it in the Plan queue, so speck becomes a to-do list. Or a Zoom meeting summary that arrives and creates discovery tickets for what came up in the meeting.

## Why
Today every piece of work starts with the user capturing it. Much of it already arrives somewhere else: an email that needs answering, actions from a meeting. A trigger turns that into tickets waiting in Plan, so the user only checks and sets them ready, and nothing gets forgotten.

## Notes
- Builds on the jobs design (`~/projects/speck-notes/design/jobs.md`, not in git): message and discovery kinds, and connections such as Gmail and Zoom checked while shaping.
- Gate 1 stays: a trigger only creates drafts (or inbox notes). The user still checks every ticket before it's set ready, as decided on 2026-10-15. An email draft is never sent.
- Possible fit: the agent's inbox (`Status: inbox` notes, triaged into tickets) already works like a to-do list that agents add to.
- Open: which triggers come first (new email matching a rule, a Zoom summary arriving, a schedule)?
- Open: what runs the watcher? `speck run` polling a connection, Claude Code's own scheduled tasks or hooks, or a webhook?
- Open: how does a trigger avoid flooding Plan, for example one ticket per email thread, and a limit per day?
- Open: does each trigger have rules in `speck/config.yml` (which sender, which meetings), and who checks they're right?
- Likely part of 0.5.0 (jobs and the work install), or the release after.

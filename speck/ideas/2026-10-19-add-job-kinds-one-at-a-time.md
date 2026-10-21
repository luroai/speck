# Add job kinds one at a time

Captured: 2026-10-19 · Status: idea

## What
A roadmap for taking speck beyond code, one job kind at a time: writing documents first, then writing posts, then research, then email drafts, then triggers that create tickets on their own. Each kind ships, gets used and builds trust before the next one starts. It's like a to-do list board where the things get done on their own.

## Why
Always-on assistants (xAI's Grok Bot, OpenAI's) do things for you, and you have to trust them from day one. speck's difference is trust that's earned and shown: a ticket you checked, an independent reviewer, a record of every result, and settings that hand over more as trust builds, like hiring an employee. Code is one kind of job; most life admin and writing fits the same ticket, review and gates.

## Notes
- Design: `~/projects/speck-notes/design/jobs.md` (not in git). Its kinds, lanes and allow-lists still stand. This note sets the order of the kinds.
- Order:
  1. **Document**, such as a CV, a report or landing-page copy. It brings the shared groundwork with it: the `task` field, the outputs folder and the panel opening the result. Per-task allow-lists wait for writing posts. See `speck/ideas/2026-10-17-review-documents-an-agentic-task-writes.md`.
  2. **Writing posts**, such as Reddit and social posts. Drafts only; posting is held for the user. Dogfood it on speck's own launch posts.
  3. **Research**: web search, with every claim cited. Job matching needs it.
  4. **Email drafts** (Gmail): drafts, never sent.
  5. **Triggers**: an inbox or a scheduled job-board search drops draft tickets. See `speck/ideas/2026-10-15-let-triggers-create-tickets.md`.
- Trust per kind: every kind starts with the user holding Gate 2. Later, `auto_ship` could be set per kind, and speck could suggest a promotion from actuals ("your last 15 email drafts went out unedited").
- Same board for every kind, with a kind on each ticket, not a separate panel or a switch.
- Don't compete on always-on bots, bots talking to each other or web logins. Use their tools as ticket sources.
- Comes after the public launch, which positions speck as the layer that earns trust.
- Open: are posts and emails one "writing" kind or two? Does the trust ladder ever let speck send or post, which the jobs design rules out today?
- Context: notes on the Behind the Craft podcast episode (https://podcasts.apple.com/gb/podcast/behind-the-craft/id1736359687?i=1000791872961), where the guest called their pipeline a "Michelin kitchen", not a "software factory".
- 2026-10-21: Brought forward from after the launch. Called "task" in tickets, not "kind" (`task: code | document`). Document is ticketed as 0350 to 0355, built through `/speck-build` rather than a skill of its own, with each ticket naming its folder inside the ignored `outputs/`. Document tasks never auto-ship to begin with. Asking for changes on the same ticket (0356, 0357) replaces a new ticket per revision.

# Say what to do when the ticket a build started on is cancelled

Captured: 2026-11-15 15:03 · Status: inbox
Triaged: 1
From ticket: 0674
Raised by: agent

## What
When a ticket was started on another ticket's approved work and that ticket is then cancelled instead of shipped, `speck ship` and auto-ship should say so and what to do, rather than "ship it first".

## Why
The ticket can never ship as things stand: its ship refusal tells you to ship a ticket that will never ship, and it carries the cancelled ticket's work on its branch. Anyone who cancels the first ticket is left with a stuck second one and no way out but editing `built_on:` by hand.

## Notes
- From 0674's self-check: `speck ship` refuses while the `built_on:` ticket isn't done, and a cancelled one never will be.
- Open question: block the second ticket with a question (rebuild it from the base branch, or keep the cancelled ticket's work and review it as its own), or refuse naming both options.

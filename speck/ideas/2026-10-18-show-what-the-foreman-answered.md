# Show what the Foreman answered for you

Captured: 2026-10-18 · Status: inbox
From ticket: 0286

## What
When the Foreman takes a blocked ticket's recommendation (`foreman_fixing: fix`), show it in the Foreman's status detail in the panel and in `speck status`, with the ticket, the option and when, not only in the ticket's Notes and speck run's log.

## Why
The user can't easily see which questions were answered without them, so a choice they'd have made differently is easy to miss until the ticket ships.

## Notes
- From the builder's own note on 0286. 0287 AC4 shows what the Foreman agent did in the same detail, so the two could share a list.
- Open question: how long to keep showing an answer (until the ticket ships, or for a set time).

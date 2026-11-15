# Keep speck run's checks from re-reading build logs

Captured: 2026-11-15 15:05 · Status: inbox
From ticket: 0682
Raised by: agent

## What
Once 0682 stopped speck run re-reading unchanged tickets, a check on this repo still takes about 1.7 s of processor time. Most of it goes on reading every ticket's build log and run records and running git, all again on each check, even for done tickets.

## Why
An idle speck run still costs a share of a core that grows with the project's history, on a machine where tests already fail under load.

## Notes
- From the builder's profile of statusData on this repo (about 680 tickets) after 0682: child processes (git) about 2.9 s and build-log.mjs's readable about 2.4 s over four boards, plus buffer slicing from reading the logs.
- Open question: which of these a done ticket's board entry really needs on every check, or whether they could be kept by the log's own stat as 0682 does for tickets.

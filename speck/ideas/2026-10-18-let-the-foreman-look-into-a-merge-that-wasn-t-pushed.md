# Let the Foreman look into a merge that wasn't pushed

Captured: 2026-10-18 · Status: inbox
Triaged: 1
From ticket: 0287

## What
When speck run's ship queue merges a ticket but can't push it (0216), hand that stop to the Foreman agent too, with foreman_fixing: fix.

## Why
A push refused for the wrong GitHub account was one of the stops on 2026-10-17 that needed someone to step in. 0287 gives the Foreman only refused ships and builds that end stuck, so an unpushed merge still waits in run.log for the user.

## Notes
- From 0287's build: the ship queue's unpushed case returns before the Foreman is told. None of the Foreman's four actions pushes, so this needs a fifth (push again, once) or a fix ticket.

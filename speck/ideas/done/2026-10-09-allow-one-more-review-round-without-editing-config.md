# Allow one more review round without editing config

Captured: 2026-10-09 · Status: ticketed (0242)
From ticket: 0061

## What
Give the user a way to allow one extra review round for a single blocked ticket (for example `speck review <id> --extra-round`, or a field on the ticket) without raising `limits.max_review_rounds` in `speck/config.yml`.

## Why
When a build blocks at the round limit and the user says "one more review", the builder has to commit a raised limit on the branch and put it back before close. That's fiddly and easy to get wrong: a missed revert would ship a changed limit for every ticket. It has happened on 0008 (five times), 0011 and 0061.

## Notes
- From my own note on 0061, after the user allowed a fourth round.
- Open question: should the extra round be recorded in the ticket's Review rounds, or in the Delivery log as the user's decision?

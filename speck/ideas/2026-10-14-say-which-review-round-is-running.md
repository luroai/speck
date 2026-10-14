# Say which review round is running

Captured: 2026-10-14 · Status: inbox
From ticket: 0156

## What
A ticket under review says "<reviewer> is reviewing · round <n>" with the number of the last round already recorded. While a later round is running, it should say that round's number, or else say the builder is fixing the reviewer's findings.

## Why
Between rounds the ticket stays "reviewing", so after round 1 asks for changes the card says "round 1" while the builder is fixing and the reviewer is on round 2. Someone watching the panel can't tell whether the reviewer or the builder is at work.

## Notes
- From my own note while building 0156: it matches the stage name ("Review 1"), which has always used the last recorded round.
- Needs a way to tell "builder fixing" from "reviewer reviewing", which the ticket's status alone doesn't give.

# Carry on a handed-back build after the usage limit

Captured: 2026-11-10 23:11 · Status: inbox
From ticket: 0622
Raised by: agent

## What
When a build that was handed back on an approved ticket, such as to resolve a merge, stops on Claude's usage limit before it sets the ticket reviewing, speck run should carry it on after the reset, as it does for a ticket that's ready, building or reviewing.

## Why
0622 leaves approved tickets alone, so a ship can't race a resumed build. The hand-back is used up by then, so the ticket only moves when the next ship is refused again, which spends one of its hand-backs.

## Notes
- From my own note while building 0622. Open question: whether to keep the hand-back in the run record until the session has got past the limit.

# Say approved, not building, in a waiting ticket's Waits for fact

Captured: 2026-11-25 07:54 · Status: ticketed (0778)
From ticket: 0737
Raised by: agent

## What
In the panel's full view of a ready ticket, the Waits for fact names each ticket it waits on with its state. A ticket that is approved and waiting to ship is shown there as "building". It should say it's approved (or waiting to ship).

## Why
Someone reading why a ticket hasn't started is told the ticket before it is still being built, when it's actually done and waiting to ship. That points them at the wrong thing to chase.

## Notes
- Seen while taking 0737's pictures: 0001 waited on approved 0002, and its full view said "0002 building".
- The dependency states come from the panel model's DEP_WORDS (shipped, building, queued, cancelled); approved seems to fall under building.

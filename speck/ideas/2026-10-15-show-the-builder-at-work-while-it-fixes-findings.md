# Show the builder at work while it fixes findings

Captured: 2026-10-15 · Status: inbox
From ticket: 0223

## What
While a reviewing ticket's card says "<builder> is fixing round <n>'s findings", its builder badge should show the builder writing code, not the review pose ("The builder is with the reviewer").

## Why
Since 0223 the card's words say who is at work between review rounds, but the badge still shows the review loop the whole time the ticket is reviewing, so the picture and the words disagree for someone watching the Build queue.

## Notes
- From the builder's own note on 0223: `badgeOf()` in the panel picks the review pose for every reviewing ticket. 0223's criteria only covered the card's words.
- Open question: should the stage dot or border change too, or only the badge?

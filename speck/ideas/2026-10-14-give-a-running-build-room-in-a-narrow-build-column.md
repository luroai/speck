# Give a running build room in a narrow Build column

Captured: 2026-10-14 · Status: inbox
From ticket: 0156

## What
When the Build column is narrow (the panel's two-column layout at about 700 px wide), a running ticket's ensō takes so much of the card that its title and tags squeeze into a thin strip beside it. Find a layout that keeps the ensō while giving the title room, for example moving the ensō under the title when the card is narrow.

## Why
At 700 px the longest title wraps onto seven lines and a ticket's tags wrap onto two rows, so the card is tall and hard to scan on a tablet or a narrow desktop window. On a phone (375 px) it's better, but the title still takes four lines.

## Notes
- From my own note while building 0156: its tests now let an in-flight card's tags wrap beside the ensō, rather than requiring one row as 0155 did.
- Open question: is "beside the title" (0156 AC1) still wanted at every width, or only when there's room?

# Fit a closed card's stage and time on a phone

Captured: 2026-10-23 · Status: ticketed (0443)
From ticket: 0434

## What
On a phone, a closed Build card whose status starts with a long sentence, such as "Approved · waiting for you to ship it" or "Blocked · the Foreman will take its recommendation", has its stage and time cut off by the ellipsis. Shorten those sentences on a closed card, or put the stage and time first, so both always show.

## Why
Someone checking the Build lane on a phone can't see how long a blocked or approved ticket has waited without opening it.

## Notes
- Builder's own note from 0434: since 0434, a closed Build card's status line is one line, cut off with an ellipsis where it doesn't fit (seen at 375 px in 0156's layout test).
- Open question: shorter words ("Waiting to ship", "Has a question") or a different order?

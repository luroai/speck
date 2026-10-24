# Line up an open shipped ticket's title

Captured: 2026-10-24 · Status: inbox
From ticket: 0494

## What
When a shipped ticket is opened, its title should start as far from the top of its card as an open Build or Plan ticket's, as 0494 did for a closed one.

## Why
Opening a shipped card drops its title about 11 px lower than an open Build or Plan card's, on a phone and with a mouse, so the lanes don't match once a card is open.

## Notes
- From the builder's own measurement after 0494, in Chromium at 390 px on a touch screen: an open shipped card's title text starts 19 px down its card, Build 8 px, Plan 7 px.
- The open title is still a 44 px box with its text centred in it. 0494's fix (a 22 px line with padding and negative margins for the tap area) may apply here too.

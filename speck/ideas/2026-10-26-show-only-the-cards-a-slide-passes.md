# Show only the cards a slide passes

Captured: 2026-10-26 · Status: inbox
From ticket: 0517

## What
While the lanes slide, show only the cards the slide passes over (Build and Shipped for a slide between them) rather than all three, so the first frame lays out less.

## Why
A slide's first frame lays out every card, Plan's list included, even when it's never in view. The first lane change after the page opens pays most for it (about 35 ms of a 50 ms budget on a slowed-down CPU in 0517's testing), so on a slow laptop or phone the first swipe can still feel late.

## Notes
- From 0517's build: once the redraw and the buttons' measuring were held until the card is at rest, laying the cards out was what was left in the first frame.
- A finger drag shows the cards on both sides of the open one, so this would be for 'settle' slides only, unless a drag also knew which way it was going.

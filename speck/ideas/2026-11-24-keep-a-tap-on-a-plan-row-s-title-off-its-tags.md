# Keep a tap on a Plan row's title off its tags

Captured: 2026-11-24 17:53 · Status: inbox
From ticket: 0739
Raised by: agent

## What
On a touch screen, a tap near the start of a closed Plan row's title can open the priority menu or a tag's note instead of the row, because the browser moves a tap that lands close to a button onto that button. Check it on a real phone, and if it happens, give the title's start some room from the details line's tags.

## Why
Since 0727 took Set ready off a closed row, its title runs right above its tags, 2 px away. Someone on a phone who taps a row's title to open it may get a tag instead.

## Notes
- Builder's own note from 0739: in headless Chrome at 375 px with touch, a tap 4 px inside the title's left end landed on the "low" tag below it. A tap in the title's middle opened the row.
- Unchecked on a real phone, where a finger's touch area is larger than the test's.

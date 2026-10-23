# Make 0060's touch swipes really scroll

Captured: 2026-10-23 · Status: inbox
From ticket: 0429

## What
The full-ticket pane's browser test (0060) swipes with a simulated finger to check the page never moves. Those swipes scroll nothing at all, even where the pane itself could scroll. Make the test's swipes really scroll the pane, and check that one does, so the "page stays still" checks after them mean something.

## Why
Right now the touch checks would pass whatever the page did with a swipe, so a change that let a swipe scroll the page behind the pane on a phone wouldn't be caught.

## Notes
- Found while speeding up the test in 0429. At both the old speed (2000 px a second) and the new one (8000), a swipe up from the pane's top left it at the top.
- Open question: whether headless Chrome's simulated touch gestures need touch emulation turned on (Emulation.setTouchEmulationEnabled) to scroll at all.

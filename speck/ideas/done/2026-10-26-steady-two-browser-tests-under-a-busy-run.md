# Steady two browser tests under a busy run

Captured: 2026-10-26 · Status: ticketed (0542)
From ticket: 0516

## What
Make 0372 AC2 (dark look kept after a reload) and 0476 AC2 (trackpad and arrow keys change lane in the same time) pass reliably when nearly the whole suite runs at once, as `speck test --related` does after a change to a shared test helper.

## Why
Both failed under that load during 0516's build and passed on their own every time (0476 AC2 also on the base code alone). A failure like this at `speck ship` hands a ticket back for nothing, and while building it costs a builder time to rule out its own change.

## Notes
- From 0516's own test runs. 0372 failed with "Inspected target navigated or closed" while it reloads the page. 0476 AC2 got `plan` where it expected `build`.
- Open question: wait for the reload or lane change with a time limit rather than a fixed pause, or run these tests one at a time?

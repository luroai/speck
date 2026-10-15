# Stop the review pack's elapsed time at approval

Captured: 2026-10-12 · Status: ticketed (0215)
From ticket: 0139

## What
The review pack's "Elapsed since build started" line counts up to the moment the pack is read. Once a ticket has an `approved` time, it should show the time from started to approved, as the panel now does.

## Why
Reading the pack of a ticket that has waited to be shipped shows a time that includes the wait, so it disagrees with the panel and looks wrong to the person deciding whether to ship.

## Notes
- From the builder's own note on 0139, which changed only the panel's times.
- The Delivery log's elapsed line is written at approval, so it is already about right; only the pack read later drifts.

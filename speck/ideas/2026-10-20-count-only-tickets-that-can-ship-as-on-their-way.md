# Count only tickets that can ship as on their way

Captured: 2026-10-20 · Status: inbox
From ticket: 0338

## What
When the panel decides whether a handed-back ticket will be shipped again, it counts any other approved ticket as "on its way". Count an approved ticket only when it can ship by itself: one auto-ship covers whose own last auto-ship hasn't failed.

## Why
Two approved tickets whose auto-ships both failed, with their builds ended, each count the other as on its way. Neither turns red, so the user isn't told they're needed, though nothing will ship either of them.

## Notes
- From the builder's own note in 0338. Its AC2 counts any approved ticket, so 0338 kept to that.
- Open question: should an approved ticket waiting for the user (auto-ship doesn't cover it) count? Its ship would give main a new commit, but only once the user ships it.

# Let a review round outlast the builder's shell limit

Captured: 2026-10-22 · Status: ticketed (0384)
From ticket: 0368

## What
A review round that takes longer than the builder's shell allows one command to run should still finish and be recorded, without the builder having to improvise a way to wait for it.

## Why
speck lets a reviewer run for `review_timeout_minutes` (30 by default), and the review skill tells the builder to run `speck review` in the foreground and wait. Claude Code caps one foreground command at 10 minutes, and builds that `speck run` starts can't run commands in the background (0245). On 0368, with `reviewer: cursor` on grok-4.7-high, the round was still running at 10 minutes, so the builder's shell ended it. The builder then restarted the round detached with `setsid` and polled a log file in under-10-minute loops, which the skills don't describe.

## Notes
- Related: 0180 (the reviewer's time limit), 0227 (keep test runs and review rounds in the foreground), 0245 (no background commands in speck run's Claude Code builds).
- For scale: 0374's small round 1 took Grok about 5 minutes.

# Try the next on the bench when a stand-in is limited too

Captured: 2026-11-11 15:04 · Status: inbox
From ticket: 0649
Raised by: agent

## What
When the reviewer's stand-in refuses a round for its own usage limit, run the round on the next agent on reviewer_bench that can take it, rather than ending it.

## Why
Today a round gets one stand-in. If that one is limited too, but not yet on record, the build waits for the stand-in's reset even with a third agent free on the bench.

## Notes
- From my own note while building 0649. The refusal overwrites the build's record of the reviewer's limit with the stand-in's, as both use the ticket's one record file, so speck run resumes after the stand-in's reset rather than the reviewer's.

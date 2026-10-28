# Steady the 0384 run-twice-at-once test

Captured: 2026-10-28 · Status: inbox
From ticket: 0540
Raised by: agent

## What
"0384 AC2: speck review run twice at once starts one reviewer, and its round is recorded once" should pass however busy the machine is.

## Why
It failed once in a full run of its file with 24 busy CPU loops, so it may stop `speck ship` for a ticket that didn't break it.

## Notes
- From 0540's build. It didn't fail again in 12 runs of the test alone under the same load, with or without 0540's change, so it may be rare. Its 1.5 s wait may be too short on a very busy machine. Not checked.

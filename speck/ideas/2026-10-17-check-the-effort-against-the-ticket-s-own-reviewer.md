# Check the effort against the ticket's own reviewer

Captured: 2026-10-17 · Status: inbox
Triaged: 1
From ticket: 0276

## What
`speck lint` and `speck config set` accept an effort Codex lists, such as `ultra`, whatever the reviewer is. A ticket with `reviewer: claude-subagent` (or a command reviewer) and `reviewer_effort: ultra` passes lint, then reaches a reviewer that may not support it. Check a codex-only effort only when the ticket's reviewer is codex.

## Why
The mistake shows up only when the review round starts, in the middle of a build, rather than when the ticket is set ready.

## Notes
- From the builder's own note on 0276: knownEffort asks whether any Codex model lists the effort, not whether this ticket's reviewer supports it.
- Open question: what efforts does a claude-subagent reviewer accept? The Agent tool takes low to max today.

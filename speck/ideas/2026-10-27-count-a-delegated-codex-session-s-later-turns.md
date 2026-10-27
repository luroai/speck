# Count a delegated Codex session's later turns

Captured: 2026-10-27 · Status: inbox
From ticket: 0534
Raised by: agent

## What
A Codex session started in a ticket's worktree is recorded once, with the tokens it had when the build ended. If a later build carries the same session on (`codex exec resume`), the extra tokens aren't counted. Update the session's record to its newest total when a later build ends, still counting the session once.

## Why
A builder that resumes its research session on a later build would show less spend than it really cost, and the user wouldn't know.

## Notes
- From 0534's own note: `recordDelegatedSpend` skips any thread already in `run.delegated-spend.jsonl`. A sub-agent added under a recorded session later is missed the same way.

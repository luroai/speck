# Count a resumed Cursor build's tokens

Captured: 2026-10-18 · Status: dropped
Triaged: 1
From ticket: 0291

## What
Check whether the usage on a Cursor build's result line covers the whole chat or only that one run. If it's per run, add up every run's usage in a resumed build's log rather than taking the last one.

## Why
speck takes a build's tokens from the last result line in its log. That's right for Claude Code and Codex, whose usage covers the whole session, but if Cursor counts only the run it ends, a Cursor build that was stopped and resumed, or handed back, shows fewer tokens than it used.

## Notes
- From 0291's own note: Codex was checked by resuming a session, Cursor wasn't. 0291's notes say a quick check of a resumed Cursor chat printed no result line.
- Also worth checking at the same time: what Cursor's result text holds (the last message or the whole turn's messages), which 0291's log reader assumes it may run together.

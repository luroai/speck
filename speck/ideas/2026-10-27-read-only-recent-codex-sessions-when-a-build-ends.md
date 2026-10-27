# Read only recent Codex sessions when a build ends

Captured: 2026-10-27 · Status: inbox
From ticket: 0534
Raised by: agent

## What
When a build ends, `speck run` reads the first line of every session file in `~/.codex/sessions` to find the ones started in the ticket's worktree, and reads them all again for each one it finds, to collect its sub-agents. Have it read only the session files that changed since the ticket's first build started.

## Why
Every build does this, even one that never ran Codex. A Codex session file's first line holds Codex's whole instructions, tens to hundreds of kilobytes, so with months of sessions kept, each build's end reads a lot of data. On a big sessions folder that could make a build's end take noticeably longer.

## Notes
- From 0534's own note while building it. `codexSessionsIn` and `codexSubagents` in `scripts/round-cost.mjs` each walk the whole folder. 0532's Codex build spend does the same, but only for Codex builds.
- Open question: whether the day folders (`YYYY/MM/DD`) are enough to skip old files, or whether each file's last change is needed.

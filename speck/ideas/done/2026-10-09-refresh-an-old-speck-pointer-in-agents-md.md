# Refresh an old speck pointer in AGENTS.md

Captured: 2026-10-09 · Status: ticketed (0123)
From ticket: 0068

## What
When `speck init` runs in a project whose AGENTS.md already has a speck section, it should bring that section up to date rather than leave it as an older speck wrote it.

## Why
`init` skips the section once "This repo uses speck" is there, so projects set up before 0068 keep telling agents to "Read `speck/product.md` first", a file speck no longer creates or keeps up to date.
Agents in those projects read a stale or missing spec before every build.

## Notes
- From my own note while building 0068.
- 0006's Delivery log noted the same limit for the old "Never merge" wording, but no idea or ticket picked it up.
- Open question: how to replace only speck's own section when the user may have edited it.

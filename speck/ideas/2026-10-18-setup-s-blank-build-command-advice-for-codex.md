# Setup's blank build_command advice for Codex

Captured: 2026-10-18 · Status: dropped
Triaged: 1
From ticket: 0289

## What
In section 6 of the setup skill, the paragraph for builders other than Claude Code covers Codex with a command of its own, and still offers `build_command: ""` as the way to stop `speck run` starting builds. For Codex, a blank `build_command` now starts every build automatically, with approvals and the sandbox off. Offer that advice only for Cursor and Gemini, and tell Codex users who don't want automatic builds to leave `speck run` off.

## Why
A Codex user who says no to automatic builds could be told to do the one thing that turns them on, with no prompts.

## Notes
- From reviewer finding F2 (minor) in 0289's merge round.

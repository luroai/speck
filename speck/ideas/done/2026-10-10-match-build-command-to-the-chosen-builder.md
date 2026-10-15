# Match build_command to the chosen builder

Captured: 2026-10-10 · Status: ticketed (0211)
Triaged: 1
From ticket: 0088

## What
When setup (or the user) sets `builder` to Codex, Cursor or Gemini, `build_command` still starts Claude Code. Setup should offer a matching `build_command` for the chosen builder, or speck should warn when the two don't match.

## Why
Someone who picks a non-Claude builder in `/speck-setup` gets `speck run` builds that launch Claude Code anyway, or fail if it isn't installed. Non-technical users won't spot the mismatch.

## Notes
- From the builder's own note while building 0088: section 5 of `speck-setup` lets the user choose another builder, but section 6 only explains Claude's `--dangerously-skip-permissions` flag.
- Open: should speck ship known build commands per builder (as data, since flags change), or should `speck doctor` just flag the mismatch?

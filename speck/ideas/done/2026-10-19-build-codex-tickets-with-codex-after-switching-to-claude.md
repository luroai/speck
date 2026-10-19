# Build Codex tickets with Codex after switching to Claude Code

Captured: 2026-10-19 · Status: ticketed (0324)
From ticket: 0312

## What
`speck run` builds each ticket with its own builder only when `build_command` is blank. Switching the builder to Claude Code sets `build_command` to Claude Code's, and a blank one with `builder: claude` is refused, so after switching back, tickets made with Codex or Cursor are built by Claude Code. Let a Claude Code setup build them with their own builder too, or have the Settings view say they won't be.

## Why
The Settings view says tickets already made keep the builder they were made with. After switching to Claude Code, that holds for the ticket file but not for who builds it. `speck run` says so once as it starts, but the panel doesn't.

## Notes
- From the builder's own note on 0312. Open: allow `builder: claude` with a blank `build_command`, or only change the Settings wording?

# Offer Cursor as a reviewer in the Settings view

Captured: 2026-10-20 · Status: inbox
From ticket: 0332

## What
The panel's Settings view should offer `cursor` as a reviewer when Cursor is installed and signed in, with Cursor's models for `reviewer_model`, as it offers `claude`.

## Why
Since 0332 a Cursor reviewer needs no command, but the Settings view lists only `codex`, `claude`, `claude-subagent` and names that have a command under `reviewer_options`, so someone using the panel can't pick it.

## Notes
- Builder's own note: `scripts/settings.mjs` (the reviewer choices and `REVIEWER_AGENTS`).

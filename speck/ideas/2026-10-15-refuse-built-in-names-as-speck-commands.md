# Refuse built-in names as speck commands

Captured: 2026-10-15 · Status: inbox
Triaged: 1
From ticket: 0231

## What
`speck constructor` (or `toString`, `hasOwnProperty`) should say "Unknown command" and exit 1, like any other unknown command, instead of printing nothing and exiting 0.

## Why
The command lookup finds built-in object properties, so a mistyped or odd command looks like it worked. Someone scripting speck gets a silent success for something that did nothing.

## Notes
- Builder's own note while building 0231: the dispatch in `scripts/speck.mjs` checks `COMMANDS[cmd]` without `Object.hasOwn`. 0231 kept it as it was, since its criteria asked for the CLI to behave exactly as before.

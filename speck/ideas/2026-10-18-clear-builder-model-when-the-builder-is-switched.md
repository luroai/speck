# Clear builder_model when the builder is switched

Captured: 2026-10-18 · Status: dropped
From ticket: 0293

## What
Switching the builder in the Settings view or with `speck config set builder` leaves `builder_model` as it was. Clear it, or ask, when it names a model the new builder doesn't list.

## Why
A Claude model name such as `opus` is passed to Codex as `-m opus` and to Cursor as `--model opus` once the builder is switched, so every build `speck run` starts fails until someone notices and changes it.

## Notes
- From the builder's own note on 0293. The Settings view only lists the saved builder's models, so it can't offer the new builder's until the switch is saved.

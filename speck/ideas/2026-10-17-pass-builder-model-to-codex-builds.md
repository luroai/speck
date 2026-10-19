# Pass builder_model to Codex builds

Captured: 2026-10-17 · Status: dropped
From ticket: 0279

## What
When the builder is `codex`, give `builder_model` to each build `speck run` starts, as Codex's own model option (`-m`), the way Claude Code builds get `--model`.

## Why
The Settings view already offers Codex's models for `builder_model` with `builder: codex`, but picking one does nothing: `speck run` only says in one line that it's passed to Claude Code builds. Someone building with Codex can't choose its model without editing `build_command` by hand.

## Notes
- From the builder's own note on 0279, which put other builders out of its scope (its AC5).
- Open question: which option each other builder (Cursor, Gemini) takes, and whether to cover them in the same ticket.

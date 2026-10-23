# Name Codex's default from its own settings

Captured: 2026-10-23 · Status: inbox
From ticket: 0403

## What
Settings labels Codex's first-listed model as its "(default)". When Codex's own settings file (~/.codex/config.toml) names a model, label that one as the default instead.

## Why
Codex runs the model in its own settings when speck passes none. Someone who set a different model there sees the wrong model marked "(default)", and may pick it thinking it restores what runs today.

## Notes
- From 0403's own note: Codex marks no default when it lists models, so 0403 takes the first it lists. Open question: whether to read CODEX_HOME too, and how to keep tests independent of the machine's own Codex settings.

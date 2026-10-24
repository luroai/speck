# Same-model check knows a provider build's model

Captured: 2026-10-23 · Status: dropped
From ticket: 0391

## What
When DeepSeek both builds and reviews, the same-model check should know the build's model: builder_model, or DeepSeek's default model, which speck now always passes. Today it treats the build's model as unknown, so the pair is refused even when the two run different DeepSeek models.

## Why
Someone using only DeepSeek, building on deepseek-v4-pro and reviewing on deepseek-v4-flash, has to set allow_same_model_review: true, which also lets two identical models through.

## Notes
- From the builder's own note while building 0391. The builder's model is worked out in scripts/same-model.mjs, which knows Claude Code, Codex and Cursor only.

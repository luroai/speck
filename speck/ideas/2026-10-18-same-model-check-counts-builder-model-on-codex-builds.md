# Same-model check counts builder_model on Codex builds

Captured: 2026-10-18 · Status: dropped
From ticket: 0289

## What
Now that speck run passes `builder_model` to Codex builds (with `builder: codex` and `build_command: ""`), the same-model check should count it, as it does for Claude Code. A Codex builder and a Codex reviewer on two different models would then be allowed without `allow_same_model_review`. The wording that says `builder_model` "is only passed to Claude Code builds" (the same-model message, and speck run's note for a Codex `build_command` of your own) should say which builds get it.

## Why
Someone building and reviewing with Codex on two different models is still refused, and told that `builder_model` isn't passed to their builds, which is no longer true when speck starts the builds itself.

## Notes
- From the builder's own note on 0289: `sameModelProblem` in `scripts/same-model.mjs` only counts `builder_model` for `builder: claude`. 0280's test pins today's message for a Codex config with no `build_command`, so that test needs updating with the change.

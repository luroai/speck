# Know when a stopped build starts again

Captured: 2026-10-15 · Status: dropped
From ticket: 0217

## What
Have speck know reliably when a ticket whose build stopped gets a new build, however it was started. Today it knows only through `speck run`'s own resume or `speck start <id>`. Once it knows, `speck status`, the panel and `speck run` should all treat the old build as replaced.

## Why
A session resumed by hand that never runs `speck start` isn't seen, so its ticket stays shown as stopped, with its timer held, while it's being built. `speck status` still prints "Build stopped unexpectedly" for a killed build after `/speck-build` has started the ticket again in a new session. And `speck run` may resume the old session alongside the new build.

## Notes
- From my own note while building 0217, which counts a stopped build's waiting from `speck start` and `speck run`'s resume only.
- Open question: should a new build register itself (for example its session) when it starts, so speck needn't infer it from processes?

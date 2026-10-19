# speck detect finds Cursor as agent

Captured: 2026-10-18 · Status: dropped
From ticket: 0288

## What
`speck detect` still looks only for `cursor-agent` on the PATH, while Cursor's CLI is now `agent` and `speck agents` finds either. Make `speck detect` find Cursor by either name too, or have it use what `speck agents` finds.

## Why
Someone with only the newer `agent` command installed gets `cursor-agent.on_path: false` from `speck detect`, so anything reading it, including setup's Gemini check and the brief's description, has an out-of-date view of Cursor.

## Notes
- From the builder's own note while building 0288. 0290 finds Cursor by both names for `speck run`, but doesn't touch `speck detect`.
- Open: keep the `cursor-agent` key in detect's JSON for compatibility, or rename it to `cursor`?

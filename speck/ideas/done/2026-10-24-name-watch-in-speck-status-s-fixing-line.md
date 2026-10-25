# Name watch in speck status's Fixing line

Captured: 2026-10-24 · Status: inbox
From ticket: 0487

## What
`speck status` still prints "· Fixing on" and a "Fixing: fix. …" line when `watch` is `fix`. Say it with the setting's name instead, such as "watch: fix", so the line matches Settings and `speck config`.

## Why
Since 0487 the setting is called `watch`, and nothing else calls it Fixing, so someone reading `speck status` can't tell which setting the line is about.

## Notes
- From the builder's own note on 0487: "Fixing" isn't a setting name, so 0487 left it. `FIXING_SAYS` and the status lines are in `scripts/foreman.mjs`.
- Check tests that match "Fixing" in status output (0317, 0451) before changing it.

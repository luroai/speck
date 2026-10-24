# Decide where setup saves the agents it picks

Captured: 2026-10-22 · Status: dropped
From ticket: 0386

## What
Setup records the builder, reviewer, Foreman and auto-ship choices with `speck config set`, which since 0386 saves them for this machine only. Decide whether setup should also save them as the project's defaults in speck/config.yml (with `--repo`), and say which it did.

## Why
On a new project, the person setting it up gets their choices, but speck/config.yml keeps the template's defaults, so anyone else who clones the project starts with different agents and auto-ship off without knowing why.

## Notes
- From the builder's own note while building 0386; `skills/speck-setup/SKILL.md` says "Record every setting with `speck config set <key> <value>`".
- Related, not the same: speck/ideas/2026-10-20-keep-setup-s-defaults-for-shipping-and-limits.md (which questions setup asks).

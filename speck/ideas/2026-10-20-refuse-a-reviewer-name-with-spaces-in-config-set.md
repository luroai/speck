# Refuse a reviewer name with spaces in config set

Captured: 2026-10-20 · Status: inbox
From ticket: 0332

## What
`speck config set reviewer <value>` should refuse a value that can't be a reviewer's name, such as one with spaces, and refuse flags it doesn't know rather than taking them as part of the value.

## Why
During 0332's build, `speck config set reviewer cursor --dry-run` set `reviewer: cursor --dry-run` in `speck/config.yml` instead of refusing the unknown `--dry-run`, which would break every review until fixed by hand.

## Notes
- Builder's own note. Open question: which characters a reviewer name may hold, as any name with a command is allowed.

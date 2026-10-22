# Change your own settings without a commit

Captured: 2026-10-22 · Status: ticketed (0386, 0387, 0388)

## What
Changing which agents build, review and run the Foreman, and how speck run behaves, shouldn't need a git commit or push. Keep those choices in a file git ignores, beside the per-machine values from 0260, and keep speck/config.yml in git for the project's own facts: test commands, checks, limits, base branch and ship mode.

## Why
Today every setting lives in speck/config.yml, which is committed. The panel's Save commits it and refuses while the file has uncommitted changes, builds read the copy in their own worktree, and tickets copy the reviewer when they're made. On 2026-10-22, switching the reviewer from Codex to Grok and back took several commits to config.yml and to every open ticket, and those commits then rode along with the next ship's push.

## Notes
- speck/config.yml stays as the project's defaults, so a fresh clone or another machine still works. Your own values go on top.
- Builds in worktrees already read this machine's values from the main checkout (scripts/machine.mjs), so a change reaches them without a commit.
- Discussed with the user on 2026-10-22, who asked for it in 0.13.0.

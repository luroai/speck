# Spot another workflow during setup

Captured: 2026-10-11 · Status: ticketed (0124)

## What
When speck is set up in a project that already uses another spec or agent workflow, such as OpenSpec, setup should notice it, explain the clash in plain words and ask what to do. It should also flag rules in the project's own agent instructions that contradict how speck works. It never removes or edits the other workflow itself.

## Why
Found while planning to move another of the maintainer's projects from OpenSpec to speck (2026-10-11). The files don't clash, but the workflows do: two sources of truth give agents conflicting instructions, and that project's AGENTS.md bans git worktrees and requires pull requests, both of which speck relies on not doing. People coming from OpenSpec, which speck's README names as its inspiration, will hit this.

## Notes
- The user's view: OpenSpec means too much reviewing of documents and ceremony. They want to set off an automated pipeline, not orchestrate builds, reviews, re-reviews, PRs and branch clean-up by hand.
- Decided: spot and ask, never remove. The other workflow's specs and the project's policies hold decisions only the user can make.
- Follow-on worth its own ticket: untracked files a build needs, such as `.env.local` or local data, aren't in a worktree. Setup could offer a `worktree_setup` that links them.

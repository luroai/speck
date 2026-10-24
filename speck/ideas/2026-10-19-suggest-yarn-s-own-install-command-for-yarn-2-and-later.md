# Suggest Yarn's own install command for Yarn 2 and later

Captured: 2026-10-19 · Status: dropped
From ticket: 0322

## What
For a project on Yarn 2 or later (a `packageManager` such as `yarn@4.2.2`, or a `yarn.lock` with Yarn 2's `__metadata` header), `speck detect` should suggest `yarn install --immutable` as `worktree_setup` rather than `yarn install --frozen-lockfile`, which Yarn 1 uses.

## Why
Yarn 2 and later deprecated `--frozen-lockfile` in favour of `--immutable`. So setup offers newer Yarn projects a flag that isn't their own, and the user may have to correct it, as they had to with pnpm's test command before 0322.

## Notes
- From the 0322 build's own note: 0322 reads `packageManager` now, so the Yarn version is often there to read.
- Open question: whether to read the lockfile's header too, when there's no `packageManager`.
- Unverified: how Yarn 4 treats `--frozen-lockfile` today (a warning, or an error).

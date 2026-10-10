# Suggest the test command for the project's package manager

Captured: 2026-10-10 · Status: inbox
From ticket: 0086

## What
`speck detect` suggests `npm test` for any package.json with a real test script, even when the lockfile shows pnpm, yarn or bun. It could suggest `pnpm test`, `yarn test` or `bun test` to match the install command it already picks.

## Why
A project that uses pnpm or yarn may not have npm set up the same way, so setup would offer a test command the project doesn't normally use. Setup (0088) runs the command once to confirm it, but a mismatched suggestion is still a step the user has to correct.

## Notes
- From my own note while building 0086: its AC5 asks for `npm test` only, so this is a behaviour change for a later ticket.
- Open question: should `packageManager` in package.json win over the lockfile when they disagree?

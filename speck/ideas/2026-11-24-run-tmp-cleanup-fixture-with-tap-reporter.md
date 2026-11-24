# Run the tmp-cleanup fixture with the TAP reporter

Captured: 2026-11-24 15:00 · Status: dropped
From ticket: 0719
Raised by: agent

## What
`test/tmp-cleanup.test.mjs` should spawn its nested fixture with `--test-reporter=tap` (or match the default reporter's `ℹ fail` line), so the check for two failures passes on Node 24.

## Why
The check expects TAP's `# fail 2`, but Node's default reporter now prints `ℹ fail 2`, so every `speck test --files` that runs `commands.checks` fails on this machine even when nothing else is wrong.

## Notes
- Spotted during 0719's related run; fails with that branch's changes stashed too.
- Other tests that need `# fail` already pass `--test-reporter=tap`.

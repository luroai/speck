# Say why Codex failed a review round

Captured: 2026-10-28 · Status: inbox
From ticket: 0540
Raised by: agent

## What
When Codex fails during a review round, `speck review` should show Codex's own reason, such as reaching its usage limit and when it resets, not just "codex exited 1:" with nothing after it.

## Why
A builder (or the user) can't tell a usage limit from a broken setup or a bad prompt, so a build blocks without saying what to do. In 0540's build the reason only showed when Codex was run by hand.

## Notes
- From 0540's own note: Codex's `--json` output probably carries the error as an event rather than on stderr, so speck's message had nothing to show. Not checked.

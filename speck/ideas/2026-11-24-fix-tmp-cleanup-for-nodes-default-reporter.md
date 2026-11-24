# Fix tmp-cleanup for Node's default reporter

Captured: 2026-11-24 15:13 · Status: inbox
From ticket: 0722
Raised by: agent

## What
Make `test/tmp-cleanup.test.mjs` accept Node's current default test reporter (or spawn with `--test-reporter=tap`), so its check for `# fail 2` still passes when the fixture prints `ℹ fail 2`.

## Why
Every `speck test --files` run includes this checks file, and it fails on current Node even when the ticket under test is fine. That blocks clean builds and would fail ship until fixed.

## Notes
- Found while building 0722; the failure is unchanged with 0722's edits reverted.
- Other tests that assert on `# fail` already pass `--test-reporter=tap` to the fixture spawn.

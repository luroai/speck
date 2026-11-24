# Accept Node's fail-count line in tmp-cleanup

Captured: 2026-11-24 15:20 · Status: dropped
From ticket: 0724
Raised by: agent

## What
`test/tmp-cleanup.test.mjs` AC1 AC2 should match the fail-count line Node's test runner prints today (`ℹ fail 2`), not only the older `# fail 2` form.

## Why
On Node v24 every `speck test --files` run fails that check, even when nothing else is wrong, so builds and ships see a red check that isn't about their change.

## Notes
- Seen while building 0724; fails the same way without that ticket's changes. The check only wants to know two tests failed in the fixture run.

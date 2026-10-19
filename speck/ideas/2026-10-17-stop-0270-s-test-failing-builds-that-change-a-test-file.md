# Stop 0270's test failing builds that change a test file

Captured: 2026-10-17 · Status: dropped
From ticket: 0272

## What
The 0270 test "no existing test file changed, so none needed new imports" compares the branch with where it left main, so it fails on any later ticket's branch that edits an existing test file. It should check only 0270's own change, or be removed now 0270 has shipped.

## Why
A builder running that file during a build sees a failure that has nothing to do with their ticket, and it can't go in `commands.checks` as it stands. On main it passes, so `speck ship` never shows it.

## Notes
- Found while choosing the files for `commands.checks` in 0272 (builder's own note).
- 0270 AC2 repeats 0078 AC2, which is already in `commands.checks`.
